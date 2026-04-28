/**
 * Couche « premium » : priorisation, regroupement, filtrage par rôle, digest.
 * Ne remplace pas le store API · transforme la liste pour l’affichage.
 */

import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';

/** @typedef {'info' | 'attention' | 'critique' | 'digest'} NotificationTier */

export const NOTIF_TIER = {
  INFO: /** @type {NotificationTier} */ ('info'),
  ATTENTION: /** @type {NotificationTier} */ ('attention'),
  CRITIQUE: /** @type {NotificationTier} */ ('critique'),
  DIGEST: /** @type {NotificationTier} */ ('digest')
};

const SYNTH_READ_KEY = 'qhse-notif-synthetic-read-v1';

/** @type {Record<string, unknown> | null} */
let lastDashboardStats = null;

function loadSyntheticReadSet() {
  try {
    const raw = sessionStorage.getItem(SYNTH_READ_KEY);
    if (!raw) return new Set();
    const o = JSON.parse(raw);
    if (o && typeof o === 'object' && Array.isArray(o.ids)) {
      return new Set(o.ids.map(String));
    }
  } catch {
    /* ignore */
  }
  return new Set();
}

function saveSyntheticReadSet(set) {
  try {
    sessionStorage.setItem(SYNTH_READ_KEY, JSON.stringify({ ids: [...set] }));
  } catch {
    /* ignore */
  }
}

let syntheticReadSet = loadSyntheticReadSet();

/**
 * @param {string} id
 */
export function markSyntheticNotificationRead(id) {
  syntheticReadSet.add(String(id));
  saveSyntheticReadSet(syntheticReadSet);
}

export function clearSyntheticNotificationReads() {
  syntheticReadSet = new Set();
  saveSyntheticReadSet(syntheticReadSet);
}

const SYNTHETIC_GROUP_IDS = ['syn-group-actions-retard', 'syn-group-incidents-critiques'];

/** Marque les regroupements synthétiques comme lus (utilisé avec « Tout lire »). */
export function markAllSyntheticGroupsRead() {
  SYNTHETIC_GROUP_IDS.forEach((id) => syntheticReadSet.add(id));
  saveSyntheticReadSet(syntheticReadSet);
}

/**
 * @param {object} item
 * @returns {NotificationTier}
 */
export function deriveTierFromItem(item) {
  if (item.tier && Object.values(NOTIF_TIER).includes(item.tier)) return item.tier;
  if (item.kind === 'digest' || item.kind === 'digest_block') return NOTIF_TIER.DIGEST;
  const level = String(item.level || '').toLowerCase();
  const kind = String(item.kind || '');
  const ds = String(item.docScenario || '');
  if (
    level === 'critical' ||
    kind === 'incident' ||
    ds === 'obligatoire_expire' ||
    ds === 'rejete'
  ) {
    return NOTIF_TIER.CRITIQUE;
  }
  if (
    level === 'warning' ||
    kind === 'nonconformity' ||
    kind === 'action' ||
    kind === 'action_group' ||
    kind === 'incident_group' ||
    kind === 'doc_compliance' ||
    ['expire', 'bientot_expire', 'preuve_manquante', 'a_valider'].includes(ds)
  ) {
    return NOTIF_TIER.ATTENTION;
  }
  return NOTIF_TIER.INFO;
}

/**
 * @param {string | undefined} role
 */
function normalizeRole(role) {
  return String(role || '')
    .trim()
    .toUpperCase();
}

/**
 * Filtre léger par rôle (affichage seul · le serveur filtre déjà une partie du flux).
 * @param {object[]} items
 * @param {string} [role]
 */
export function filterItemsForRole(items, role) {
  const r = normalizeRole(role);
  if (!r || r === 'ADMIN') return items;
  if (r === 'TERRAIN') {
    return items.filter((it) => {
      const k = it.kind;
      if (k === 'nonconformity') return false;
      if (k === 'audit') return deriveTierFromItem(it) !== NOTIF_TIER.INFO;
      if (k === 'doc_compliance') {
        const t = deriveTierFromItem(it);
        return t === NOTIF_TIER.CRITIQUE || it.docScenario === 'preuve_manquante';
      }
      return true;
    });
  }
  if (r === 'DIRECTION') {
    return items.filter((it) => {
      if (it.kind === 'action_assigned' && it.level === 'info') return false;
      return true;
    });
  }
  return items;
}

/**
 * Regroupe les notifications « action en retard » et « incident critique ».
 * @param {object[]} items
 */
