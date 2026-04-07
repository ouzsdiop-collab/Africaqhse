import { qhseFetch } from '../utils/qhseFetch.js';
import { showToast } from '../components/toast.js';
import { NOTIF_TIER } from '../services/notificationIntelligence.service.js';

/** @type {Array<object>} */
const items = [];

/** Notification locale groupée (documents / preuves) — hors API. */
let localDocCompliance = /** @type {{ fingerprint: string; item: object } | null} */ (null);

function linkFor(item) {
  switch (item.kind) {
    case 'incident': {
      const m = /^Incident critique — (.+)$/.exec(item.title);
      return { page: 'incidents', ref: m ? m[1].trim() : null };
    }
    case 'action':
    case 'action_assigned':
      return { page: 'actions', ref: null };
    case 'nonconformity': {
      const m = /^Non-conformité ouverte — (.+)$/.exec(item.title);
      return { page: 'audits', ref: m ? m[1].trim() : null };
    }
    case 'audit': {
      const m = /^Audit récent — (.+)$/.exec(item.title);
      return { page: 'audits', ref: m ? m[1].trim() : null };
    }
    case 'doc_compliance':
      return { page: 'iso', ref: null };
    default:
      return null;
  }
}

function priorityFromLevel(level) {
  if (level === 'critical') return 'critical';
  if (level === 'warning') return 'high';
  return 'normal';
}

function hydrateFromApi(raw) {
  if (!raw || typeof raw !== 'object') return null;
  const id = raw.id;
  const kind = raw.kind;
  const title = raw.title;
  const detail = raw.detail;
  const level = raw.level;
  const read = Boolean(raw.read);
  const timestamp = raw.timestamp ?? '';
  if (typeof id !== 'string' || typeof kind !== 'string') return null;

  const link = linkFor({ kind, title });
  return {
    id,
    kind,
    title: String(title ?? ''),
    detail: String(detail ?? ''),
    level: String(level ?? 'info'),
    read,
    timestamp,
    priority: priorityFromLevel(level),
    ...(link ? { link } : {})
  };
}

/**
 * Documents : une carte regroupée, sans spam (pas de bruit pour simples mises à jour).
 * @param {object[]} mergedDocRows — peuvent contenir classification (API)
 * @param {number} missingIsoProofs
 * @param {string} [userRole]
 */
export function setDocComplianceGroupedNotification(mergedDocRows, missingIsoProofs, userRole) {
  const role = String(userRole || '')
    .trim()
    .toUpperCase();

  const expiredRows = mergedDocRows.filter((r) => r.complianceStatus === 'expire');
  const expiredCrit = expiredRows.filter((r) =>
    ['critique', 'sensible'].includes(String(r.classification || '').toLowerCase())
  );
  const renew = mergedDocRows.filter((r) => r.complianceStatus === 'a_renouveler').length;
  const expired = expiredRows.length;

  /** @type {string[]} */
  const parts = [];
  if (expiredCrit.length) {
    parts.push(
      `${expiredCrit.length} document obligatoire expiré${expiredCrit.length > 1 ? 's' : ''} (classification élevée)`
    );
  } else if (expired) {
    parts.push(`${expired} document expiré${expired > 1 ? 's' : ''}`);
  }
  if (renew) parts.push(`${renew} bientôt expiré${renew > 1 ? 's' : ''} (≤ 30 j.)`);
  if (missingIsoProofs > 0) {
    parts.push(`${missingIsoProofs} preuve${missingIsoProofs > 1 ? 's' : ''} manquante${missingIsoProofs > 1 ? 's' : ''} (audit / ISO)`);
  }

  const pendingValidation = mergedDocRows.filter((r) => r.pendingValidation === true).length;
  if (pendingValidation) {
    parts.push(`${pendingValidation} mise à jour à valider`);
  }
  const rejected = mergedDocRows.filter((r) => r.rejected === true).length;
  if (rejected) {
    parts.push(`${rejected} document rejeté — reprendre la version`);
  }

  if (!parts.length) {
    localDocCompliance = null;
    return;
  }

  if (role === 'TERRAIN' && !expired && !missingIsoProofs && !rejected && !pendingValidation) {
    localDocCompliance = null;
    return;
  }

  let tier = NOTIF_TIER.INFO;
  let level = 'info';
  if (expiredCrit.length || rejected) {
    tier = NOTIF_TIER.CRITIQUE;
    level = 'critical';
  } else if (expired || missingIsoProofs > 0 || pendingValidation) {
    tier = NOTIF_TIER.ATTENTION;
    level = 'warning';
  } else if (renew) {
    tier = NOTIF_TIER.ATTENTION;
    level = 'warning';
  }

  let docScenario = 'resume';
  if (expiredCrit.length) docScenario = 'obligatoire_expire';
  else if (expired) docScenario = 'expire';
  else if (renew) docScenario = 'bientot_expire';
  else if (missingIsoProofs) docScenario = 'preuve_manquante';
  else if (pendingValidation) docScenario = 'a_valider';
  else if (rejected) docScenario = 'rejete';

  const detail = parts.join(' · ');
  const fingerprint = `${tier}|${detail}`;
  const wasRead =
    localDocCompliance && localDocCompliance.fingerprint === fingerprint && localDocCompliance.item.read;
  localDocCompliance = {
    fingerprint,
    item: {
      id: 'local-doc-compliance',
      kind: 'doc_compliance',
      title: 'Pilotage documentaire',
      detail,
      level,
      tier,
      docScenario,
      read: Boolean(wasRead),
      timestamp: new Date().toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short'
      }),
      priority: level === 'critical' ? 'critical' : level === 'warning' ? 'high' : 'normal',
      link: { page: 'iso', ref: null }
    }
  };
}

export async function loadNotificationsFromApi() {
  const ac = new AbortController();
  const tid = setTimeout(() => ac.abort(), 12000);
  try {
    const res = await qhseFetch('/api/notifications', { signal: ac.signal });
    if (res.status === 401 || res.status === 403) {
      items.splice(0, items.length);
      return;
    }
    if (!res.ok) {
      items.splice(0, items.length);
      if (res.status >= 500) {
        showToast('Notifications indisponibles (serveur).', 'warning');
      }
      return;
    }
    const data = await res.json();
    if (!Array.isArray(data)) {
      items.splice(0, items.length);
      return;
    }
    const next = data.map(hydrateFromApi).filter(Boolean);
    items.splice(0, items.length, ...next);
  } catch (err) {
    console.error('[notifications] GET /api/notifications', err);
    items.splice(0, items.length);
    if (err?.name !== 'AbortError') {
      showToast('Réseau ou API indisponible (notifications).', 'warning');
    }
  } finally {
    clearTimeout(tid);
  }
}

export const notificationsStore = {
  all() {
    const local = localDocCompliance?.item;
    if (!local) return items;
    return [local, ...items];
  },
  unreadCount() {
    let n = items.filter((item) => !item.read).length;
    if (localDocCompliance?.item && !localDocCompliance.item.read) n += 1;
    return n;
  },
  markRead(id) {
    if (String(id) === 'local-doc-compliance' && localDocCompliance?.item) {
      localDocCompliance.item.read = true;
      return;
    }
    const entry = items.find((item) => String(item.id) === String(id));
    if (entry) entry.read = true;
  },
  markAllRead() {
    items.forEach((item) => {
      item.read = true;
    });
    if (localDocCompliance?.item) localDocCompliance.item.read = true;
  }
};