function buildGroupedItems(items) {
  const actions = items.filter((i) => i.kind === 'action');
  const incidents = items.filter((i) => i.kind === 'incident');
  const rest = items.filter((i) => i.kind !== 'action' && i.kind !== 'incident');

  /** @type {object[]} */
  const chunks = [];

  if (incidents.length > 1) {
    chunks.push({
      id: 'syn-group-incidents-critiques',
      kind: 'incident_group',
      synthetic: true,
      title: `${incidents.length} incidents critiques récents`,
      detail: 'Vue regroupée : priorisez le terrain et la clôture dans Incidents.',
      level: 'critical',
      timestamp: incidents[0]?.timestamp || '',
      read: syntheticReadSet.has('syn-group-incidents-critiques'),
      link: { page: 'incidents', ref: null },
      tier: NOTIF_TIER.CRITIQUE,
      groupedCount: incidents.length
    });
  } else if (incidents.length === 1) {
    chunks.push({ ...incidents[0], tier: deriveTierFromItem(incidents[0]) });
  }

  if (actions.length > 1) {
    chunks.push({
      id: 'syn-group-actions-retard',
      kind: 'action_group',
      synthetic: true,
      title: `${actions.length} actions sont en retard`,
      detail: 'Vue regroupée : traitez ou réaffectez depuis le module Actions.',
      level: 'warning',
      timestamp: actions[0]?.timestamp || '',
      read: syntheticReadSet.has('syn-group-actions-retard'),
      link: { page: 'actions', ref: null },
      tier: NOTIF_TIER.ATTENTION,
      groupedCount: actions.length
    });
  } else if (actions.length === 1) {
    chunks.push({ ...actions[0], tier: deriveTierFromItem(actions[0]) });
  }

  const tail = rest.map((i) => ({ ...i, tier: deriveTierFromItem(i) }));
  return [...chunks, ...tail];
}

/**
 * @param {object[]} rawItems · déjà fusionnées (API + locales)
 * @param {{ role?: string }} [opts]
 */
export function buildPresentationFeed(rawItems, opts = {}) {
  const role = opts.role;
  const filtered = filterItemsForRole(rawItems, role);
  return buildGroupedItems(filtered);
}

/**
 * @param {NotificationTier | 'all'} filterTier
 * @param {object[]} presentationItems
 */
export function filterByTier(presentationItems, filterTier) {
  if (!filterTier || filterTier === 'all') return presentationItems;
  return presentationItems.filter((i) => i.tier === filterTier);
}

/**
 * @param {object[]} presentationItems
 */
export function countUnreadPresentation(presentationItems) {
  return presentationItems.filter((i) => !i.read).length;
}

export async function refreshNotificationSmartContext() {
  const ac = new AbortController();
  const tid = window.setTimeout(() => ac.abort(), 8000);
  try {
    const res = await qhseFetch(withSiteQuery('/api/dashboard/stats'), { signal: ac.signal });
    if (!res.ok) {
      lastDashboardStats = null;
      return;
    }
    lastDashboardStats = await res.json().catch(() => null);
  } catch {
    lastDashboardStats = null;
  } finally {
    window.clearTimeout(tid);
  }
}

/**
 * Structure extensible pour digest quotidien / hebdo (affichage centre de notif).
 * @returns {object | null}
 */
export function getDigestPayload() {
  const s = lastDashboardStats;
  if (!s || typeof s !== 'object') {
    return {
      overdueActions: null,
      criticalIncidents: null,
      auditsSoon: null,
      risksOpen: null,
      docCritical: null,
      stale: true
    };
  }
  return {
    overdueActions: typeof s.overdueActions === 'number' ? s.overdueActions : null,
    criticalIncidents: Array.isArray(s.criticalIncidents) ? s.criticalIncidents.length : null,
    auditsSoon: null,
    risksOpen: null,
    docCritical: null,
    stale: false
  };
}

/**
 * @param {HTMLElement} host
 * @param {ReturnType<typeof getDigestPayload>} payload
 * @param {{ plannedAuditsCount?: number }} [opts]
 */
export function appendDigestSummary(host, payload, opts = {}) {
  if (!host) return;
  const oa = payload.overdueActions;
  const ci = payload.criticalIncidents;
  const aud = opts.plannedAuditsCount;
  const stale = payload.stale;
  const oaDisp = oa != null ? String(oa) : stale ? '…' : '0';
  const ciDisp = ci != null ? String(ci) : stale ? '…' : '0';
  const audDisp = aud != null ? String(aud) : 'Non renseigné';

  host.replaceChildren();
  const lead = document.createElement('p');
  lead.className = 'notif-digest-lead';
  lead.textContent = 'Résumé structuré (quotidien / hebdo · données pilotage).';
  const ul = document.createElement('ul');
  ul.className = 'notif-digest-list';

  function addLine(strongLabel, rest) {
    const li = document.createElement('li');
    const s = document.createElement('strong');
    s.textContent = strongLabel;
    li.append(s, document.createTextNode(` : ${rest}`));
    ul.append(li);
  }

  addLine('Actions en retard', oaDisp);
  addLine('Incidents critiques (aperçu)', ciDisp);
  addLine('Audits à planifier (repère)', audDisp);
  addLine(
    'Relances (assistant)',
    'regroupées dans le fil ; détail sur le tableau de bord « Assistant de pilotage »'
  );
  addLine('Risques sans suivi', 'voir registre Risques et boutons d’action préventive');
  addLine('Documents critiques', 'carte « Pilotage documentaire » (notifications)');
  host.append(lead, ul);
}
