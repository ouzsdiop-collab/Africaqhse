import { showToast } from '../components/toast.js';
import { ensureSensitiveAccess } from '../components/sensitiveAccessGate.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { appState } from '../utils/state.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { activityLogStore } from '../data/activityLog.js';
import { ensureAuditProductsStyles } from '../components/auditProductsStyles.js';
import { ensureAuditPlusStyles } from '../components/auditPlusStyles.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { fetchUsers } from '../services/users.service.js';
import { readImportDraft } from '../utils/importDraft.js';
import { mountPageViewModeSwitch } from '../utils/pageViewMode.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';
import {
  ensureAuditPremiumSaaSStyles,
  createAuditTerrainWorkflowStrip
} from '../components/auditPremiumSaaS.js';
import { escapeHtml } from '../utils/escapeHtml.js';
/* Intent filtre depuis le tableau de bord — clé partagée dans dashboardNavigationIntent.js */
import { consumeDashboardIntent } from '../utils/dashboardNavigationIntent.js';
import { scheduleScrollIntoView } from '../utils/navScrollAnchor.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';

/** Constantes cockpit Audits (extrait illustratif — complété par l’API quand disponible). */
const AUDITS_RETARD_COUNT = 2;
const NC_OUVERTES_COUNT = 8;
const ACTIONS_RETARD_COUNT = 5;

const AUDIT_PROOFS = [
  { name: 'PV d’audit signé', status: 'present' },
  { name: 'Photos zones de stockage', status: 'missing' },
  { name: 'Registre déchets (extrait)', status: 'verify' }
];

const AUDIT_PRIORITY_LINES = [
  {
    label: 'NC critiques',
    detail:
      '2 écarts majeurs sur le dernier audit — escalade direction et plan d’actions prioritaire.'
  },
  {
    label: 'Preuves manquantes',
    detail: `${AUDIT_PROOFS.filter((p) => p.status === 'missing').length} pièce(s) sans justificatif — compléter le dossier probatoire.`
  },
  {
    label: 'Audits en retard',
    detail: `${AUDITS_RETARD_COUNT} position(s) à reprogrammer — consulter le planning et les alertes.`
  }
];

/** Seuils gravité NC — affichage cockpit expert */
const AUDIT_NC_MAJEURES = 2;
const AUDIT_NC_MINEURES = 3;

/** Scores par domaine (pilotage cockpit) */
const AUDIT_PROCESS_DOMAIN_SCORES = [
  { domain: 'Management', score: 82 },
  { domain: 'Terrain', score: 74 },
  { domain: 'Environnement', score: 71 }
];

const COCKPIT_CYCLE_LABELS = [
  'Détection',
  'Contrôle humain',
  'Correction',
  'Vérification',
  'Clôture'
];
/** Index phase mise en avant (0-based) — cockpit */
const COCKPIT_CYCLE_ACTIVE = 1;

function countPlannedByStatut(st) {
  return PLANNED_AUDITS.filter((r) => r.statut === st).length;
}

/** Parse JJ/MM/AAAA — usage pilotage notifications (front uniquement). */
function parseAuditPlanDateFr(s) {
  const m = String(s || '').trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return null;
  const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
  return Number.isNaN(d.getTime()) ? null : d;
}

function auditCalendarDaysDiff(from, to) {
  const utc = (x) => Date.UTC(x.getFullYear(), x.getMonth(), x.getDate());
  return Math.round((utc(to) - utc(from)) / 86400000);
}

/**
 * Notifications cockpit — dérivées des données affichées + constantes (sans appel API dédié ici).
 * @returns {{ items: { key: string; title: string; detail: string; tone: 'blue'|'amber'|'green'|'red' }[]; suggestNotifyHint: string }}
 */
/**
 * Action corrective préremplie depuis un constat NC (checklist audit) — frontend uniquement.
 * @param {object} p
 * @param {string} p.auditRef
 * @param {string} [p.auditSite]
 * @param {string} p.controlPoint
 * @param {'mineur'|'majeur'} p.ncSeverity
 * @param {string} [p.recommendedDueIso] — YYYY-MM-DD
 */
async function openCorrectiveActionFromAuditNc(p) {
  const auditRef = String(p.auditRef || '').trim();
  const site = String(p.auditSite || '').trim();
  const controlPoint = String(p.controlPoint || '').trim();
  const sev = p.ncSeverity === 'majeur' ? 'majeur' : 'mineur';
  const [{ openActionCreateDialog }, { fetchUsers }] = await Promise.all([
    import('../components/actionCreateDialog.js'),
    import('../services/users.service.js')
  ]);
  let users = [];
  try {
    users = await fetchUsers();
  } catch {
    showToast('Utilisateurs indisponibles.', 'warning');
  }
  const priority = sev === 'majeur' ? 'critique' : 'haute';
  let dueStr = '';
  if (p.recommendedDueIso && /^\d{4}-\d{2}-\d{2}$/.test(String(p.recommendedDueIso))) {
    dueStr = String(p.recommendedDueIso);
  } else {
    const due = new Date();
    due.setDate(due.getDate() + (sev === 'majeur' ? 14 : 30));
    dueStr = due.toISOString().slice(0, 10);
  }
  const title =
    controlPoint.length > 0
      ? `Corrective — ${controlPoint.slice(0, 100)} (${auditRef})`
      : `Corrective — audit ${auditRef}`;
  const description = [
    `Source : audit ${auditRef}${site ? ` · ${site}` : ''}.`,
    `Point de contrôle / NC : ${controlPoint || '—'}.`,
    `Criticité constat : ${sev === 'majeur' ? 'majeure' : 'mineure'}.`
  ].join('\n');

  openActionCreateDialog({
    users,
    defaults: {
      title,
      origin: 'audit',
      actionType: 'corrective',
      priority,
      description,
      dueDate: dueStr,
      linkedAudit: auditRef,
      linkedRisk: '',
      linkedIncident: ''
    },
    builtInSuccessToast: false,
    onCreated: (payload) => {
      showToast('Action corrective créée', 'success', {
        label: 'Ouvrir',
        action: () =>
          qhseNavigate('actions', {
            skipDefaults: true,
            focusActionId: payload?.id,
            focusActionTitle: payload?.title || '',
            linkedAuditTitle: auditRef,
            linkedNonConformity: controlPoint.slice(0, 240)
          })
      });
    }
  });
}

function buildAuditSmartNotifications() {
  const today = new Date();
  const items = [];

  PLANNED_AUDITS.forEach((row) => {
    const d = parseAuditPlanDateFr(row.date);
    const st = row.statut;
    if (st === 'terminé') {
      items.push({
        key: `done-${row.ref}`,
        title: `Audit terminé — ${row.ref}`,
        detail: `${row.site} · ${row.date} · clôture à consolider côté preuves / synthèse.`,
        tone: 'green'
      });
      return;
    }
    if (st === 'en cours') {
      items.push({
        key: `run-${row.ref}`,
        title: `Audit en cours — ${row.ref}`,
        detail: `${row.site} · auditeur : ${row.auditeur} · date prévue ${row.date}.`,
        tone: 'amber'
      });
      return;
    }
    if (st === 'à venir' && d) {
      const days = auditCalendarDaysDiff(today, d);
      if (days <= 0) {
        items.push({
          key: `late-${row.ref}`,
          title: `Échéance atteinte / dépassée — ${row.ref}`,
          detail: `${row.site} · prévu le ${row.date} — vérifier le calendrier et notifier les participants.`,
          tone: 'red'
        });
      } else if (days <= 7) {
        items.push({
          key: `soon-${row.ref}`,
          title: `Audit imminent — ${row.ref}`,
          detail: `${row.site} dans ${days} jour(s) (${row.date}) · rappel aux équipes et auditeur (${row.auditeur}).`,
          tone: 'amber'
        });
      } else {
        items.push({
          key: `plan-${row.ref}`,
          title: `Audit planifié — ${row.ref}`,
          detail: `${row.site} · ${row.date} · ${row.auditeur}.`,
          tone: 'blue'
        });
      }
    } else if (st === 'à venir') {
      items.push({
        key: `plan-${row.ref}`,
        title: `Audit planifié — ${row.ref}`,
        detail: `${row.site} · date ${row.date} · ${row.auditeur}.`,
        tone: 'blue'
      });
    }
  });

  if (AUDITS_RETARD_COUNT > 0) {
    items.push({
      key: 'retard-global',
      title: 'Audits en retard (pilotage)',
      detail: `${AUDITS_RETARD_COUNT} position(s) à reprogrammer ou escalader — synchroniser avec le planning.`,
      tone: 'red'
    });
  }

  if (NC_OUVERTES_COUNT > 0) {
    items.push({
      key: 'nc-open',
      title: 'Non-conformités détectées / ouvertes',
      detail: `${NC_OUVERTES_COUNT} NC suivies sur le registre — informer les responsables et le plan d’actions.`,
      tone: 'amber'
    });
  }

  if (ACTIONS_RETARD_COUNT > 0) {
    items.push({
      key: 'actions-late',
      title: 'Actions en retard',
      detail: `${ACTIONS_RETARD_COUNT} action(s) liées aux audits en retard < 15 j — relance recommandée.`,
      tone: 'red'
    });
  }

  const imminent = items.some((i) => i.key.startsWith('soon-') || i.key.startsWith('late-'));
  const enCours = items.some((i) => i.key.startsWith('run-'));
  let suggestNotifyHint =
    'Suggestion IA : notifier après validation humaine du périmètre et des participants (aucun envoi automatique).';
  if (imminent) {
    suggestNotifyHint =
      'Suggestion IA : envoyer un rappel aux participants et au site dans les 48 h — l’audit est imminent ou l’échéance est passée.';
  } else if (enCours) {
    suggestNotifyHint =
      'Suggestion IA : notifier pour point d’étape mi-parcours (constats provisoires) — à valider avec l’auditeur.';
  } else if (NC_OUVERTES_COUNT > 0 || ACTIONS_RETARD_COUNT > 0) {
    suggestNotifyHint =
      'Suggestion IA : notifier les pilotes d’actions et la direction sur les NC et retards — message à personnaliser avant envoi.';
  }

  return { items, suggestNotifyHint };
}

/**
 * Carte notifications intelligentes + CTA participants (interface locale).
 * @param {{ canAuditWrite: boolean; su: ReturnType<typeof getSessionUser>; model: ReturnType<typeof buildAuditSmartNotifications> }} opts
 */
function createAuditIntelligentNotificationsCard(opts) {
  const { canAuditWrite, su, model } = opts;
  const { items } = model;
  const card = document.createElement('article');
  card.className = 'content-card card-soft audit-cockpit-notifs';
  card.setAttribute('aria-labelledby', 'audit-cockpit-notifs-title');
  const unreadish = items.filter((i) => i.tone === 'red' || i.tone === 'amber').length;

  const head = document.createElement('div');
  head.className = 'content-card-head content-card-head--split audit-cockpit-notifs__head';
  const headIntro = document.createElement('div');
  const notifKicker = document.createElement('div');
  notifKicker.className = 'section-kicker';
  notifKicker.textContent = 'Pilotage';
  const notifH3 = document.createElement('h3');
  notifH3.id = 'audit-cockpit-notifs-title';
  notifH3.textContent = 'Alertes planning';
  const notifLead = document.createElement('p');
  notifLead.className = 'content-card-lead audit-cockpit-notifs__lead';
  notifLead.append(
    document.createTextNode('Échéances et relances — '),
    Object.assign(document.createElement('strong'), { textContent: 'aucun envoi auto' }),
    document.createTextNode(' sans clic.')
  );
  headIntro.append(notifKicker, notifH3, notifLead);
  const badgesWrap = document.createElement('div');
  badgesWrap.className = 'audit-cockpit-notifs__badges';
  badgesWrap.setAttribute('aria-label', 'Synthèse alertes');
  const countBadge = document.createElement('span');
  countBadge.className = 'badge blue audit-cockpit-notifs__count';
  countBadge.textContent = `${items.length} alerte(s)`;
  badgesWrap.append(countBadge);
  const prioBadge = document.createElement('span');
  prioBadge.className = unreadish
    ? 'badge amber audit-cockpit-notifs__prio'
    : 'badge green audit-cockpit-notifs__prio';
  prioBadge.textContent = unreadish ? `${unreadish} à traiter` : 'Situation stable';
  badgesWrap.append(prioBadge);
  head.append(headIntro, badgesWrap);

  const list = document.createElement('div');
  list.className = 'audit-cockpit-notifs__list';
  list.setAttribute('role', 'list');

  items.forEach((it) => {
    const row = document.createElement('div');
    row.className = 'audit-cockpit-notifs__item';
    row.setAttribute('role', 'listitem');
    const main = document.createElement('div');
    main.className = 'audit-cockpit-notifs__item-main';
    const title = document.createElement('div');
    title.className = 'audit-cockpit-notifs__item-title';
    title.textContent = it.title;
    const detail = document.createElement('p');
    detail.className = 'audit-cockpit-notifs__item-detail';
    detail.textContent = it.detail;
    main.append(title, detail);
    const tag = document.createElement('span');
    tag.className = `badge ${it.tone} audit-cockpit-notifs__type`;
    tag.textContent =
      it.key.startsWith('plan-') && it.tone === 'blue'
        ? 'Planifié'
        : it.key.startsWith('soon-')
          ? 'Rappel'
          : it.key.startsWith('late-')
            ? 'Échéance'
            : it.key.startsWith('run-')
              ? 'En cours'
              : it.key.startsWith('done-')
                ? 'Terminé'
                : it.key === 'nc-open'
                  ? 'NC'
                  : it.key === 'actions-late'
                    ? 'Actions'
                    : it.key === 'retard-global'
                      ? 'Retard'
                      : 'Pilotage';
    row.append(main, tag);
    list.append(row);
  });

  if (items.length === 0) {
    const empty = document.createElement('p');
    empty.className = 'audit-cockpit-notifs__empty';
    empty.textContent = 'Aucune alerte dérivée des données affichées — le registre est à jour sur cette vue.';
    list.append(empty);
  }

  const foot = document.createElement('div');
  foot.className = 'audit-cockpit-notifs__foot';

  const notifyBtn = document.createElement('button');
  notifyBtn.type = 'button';
  notifyBtn.className = 'btn btn-primary audit-notify-participants-btn';
  notifyBtn.textContent = 'Notifier les participants';

  const canNotify = canAuditWrite;
  if (!canNotify && su) {
    notifyBtn.disabled = true;
    notifyBtn.title = 'Réservé aux profils avec droit d’écriture sur les audits (ex. QHSE, Admin).';
  }

  notifyBtn.addEventListener('click', () => {
    if (!canNotify) {
      showToast(
        'Action réservée aux rôles pouvant piloter les audits (écriture). Contactez votre référent QHSE.',
        'info'
      );
      return;
    }
    const summary = items
      .slice(0, 5)
      .map((i) => i.title)
      .join(' · ');
    showToast(
      'Notification enregistrée pour diffusion aux participants (e-mail / push selon votre intégration).',
      'info'
    );
    activityLogStore.add({
      module: 'audits',
      action: 'Notification participants (cockpit audit)',
      detail: summary || 'Aucune alerte active',
      user: su?.name || 'Utilisateur'
    });
  });

  const roleHint = document.createElement('p');
  roleHint.className = 'audit-cockpit-notifs__role-hint';
  const notifRead = canResource(su?.role, 'notifications', 'read');
  roleHint.textContent = notifRead
    ? 'Avec « notifications », ce bandeau pourra alimenter le canal une fois branché.'
    : 'Sans écriture audits : lecture seule, pas d’envoi.';

  foot.append(notifyBtn, roleHint);
  card.append(head, list, foot);
  return card;
}

const PLANNED_AUDITS = [
  {
    id: 'AUD-P-021',
    ref: 'AUD-P-021',
    site: 'Site principal',
    auditeur: 'M. Diallo',
    date: '08/04/2026',
    statut: 'à venir'
  },
  {
    id: 'AUD-P-022',
    ref: 'AUD-P-022',
    site: 'Site sud',
    auditeur: 'Équipe qualité',
    date: '02/04/2026',
    statut: 'en cours'
  },
  {
    id: 'AUD-P-019',
    ref: 'AUD-P-019',
    site: 'Site principal',
    auditeur: 'Cabinet externe',
    date: '15/03/2026',
    statut: 'terminé'
  }
];

const LAST_AUDIT = {
  date: '28/03/2026',
  site: 'Site principal',
  score: 78,
  progress: 72,
  conforme: false,
  ref: 'AUD-2026-014',
  ncCount: 2,
  statusLabel: 'Non conforme — actions requises',
  auditeur: 'M. Diallo — Auditeur interne SMS'
};

const AUDIT_REFERENTIEL_LABEL = 'ISO 9001 · 14001 · 45001';

/** Lignes traitement NC / actions (affichage certification). */
const AUDIT_TREATMENT_ROWS = [
  {
    nc: 'NC-2026-014-A',
    action: 'ACT-441',
    owner: 'Responsable maintenance',
    due: '12/04/2026'
  },
  {
    nc: 'NC-2026-014-B',
    action: 'ACT-442',
    owner: 'HSE site',
    due: '18/04/2026'
  }
];

/** Piste d’audit locale (journal des événements affichés). */
const AUDIT_TRACE_ROWS = [
  {
    who: 'M. Diallo',
    when: '28/03/2026 · 14:20',
    action: 'Constat enregistré — déchets',
    comment: 'Preuve registre demandée'
  },
  {
    who: 'Coordinateur QHSE',
    when: '27/03/2026 · 09:05',
    action: 'Ouverture fiche audit',
    comment: '—'
  }
];

const AUDIT_ISO_NORM_SCORES = (() => {
  const base = Number(LAST_AUDIT.score) || 0;
  return [
    { norm: 'ISO 9001', score: Math.min(100, Math.max(0, base + 4)) },
    { norm: 'ISO 14001', score: Math.min(100, Math.max(0, base - 5)) },
    { norm: 'ISO 45001', score: Math.min(100, Math.max(0, base + 1)) }
  ];
})();

const CHECKLIST = [
  {
    point: 'Contrôles opérationnels documentés',
    conforme: true,
    proofRef: 'PV d’audit signé'
  },
  {
    point: 'Gestion des déchets dangereux (registres)',
    conforme: false,
    proofRef: 'Registre déchets (extrait)'
  },
  {
    point: 'Habilitations et autorisations à jour',
    conforme: true,
    proofRef: 'Tableau habilitations Q1'
  },
  {
    point: 'Plan urgence environnementale / exercices',
    conforme: false,
    proofRef: '—'
  }
];

const HISTORY = [
  { date: '15/02/2026', score: 82 },
  { date: '20/11/2025', score: 79 },
  { date: '05/08/2025', score: 74 }
];

function getCockpitPreviousAuditScore() {
  const sorted = [...HISTORY].sort((a, b) => {
    const da = parseAuditPlanDateFr(a.date)?.getTime() ?? 0;
    const db = parseAuditPlanDateFr(b.date)?.getTime() ?? 0;
    return da - db;
  });
  if (!sorted.length) return null;
  const last = sorted[sorted.length - 1];
  const v = Math.round(Math.max(0, Math.min(100, Number(last.score) || 0)));
  return Number.isFinite(v) ? v : null;
}

/** Points pour la checklist chantier (même thématique que la synthèse) */
const FIELD_POINTS = [
  { id: 'f1', point: 'Contrôles opérationnels documentés' },
  { id: 'f2', point: 'Gestion des déchets dangereux (registres)' },
  { id: 'f3', point: 'Habilitations et autorisations à jour' },
  { id: 'f4', point: 'Plan urgence environnementale / exercices' }
];

/** Dernier audit (tri API) — même source pour PDF, e-mail et note d’envoi auto. */
async function loadLatestAuditRow() {
  const res = await qhseFetch('/api/audits?limit=500');
  if (!res.ok) {
    return { ok: false, row: null, status: res.status };
  }
  const audits = await res.json().catch(() => null);
  if (!Array.isArray(audits) || audits.length === 0) {
    return { ok: true, row: null };
  }
  return { ok: true, row: audits[0] };
}

async function loadLatestAuditRef() {
  const { ok, row, status } = await loadLatestAuditRow();
  return { ok, ref: row?.ref ?? null, status, row };
}

function statutBadgeClass(statut) {
  if (statut === 'terminé') return 'green';
  if (statut === 'en cours') return 'amber';
  return 'blue';
}

/**
 * Constat + bandeau validation humaine (session locale — pas d’écriture API sur cet écran).
 * @param {{ point: string; conforme: boolean; proofRef?: string }} item
 * @param {ReturnType<typeof getSessionUser>} [sessionUser]
 * @param {{ bumpScore?: (delta: number) => void }} [hooks]
 * @param {{ auditRef?: string; auditSite?: string }} [auditLink] — contexte audit pour actions / liaisons
 */
function createConstatHumanRow(item, sessionUser, hooks, exigenceIndex, auditLink = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'audit-constat-human audit-constat-human--compact';
  if (exigenceIndex != null && Number.isFinite(Number(exigenceIndex))) {
    wrap.id = `audit-exigence-${exigenceIndex}`;
  }
  const ok = Boolean(item?.conforme);
  const su = sessionUser || null;

  const top = document.createElement('div');
  top.className = 'audit-checklist-compact-top';
  if (!ok) top.classList.add('audit-checklist-compact-top--nc');
  const pointEl = document.createElement('span');
  pointEl.className = 'audit-checklist-compact-point';
  pointEl.textContent = item?.point != null ? String(item.point) : '—';
  const auditRefLink = String(auditLink?.auditRef || '').trim();
  const auditSiteLink = String(auditLink?.auditSite || '').trim();
  const badge = document.createElement('span');
  badge.className = `badge ${ok ? 'green' : 'red'} audit-checklist-compact-badge`;
  badge.textContent = ok ? 'Conforme' : 'NC';
  const proofEl = document.createElement('span');
  proofEl.className = 'audit-checklist-compact-proof';
  proofEl.setAttribute('title', 'Preuve documentaire ciblée (lien indicatif)');
  proofEl.textContent =
    item?.proofRef != null && String(item.proofRef).trim() !== ''
      ? String(item.proofRef)
      : '—';
  const treatBtn = document.createElement('button');
  treatBtn.type = 'button';
  treatBtn.className = 'text-button audit-checklist-treat';
  treatBtn.textContent = 'Traiter';
  treatBtn.setAttribute('aria-expanded', 'false');
  top.append(pointEl, badge, proofEl, treatBtn);

  const exRow = document.createElement('div');
  exRow.className = 'audit-constat-ex-actions';
  const bProof = document.createElement('button');
  bProof.type = 'button';
  bProof.className = 'btn btn-secondary';
  bProof.textContent = 'Ajouter preuve';
  bProof.addEventListener('click', () => {
    showToast('Preuve ajoutée au dossier (session locale).', 'info');
    hooks?.bumpScore?.(0.3);
    activityLogStore.add({
      module: 'audits',
      action: 'Ajout preuve sur exigence',
      detail: String(item.point || '').slice(0, 100),
      user: su?.name || su?.email || 'Auditeur'
    });
  });
  const bConst = document.createElement('button');
  bConst.type = 'button';
  bConst.className = 'btn btn-secondary';
  bConst.textContent = 'Ajouter constat';
  bConst.addEventListener('click', () => {
    showToast('Constat complémentaire enregistré.', 'info');
    activityLogStore.add({
      module: 'audits',
      action: 'Constat complémentaire',
      detail: String(item.point || '').slice(0, 100),
      user: su?.name || su?.email || 'Auditeur'
    });
  });
  const sevWrap = document.createElement('div');
  sevWrap.className = 'audit-severity-toggle';
  sevWrap.setAttribute('role', 'group');
  sevWrap.setAttribute('aria-label', 'Gravité');
  let severity = 'mineur';
  const bMin = document.createElement('button');
  bMin.type = 'button';
  bMin.textContent = 'Mineur';
  bMin.className = 'audit-severity--on';
  const bMaj = document.createElement('button');
  bMaj.type = 'button';
  bMaj.textContent = 'Majeur';
  function paintSev() {
    bMin.classList.toggle('audit-severity--on', severity === 'mineur');
    bMaj.classList.toggle('audit-severity--on', severity === 'majeur');
  }
  bMin.addEventListener('click', () => {
    severity = 'mineur';
    paintSev();
  });
  bMaj.addEventListener('click', () => {
    severity = 'majeur';
    paintSev();
  });
  sevWrap.append(bMin, bMaj);
  const bLink = document.createElement('button');
  bLink.type = 'button';
  bLink.className = 'text-button';
  bLink.style.fontWeight = '700';
  bLink.textContent = 'Lier action';
  bLink.addEventListener('click', () => {
    void (async () => {
      const { linkModules } = await import('../services/moduleLinks.service.js');
      linkModules({
        fromModule: 'audits',
        fromId: String(item.point || 'nc'),
        toModule: 'actions',
        toId: `action_link_${String(item.point || 'nc')}`,
        kind: 'audit_constat_to_action'
      });
    })();
    qhseNavigate('actions', {
      skipDefaults: true,
      linkedAuditTitle: auditRefLink,
      linkedNonConformity: String(item.point || '').trim().slice(0, 400)
    });
    activityLogStore.add({
      module: 'audits',
      action: 'Liaison action depuis constat',
      detail: String(item.point || '').slice(0, 80),
      user: su?.name || su?.email || 'Auditeur'
    });
  });
  exRow.append(bProof, bConst, sevWrap, bLink);

  const strip = document.createElement('div');
  strip.className = 'audit-human-strip audit-human-strip--collapsible';
  strip.hidden = true;

  const legend = document.createElement('p');
  legend.className = 'audit-human-validation-legend';
  legend.textContent =
    'Décision humaine requise — états ci-dessous après action explicite uniquement.';

  const statusEl = document.createElement('span');
  statusEl.className = 'audit-human-status audit-human-status--pending';

  const actions = document.createElement('div');
  actions.className = 'audit-human-actions';

  const traceWrap = document.createElement('div');
  traceWrap.className = 'audit-human-trace';
  const traceHint = document.createElement('p');
  traceHint.className = 'audit-human-validation-legend';
  traceHint.style.marginBottom = '6px';
  traceHint.textContent =
    'Traçabilité décision — renseignez un commentaire puis validez (utilisateur et date après action).';
  const traceUser = document.createElement('p');
  traceUser.className = 'audit-human-trace-meta';
  traceUser.textContent = 'Utilisateur : —';
  const traceDate = document.createElement('p');
  traceDate.className = 'audit-human-trace-meta';
  traceDate.textContent = 'Date : —';
  const traceComment = document.createElement('textarea');
  traceComment.className = 'audit-human-trace-comment';
  traceComment.setAttribute('aria-label', 'Commentaire de traçabilité');
  traceComment.placeholder = 'Commentaire (obligatoire en certification ISO — contexte de la décision)';
  traceWrap.append(traceHint, traceUser, traceDate, traceComment);

  /** @type {'pending'|'validated'|'adjusted'|'rejected'} */
  let vState = 'pending';
  const labels = {
    pending: 'En attente',
    validated: 'Validé',
    adjusted: 'Modifié',
    rejected: 'Rejeté'
  };

  function paintStatus() {
    statusEl.textContent = labels[vState];
    statusEl.className = `audit-human-status audit-human-status--${vState}`;
  }
  paintStatus();

  function wireBtn(label, next) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn btn-secondary';
    b.textContent = label;
    b.addEventListener('click', () => {
      vState = next;
      paintStatus();
      traceUser.textContent = `Utilisateur : ${su?.name || su?.email || 'Auditeur'}`;
      traceDate.textContent = `Date : ${new Date().toLocaleString('fr-FR')}`;
      showToast(`Suggestion / constat — ${labels[next]} (validation humaine).`, 'info');
      hooks?.bumpScore?.(next === 'validated' ? 0.4 : next === 'adjusted' ? 0.2 : -0.3);
      activityLogStore.add({
        module: 'audits',
        action: `Validation constat : ${labels[next]}`,
        detail: `${String(item.point || '').slice(0, 60)} · ${traceComment.value ? traceComment.value.slice(0, 120) : 'sans commentaire'}`,
        user: su?.name || su?.email || 'Auditeur'
      });
    });
    return b;
  }

  actions.append(
    wireBtn('Valider', 'validated'),
    wireBtn('Ajuster', 'adjusted'),
    wireBtn('Rejeter', 'rejected')
  );
  strip.append(legend, statusEl, actions, traceWrap);

  if (!ok) {
    badge.style.cursor = 'pointer';
    badge.title = 'Afficher la zone de validation humaine';
    badge.addEventListener('click', (e) => {
      e.stopPropagation();
      strip.hidden = !strip.hidden;
      treatBtn.setAttribute('aria-expanded', strip.hidden ? 'false' : 'true');
    });
  }

  treatBtn.addEventListener('click', async (e) => {
    e.stopPropagation();
    await openCorrectiveActionFromAuditNc({
      auditRef: auditRefLink || LAST_AUDIT.ref,
      auditSite: auditSiteLink,
      controlPoint: String(item.point || ''),
      ncSeverity: severity === 'majeur' ? 'majeur' : 'mineur'
    });
  });

  wrap.append(top, exRow, strip);
  return wrap;
}

/**
 * Ligne tableau NC + bouton risque (navigation module Risques).
 * @param {HTMLElement} treatmentTable
 * @param {{ nc: string; action: string; owner: string; due: string }} r
 * @param {ReturnType<typeof getSessionUser> | null} su
 * @param {string} [auditDisplayRef] — réf. audit affichée (cockpit)
 */
function appendTreatmentRowWithRisk(treatmentTable, r, su, auditDisplayRef) {
  const line = document.createElement('div');
  line.className = 'audit-iso-treatment-row';
  line.setAttribute('role', 'row');
  const ncCell = document.createElement('span');
  ncCell.setAttribute('role', 'cell');
  ncCell.setAttribute('data-label', 'NC');
  const ncStrong = document.createElement('strong');
  ncStrong.textContent = r.nc;
  const riskBtn = document.createElement('button');
  riskBtn.type = 'button';
  riskBtn.className = 'btn btn-secondary audit-nc-risk-btn';
  riskBtn.textContent = 'Créer risque associé';
  riskBtn.addEventListener('click', () => {
    const aref = String(auditDisplayRef || LAST_AUDIT.ref).trim();
    const desc = [
      `Non-conformité ${r.nc} (audit ${aref}).`,
      `Action liée : ${r.action} · ${r.owner} · échéance ${r.due}.`
    ].join('\n');
    qhseNavigate('risks', {
      skipDefaults: true,
      openRiskCreateFromIntent: true,
      riskPrefillTitle: `Risque lié — ${r.nc} (${aref})`,
      riskPrefillDescription: desc.slice(0, 3800)
    });
    activityLogStore.add({
      module: 'audits',
      action: 'Créer risque associé depuis NC audit',
      detail: r.nc,
      user: su?.name || 'Utilisateur'
    });
  });
  ncCell.append(ncStrong, riskBtn);
  const a = document.createElement('span');
  a.setAttribute('role', 'cell');
  a.setAttribute('data-label', 'Action');
  a.textContent = r.action;
  const o = document.createElement('span');
  o.setAttribute('role', 'cell');
  o.setAttribute('data-label', 'Responsable');
  o.textContent = r.owner;
  const d = document.createElement('span');
  d.setAttribute('role', 'cell');
  d.setAttribute('data-label', 'Échéance');
  d.textContent = r.due;
  line.append(ncCell, a, o, d);
  treatmentTable.append(line);
}

function createPlanningTable() {
  const wrap = document.createElement('div');
  wrap.className = 'audit-plan-table-wrap';
  const table = document.createElement('div');
  table.className = 'audit-plan-table audit-plan-table--with-pdf';

  if (!document.getElementById('audit-plan-pdf-grid-style')) {
    const st = document.createElement('style');
    st.id = 'audit-plan-pdf-grid-style';
    st.textContent = `
      .audit-plan-table--with-pdf .audit-plan-head,
      .audit-plan-table--with-pdf .audit-plan-row {
        grid-template-columns: minmax(88px,0.75fr) minmax(100px,1fr) minmax(88px,0.72fr) minmax(78px,0.65fr) minmax(88px,0.75fr) auto !important;
        align-items: center;
      }
      .audit-plan-pdf-btn { font-size: 11px; padding: 6px 10px; white-space: nowrap; }
    `;
    document.head.append(st);
  }

  const head = document.createElement('div');
  head.className = 'audit-plan-head';
  head.innerHTML = `
    <span>Réf.</span>
    <span>Site</span>
    <span>Auditeur</span>
    <span>Date</span>
    <span>Statut</span>
    <span>Rapport</span>
  `;
  table.append(head);

  PLANNED_AUDITS.forEach((row) => {
    const line = document.createElement('div');
    line.className = 'audit-plan-row audit-plan-row--click';
    line.setAttribute('role', 'button');
    line.tabIndex = 0;
    line.setAttribute('aria-label', `Aller au pilotage — ${row.ref}`);
    line.setAttribute('data-audit-plan-ref', row.ref);
    const stClass = statutBadgeClass(row.statut);
    const cRef = document.createElement('span');
    cRef.className = 'audit-plan-ref';
    cRef.dataset.label = 'Réf.';
    cRef.textContent = row.ref;
    const cSite = document.createElement('span');
    cSite.dataset.label = 'Site';
    cSite.textContent = row.site;
    const cAud = document.createElement('span');
    cAud.dataset.label = 'Auditeur';
    cAud.textContent = row.auditeur;
    const cDate = document.createElement('span');
    cDate.dataset.label = 'Date';
    cDate.textContent = row.date;
    const cStatWrap = document.createElement('span');
    cStatWrap.dataset.label = 'Statut';
    const cStatBadge = document.createElement('span');
    cStatBadge.className = `badge ${stClass}`;
    cStatBadge.textContent = row.statut;
    cStatWrap.append(cStatBadge);
    line.append(cRef, cSite, cAud, cDate, cStatWrap);
    const pdfWrap = document.createElement('span');
    pdfWrap.setAttribute('data-label', 'Rapport');
    const pdfBtn = document.createElement('button');
    pdfBtn.type = 'button';
    pdfBtn.className = 'btn btn-secondary audit-plan-pdf-btn';
    pdfBtn.textContent = '📄 Télécharger PDF';
    pdfBtn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const auditId = row.id || row.ref;
      try {
        const res = await qhseFetch(`/api/audits/${encodeURIComponent(auditId)}/pdf`);
        if (!res.ok) {
          const j = await res.json().catch(() => ({}));
          throw new Error(typeof j?.error === 'string' ? j.error : `HTTP ${res.status}`);
        }
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `audit-${row.ref}.pdf`;
        a.rel = 'noopener';
        document.body.append(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast(`PDF « ${row.ref} » téléchargé.`, 'success');
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'Téléchargement PDF impossible', 'error');
      }
    });
    pdfWrap.append(pdfBtn);
    line.append(pdfWrap);
    const goPilotage = () => {
      document
        .getElementById('audit-cockpit-tier-critical')
        ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      activityLogStore.add({
        module: 'audits',
        action: 'Navigation depuis planning audit',
        detail: row.ref,
        user: 'Utilisateur'
      });
    };
    line.addEventListener('click', goPilotage);
    line.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        goPilotage();
      }
    });
    table.append(line);
  });

  wrap.append(table);
  return wrap;
}

export async function renderAudits() {
  const [auditExpertUx, auditFormMod, auditResultMod, auditFieldModeMod, auditDocStripMod] =
    await Promise.all([
      import('../components/auditExpertUx.js'),
      import('../components/auditFormDialog.js'),
      import('../components/auditResultPanel.js'),
      import('../components/auditFieldMode.js'),
      import('../components/auditDocumentComplianceStrip.js')
    ]);
  const {
    ensureAuditExpertUxStyles,
    createAuditExpertCockpitBlock,
    createExigenceHeatmap,
    createProcessScoresBlock,
    attachModeDirectionButton,
    runAuditExpertAlerts,
    buildAuditTimeline,
    openAuditCsvImportModal,
    enhanceAuditAssistantCard
  } = auditExpertUx;
  const { createAuditImportDraftSection, openAuditDialog } = auditFormMod;
  const { openAuditResult } = auditResultMod;
  const { createAuditFieldMode } = auditFieldModeMod;
  const { createAuditDocumentComplianceStrip } = auditDocStripMod;

  ensureAuditProductsStyles();
  ensureAuditPlusStyles();
  ensureQhsePilotageStyles();
  ensureDashboardStyles();
  ensureAuditPremiumSaaSStyles();
  ensureAuditExpertUxStyles();

  const su = getSessionUser();
  const canAuditWrite = canResource(su?.role, 'audits', 'write');
  const canReportRead = canResource(su?.role, 'reports', 'read');
  const canReportWrite = canResource(su?.role, 'reports', 'write');
  const auditNotifModel = buildAuditSmartNotifications();
  const statusTone = LAST_AUDIT.conforme ? 'green' : 'red';
  const cockpitPrevScore = getCockpitPreviousAuditScore();
  const dashboardIntent = consumeDashboardIntent();
  let pendingFocusAuditId =
    dashboardIntent?.focusAuditId != null && String(dashboardIntent.focusAuditId).trim()
      ? String(dashboardIntent.focusAuditId).trim()
      : '';
  let pendingFocusAuditRef =
    dashboardIntent?.focusAuditRef != null && String(dashboardIntent.focusAuditRef).trim()
      ? String(dashboardIntent.focusAuditRef).trim()
      : '';
  let pendingFocusAuditTitle =
    dashboardIntent?.focusAuditTitle != null && String(dashboardIntent.focusAuditTitle).trim()
      ? String(dashboardIntent.focusAuditTitle).trim().slice(0, 200)
      : '';

  function tryFocusAuditFromIntent() {
    const id = pendingFocusAuditId ? String(pendingFocusAuditId).trim() : '';
    const ref = pendingFocusAuditRef ? String(pendingFocusAuditRef).trim() : '';
    const titleHint = pendingFocusAuditTitle ? String(pendingFocusAuditTitle).trim() : '';
    if (!id && !ref && !titleHint) return;

    pendingFocusAuditId = '';
    pendingFocusAuditRef = '';
    pendingFocusAuditTitle = '';

    const lastRef = (LAST_AUDIT.ref || '').trim().toLowerCase();
    const refLow = ref.trim().toLowerCase();
    const matchesLast =
      (refLow && refLow === lastRef) ||
      (Boolean(titleHint) && lastRef.includes(titleHint.toLowerCase().slice(0, 36)));

    if (matchesLast) {
      scheduleScrollIntoView('audit-cockpit-tier-score');
      queueMicrotask(() => {
        openAuditResult(
          { ...LAST_AUDIT },
          {
            onEdit: () => {
              showToast(
                'Édition : basculez cette page en Expert pour le pilotage complet et la checklist chantier.',
                'info'
              );
            }
          }
        );
      });
      return;
    }

    const sel = (ref || titleHint.split(/\s+/).find((x) => x) || '').trim();
    if (sel) {
      const esc =
        typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(sel) : sel.replace(/"/g, '\\"');
      const planRow = document.querySelector(`[data-audit-plan-ref="${esc}"]`);
      if (planRow) {
        planRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        return;
      }
    }

    showToast('Audit non présent dans la vue cockpit actuelle — vérifiez la référence.', 'warning');
  }

  const page = document.createElement('section');
  page.className =
    'page-stack page-stack--premium-saas audit-products-page audit-plus-page audit-cockpit-page audit-premium-page';

  const { bar: auditsPageViewBar } = mountPageViewModeSwitch({
    pageId: 'audits',
    pageRoot: page,
    hintEssential:
      'Essentiel : score, workflow et priorités — checklist chantier, exports et blocs experts passent en vue Expert (cette page).',
    hintAdvanced:
      'Expert : constats, plan d’action, traçabilité, preuves, checklist chantier et exports CSV/PDF.'
  });

  /** Ajustement local du score affiché (pas d’écriture serveur sur cet écran). */
  let scoreAdjust = 0;
  function bumpScore(delta) {
    scoreAdjust += delta;
    scoreAdjust = Math.max(-12, Math.min(12, scoreAdjust));
    updateScoreUi();
  }
  /** @type {(() => void) | null} */
  let updateScoreUi = null;

  const importDraft = readImportDraft();
  const importDraftEl =
    importDraft?.targetPageId === 'audits' && importDraft.prefillData
      ? createAuditImportDraftSection(
          importDraft.prefillData,
          canAuditWrite,
          su
        )
      : null;

  const fieldMode = createAuditFieldMode({
    points: FIELD_POINTS,
    auditRef: LAST_AUDIT.ref,
    siteId: appState.activeSiteId || undefined
  });

  function openAuditTerrain() {
    fieldMode.reset();
    fieldMode.show();
    fieldMode.element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    showToast('Checklist chantier activée — renseignez les points ci-dessous.', 'info');
    activityLogStore.add({
      module: 'audits',
      action: 'Ouverture mode audit terrain',
      detail: 'Checklist interactive — parcours chantier',
      user: 'Auditeur terrain'
    });
  }

  function openAuditTerrainSimplified() {
    page.classList.add('audit-premium-page--terrain');
    document.querySelector('.audit-cockpit-checklist')?.scrollIntoView({
      behavior: 'smooth',
      block: 'start'
    });
    showToast('Audit terrain : focus checklist — étapes ci-dessus.', 'info');
    activityLogStore.add({
      module: 'audits',
      action: 'Lancer audit terrain (parcours)',
      detail: 'Vue simplifiée — parcours terrain',
      user: su?.name || 'Auditeur'
    });
  }

  async function generateAuditIsoClientPdf() {
    try {
      const { buildAuditIsoPdfHtml, downloadAuditIsoPdfFromHtml } = await import(
        '../components/auditPremiumSaaS.pdf.js'
      );
      const curScore = Math.min(
        100,
        Math.max(0, Math.round(LAST_AUDIT.score + scoreAdjust))
      );
      const html = buildAuditIsoPdfHtml({
        auditRef: LAST_AUDIT.ref,
        site: LAST_AUDIT.site,
        auditeur: LAST_AUDIT.auditeur,
        date: LAST_AUDIT.date,
        score: curScore,
        checklist: CHECKLIST,
        normScores: AUDIT_ISO_NORM_SCORES,
        proofs: AUDIT_PROOFS.map((p) => ({ name: p.name, status: p.status })),
        treatmentRows: AUDIT_TREATMENT_ROWS,
        traceRows: AUDIT_TRACE_ROWS,
        signerName: su?.name || 'Responsable audit'
      });
      await downloadAuditIsoPdfFromHtml(html, `audit-iso-${LAST_AUDIT.ref}`);
      activityLogStore.add({
        module: 'audits',
        action: 'Export PDF ISO complet',
        detail: LAST_AUDIT.ref,
        user: su?.name || 'Utilisateur'
      });
    } catch (e) {
      console.error(e);
    }
  }

  async function generateAuditPdfReport() {
    try {
      const { ok, ref: latestRef, status } = await loadLatestAuditRef();
      if (!ok) throw new Error(`Audits ${status}`);
      if (!latestRef) {
        showToast('Aucun audit en base : impossible de générer le rapport PDF.', 'error');
        return;
      }
      /* Même rendu HTML que « Export PDF ISO complet » (html2canvas + jsPDF), pas le PDF texte pdfkit du backend. */
      if (latestRef !== LAST_AUDIT.ref) {
        showToast(
          'Le PDF reprend les données de l’audit affiché dans le cockpit (peut différer du premier audit API).',
          'info'
        );
      }
      await generateAuditIsoClientPdf();
      activityLogStore.add({
        module: 'audits',
        action: 'Demande de rapport audit',
        detail: `Synthèse ${latestRef} — export PDF (navigateur)`,
        user: 'Responsable QHSE'
      });
    } catch (e) {
      console.error(e);
      showToast('Erreur lors de la génération du PDF.', 'error');
    }
  }

  function downloadAuditConstatsCsv() {
    const header = 'Point;Statut;Preuve_documentaire';
    const esc = (s) =>
      String(s ?? '')
        .replace(/\r?\n/g, ' ')
        .replace(/;/g, ',');
    const lines = CHECKLIST.map((c) => {
      const st = c.conforme ? 'Conforme' : 'Non_conforme';
      return `${esc(c.point)};${st};${esc(c.proofRef)}`;
    });
    const text = `\uFEFF${[header, ...lines].join('\r\n')}`;
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `constats-${LAST_AUDIT.ref.replace(/[^\w-]+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export constats téléchargé (CSV, génération locale).', 'info');
    activityLogStore.add({
      module: 'audits',
      action: 'Export CSV constats audit',
      detail: LAST_AUDIT.ref,
      user: su?.name || 'Utilisateur'
    });
  }

  function downloadAuditPlanActionsCsv() {
    const header = 'NC;Action_corrective;Responsable;Echeance';
    const esc = (s) =>
      String(s ?? '')
        .replace(/\r?\n/g, ' ')
        .replace(/;/g, ',');
    const lines = AUDIT_TREATMENT_ROWS.map((r) =>
      [esc(r.nc), esc(r.action), esc(r.owner), esc(r.due)].join(';')
    );
    const text = `\uFEFF${[header, ...lines].join('\r\n')}`;
    const blob = new Blob([text], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `plan-actions-${LAST_AUDIT.ref.replace(/[^\w-]+/g, '_')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Export plan d’actions téléchargé (CSV, génération locale).', 'info');
    activityLogStore.add({
      module: 'audits',
      action: 'Export CSV plan d’actions audit',
      detail: LAST_AUDIT.ref,
      user: su?.name || 'Utilisateur'
    });
  }

  const checklistConformeCount = CHECKLIST.filter((c) => c.conforme).length;
  const checklistNcPoints = CHECKLIST.length - checklistConformeCount;
  const checklistPartialCount = CHECKLIST.filter((c) => c.partial === true).length;
  const chartConformeStrict = CHECKLIST.filter((c) => c.conforme && !c.partial).length;
  const chartNcOnly = CHECKLIST.filter((c) => !c.conforme).length;
  const auditActionsGeneratedCount = LAST_AUDIT.ncCount + AUDIT_TREATMENT_ROWS.length + 2;

  const auditExpertCockpitBlock = createAuditExpertCockpitBlock({
    score: LAST_AUDIT.score,
    ncMajeures: AUDIT_NC_MAJEURES,
    ncMineures: AUDIT_NC_MINEURES,
    preuvesManquantes: AUDIT_PROOFS.filter((p) => p.status === 'missing').length,
    actionsCritiques: ACTIONS_RETARD_COUNT,
    chartLabels: ['Conforme', 'Partiel', 'NC'],
    chartValues: [chartConformeStrict, checklistPartialCount, chartNcOnly]
  });

  const heroCard = document.createElement('article');
  heroCard.className = 'content-card card-soft audit-premium-header';
  heroCard.innerHTML = `
    <div class="audit-iso-pilot-wrap">
      <div class="audit-iso-pilot-bar">
        <div class="audit-iso-pilot-bar__main">
          <div class="audit-iso-pilot-bar__title-block">
            <div class="section-kicker audit-premium-header__kicker">Audit documenté</div>
            <h3 class="audit-premium-header__title">${escapeHtml(LAST_AUDIT.ref)}</h3>
          </div>
          <dl class="audit-iso-pilot-bar__meta" aria-label="Fiche d’identification audit">
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Référentiel</dt>
              <dd>${escapeHtml(AUDIT_REFERENTIEL_LABEL)}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Site</dt>
              <dd>${escapeHtml(LAST_AUDIT.site)}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Auditeur</dt>
              <dd>${escapeHtml(LAST_AUDIT.auditeur)}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Date</dt>
              <dd>${escapeHtml(LAST_AUDIT.date)}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Statut</dt>
              <dd><span class="badge ${statusTone} audit-premium-header__status">${LAST_AUDIT.conforme ? 'Conforme' : 'Non conforme'}</span></dd>
            </div>
          </dl>
          <div class="audit-premium-header__score" aria-label="Score global">
            <span class="audit-premium-header__score-val">${escapeHtml(LAST_AUDIT.score)}%</span>
            <span class="audit-premium-header__score-lbl">Score global</span>
          </div>
        </div>
        <div class="audit-iso-pilot-bar__footer">
          <nav class="audit-premium-header__nav" data-audit-tier-nav aria-label="Aller à une section"></nav>
          <div class="audit-premium-header__ctas" data-audit-hero-ctas></div>
        </div>
      </div>
      <div class="audit-premium-header__progress-wrap" aria-label="Avancement traitement des constats">
        <div class="audit-premium-header__progress-top">
          <span>Progression constats</span>
          <span>${escapeHtml(LAST_AUDIT.progress)}%</span>
        </div>
        <div class="audit-progress-bar audit-premium-header__progress-bar"><span style="width:${Math.max(0, Math.min(100, Number(LAST_AUDIT.progress) || 0))}%"></span></div>
      </div>
    </div>
  `;
  const heroCtasHost = heroCard.querySelector('[data-audit-hero-ctas]');
  const heroLaunch = document.createElement('button');
  heroLaunch.type = 'button';
  heroLaunch.className = 'btn btn-primary';
  heroLaunch.textContent = 'Lancer un audit';
  heroLaunch.addEventListener('click', openAuditTerrain);
  if (!canAuditWrite && su) heroLaunch.style.display = 'none';
  const heroTerrain = document.createElement('button');
  heroTerrain.type = 'button';
  heroTerrain.className = 'btn btn-secondary';
  heroTerrain.textContent = 'Lancer audit terrain';
  heroTerrain.title = 'Checklist, parcours simplifié, étapes terrain';
  heroTerrain.addEventListener('click', openAuditTerrainSimplified);
  if (!canAuditWrite && su) heroTerrain.style.display = 'none';
  const heroPdf = document.createElement('button');
  heroPdf.type = 'button';
  heroPdf.className = 'btn btn-secondary';
  heroPdf.textContent = 'Rapport PDF';
  heroPdf.addEventListener('click', () => {
    void generateAuditPdfReport();
  });
  if (!canReportRead && su) heroPdf.style.display = 'none';
  const heroPdfIso = document.createElement('button');
  heroPdfIso.type = 'button';
  heroPdfIso.className = 'btn btn-secondary';
  heroPdfIso.textContent = 'PDF ISO (complet)';
      heroPdfIso.title = 'Checklist, preuves, NC, actions, signature — export PDF';
  heroPdfIso.addEventListener('click', () => {
    void generateAuditIsoClientPdf();
  });
  if (!canReportRead && su) heroPdfIso.style.display = 'none';

  const heroCreateAudit = document.createElement('button');
  heroCreateAudit.type = 'button';
  heroCreateAudit.className = 'btn btn-secondary';
  heroCreateAudit.textContent = 'Créer un audit';
  heroCreateAudit.addEventListener('click', () => {
    openAuditDialog(null, {
      canAuditWrite,
      su,
      onSave: (body) => {
        const mergedRef =
          body && typeof body === 'object'
            ? String(body.ref ?? body.reference ?? '').trim()
            : '';
        if (mergedRef) pendingFocusAuditRef = mergedRef;
        pendingFocusAuditId =
          body && typeof body === 'object' && body.id != null
            ? String(body.id).trim()
            : '';
        pendingFocusAuditTitle = '';
        queueMicrotask(() => tryFocusAuditFromIntent());
      }
    });
  });
  if (!canAuditWrite && su) heroCreateAudit.style.display = 'none';

  const scoreHost = heroCard.querySelector('.audit-premium-header__score');
  const scoreDeltaEl = document.createElement('span');
  scoreDeltaEl.className = 'audit-score-delta';
  scoreHost?.append(scoreDeltaEl);
  if (scoreHost) {
    scoreHost.style.cursor = 'pointer';
    scoreHost.setAttribute('role', 'button');
    scoreHost.setAttribute('tabindex', '0');
    scoreHost.setAttribute('title', 'Synthèse détaillée (dialog)');
    const openResult = () => {
      const cur = Math.min(100, Math.max(0, Math.round(LAST_AUDIT.score + scoreAdjust)));
      openAuditResult(
        { ...LAST_AUDIT, score: cur },
        {
          onEdit: () => {
            showToast('Édition : basculez cette page en Expert pour le pilotage complet et la checklist chantier.', 'info');
          }
        }
      );
    };
    scoreHost.addEventListener('click', openResult);
    scoreHost.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openResult();
      }
    });
  }

  updateScoreUi = () => {
    const base = LAST_AUDIT.score;
    const cur = Math.min(100, Math.max(0, Math.round(base + scoreAdjust)));
    const valEl = heroCard.querySelector('.audit-premium-header__score-val');
    if (valEl) valEl.textContent = `${cur}%`;
    const diff = cur - base;
    if (scoreDeltaEl) {
      scoreDeltaEl.textContent =
        diff === 0 ? '±0%' : diff > 0 ? `+${diff}%` : `${diff}%`;
      scoreDeltaEl.classList.remove('audit-score-delta--up', 'audit-score-delta--down');
      if (diff > 0) scoreDeltaEl.classList.add('audit-score-delta--up');
      else if (diff < 0) scoreDeltaEl.classList.add('audit-score-delta--down');
    }
  };
  updateScoreUi();

  heroCtasHost?.append(heroLaunch, heroTerrain, heroCreateAudit, heroPdf, heroPdfIso);
  attachModeDirectionButton(page, heroCtasHost);

  const notifCard = createAuditIntelligentNotificationsCard({
    canAuditWrite,
    su,
    model: auditNotifModel
  });
  notifCard.classList.add('audit-expert-hide-direction');

  const conformitySummary = document.createElement('div');
  conformitySummary.className = 'audit-iso-conformity-row';
  conformitySummary.setAttribute('aria-label', 'Résumé de conformité — constats checklist');
  function mkConformityCard(cardCls, lbl, val, hint) {
    const card = document.createElement('div');
    card.className = `audit-iso-conformity-card ${cardCls}`;
    const l = document.createElement('span');
    l.className = 'audit-iso-conformity-card__lbl';
    l.textContent = lbl;
    const v = document.createElement('span');
    v.className = 'audit-iso-conformity-card__val';
    v.textContent = String(val);
    const h = document.createElement('span');
    h.className = 'audit-iso-conformity-card__hint';
    h.textContent = hint;
    card.append(l, v, h);
    return card;
  }
  conformitySummary.append(
    mkConformityCard('audit-iso-conformity-card--ok', 'Conformes', checklistConformeCount, 'Points checklist'),
    mkConformityCard(
      'audit-iso-conformity-card--partial',
      'Partiels',
      checklistPartialCount,
      'Déclarés sur l’extrait'
    ),
    mkConformityCard(
      'audit-iso-conformity-card--nc',
      'Non-conformités',
      checklistNcPoints,
      'Constats checklist'
    ),
    mkConformityCard(
      'audit-iso-conformity-card--act',
      'Actions générées',
      auditActionsGeneratedCount,
      'Pilotage sur cet extrait'
    )
  );

  const strategicKpis = document.createElement('div');
  strategicKpis.className = 'audit-strategic-kpis';
  strategicKpis.setAttribute('aria-label', 'Indicateurs stratégiques');
  function mkStrategicKpi(lbl, val, hint) {
    const k = document.createElement('div');
    k.className = 'audit-strategic-kpi';
    const l = document.createElement('span');
    l.className = 'audit-strategic-kpi__lbl';
    l.textContent = lbl;
    const v = document.createElement('span');
    v.className = 'audit-strategic-kpi__val';
    v.textContent = String(val);
    k.append(l, v);
    if (hint) {
      const hi = document.createElement('span');
      hi.className = 'audit-strategic-kpi__hint';
      hi.textContent = hint;
      k.append(hi);
    }
    return k;
  }
  strategicKpis.append(
    mkStrategicKpi('Audits en cours', countPlannedByStatut('en cours')),
    mkStrategicKpi('Planifiés', PLANNED_AUDITS.length, 'Registre planification'),
    mkStrategicKpi('NC ouvertes', NC_OUVERTES_COUNT),
    mkStrategicKpi('Actions en retard', ACTIONS_RETARD_COUNT)
  );

  const exportIsoBar = document.createElement('div');
  exportIsoBar.className = 'audit-iso-export-bar';
  exportIsoBar.setAttribute('aria-label', 'Exports audit ISO');
  exportIsoBar.innerHTML = `
    <div class="audit-iso-export-bar__head">
      <span class="audit-iso-export-bar__title">Exports complémentaires</span>
      <span class="audit-iso-export-bar__sub">Constats et plan (CSV, local). Synthèse PDF : bandeau de pilotage.</span>
    </div>
    <div class="audit-iso-export-bar__actions" data-audit-iso-export-actions></div>
  `;
  const exportActionsHost = exportIsoBar.querySelector('[data-audit-iso-export-actions]');
  const exportConstatsBtn = document.createElement('button');
  exportConstatsBtn.type = 'button';
  exportConstatsBtn.className = 'btn btn-secondary';
  exportConstatsBtn.textContent = 'Exporter constats (CSV)';
  exportConstatsBtn.addEventListener('click', () => {
    void (async () => {
      if (
        !(await ensureSensitiveAccess('export_sensitive', {
          contextLabel: 'export CSV des constats audit'
        }))
      ) {
        return;
      }
      downloadAuditConstatsCsv();
    })();
  });
  const exportPlanBtn = document.createElement('button');
  exportPlanBtn.type = 'button';
  exportPlanBtn.className = 'btn btn-secondary';
  exportPlanBtn.textContent = 'Exporter plan d’actions (CSV)';
  exportPlanBtn.addEventListener('click', () => {
    void (async () => {
      if (
        !(await ensureSensitiveAccess('export_sensitive', {
          contextLabel: 'export CSV du plan d’actions audit'
        }))
      ) {
        return;
      }
      downloadAuditPlanActionsCsv();
    })();
  });
  const importAuditCsvBtn = document.createElement('button');
  importAuditCsvBtn.type = 'button';
  importAuditCsvBtn.className = 'btn btn-secondary';
  importAuditCsvBtn.textContent = 'Importer audit CSV';
  importAuditCsvBtn.addEventListener('click', () => {
    openAuditCsvImportModal((data) => {
      showToast(
        `Import prêt : ${data.exigences.length} exig. · ${data.ncs.length} NC · ${data.preuves.length} preuves (aperçu local).`,
        'info'
      );
      activityLogStore.add({
        module: 'audits',
        action: 'Import CSV audit (preview)',
        detail: 'Validation locale — aperçu import',
        user: su?.name || 'Utilisateur'
      });
    });
  });
  const exportAuditsCsvBtn = document.createElement('button');
  exportAuditsCsvBtn.type = 'button';
  exportAuditsCsvBtn.className = 'btn btn-secondary btn-sm';
  exportAuditsCsvBtn.textContent = 'Export CSV';
  exportAuditsCsvBtn.addEventListener('click', async () => {
    try {
      const res = await qhseFetch(withSiteQuery('/api/export/audits'));
      if (!res.ok) {
        showToast('Export impossible', 'error');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'audits-export.csv';
      document.body.append(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      showToast('Erreur réseau', 'error');
    }
  });
  exportActionsHost?.append(exportConstatsBtn, exportPlanBtn, importAuditCsvBtn, exportAuditsCsvBtn);

  const auditTrendCard = document.createElement('article');
  auditTrendCard.className = 'content-card card-soft audit-cockpit-chart-card audit-premium-chart-card';
  auditTrendCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Lecture direction</div>
        <h3>Scores par norme</h3>
        <p class="audit-premium-chart-sub">Lecture synthétique — écart vs audit précédent sous le graphique.</p>
      </div>
    </div>
  `;
  const auditTrendBody = document.createElement('div');
  auditTrendBody.className =
    'dashboard-chart-card-inner audit-cockpit-strategic-chart-body audit-premium-chart-body';
  const auditNormChartSlot = document.createElement('div');
  auditNormChartSlot.className = 'audit-cockpit-norm-chart-slot';
  auditTrendBody.append(auditNormChartSlot);
  void (async () => {
    try {
      const { createAuditIsoNormBarsChart } = await import('../components/dashboardCharts.js');
      auditNormChartSlot.replaceWith(createAuditIsoNormBarsChart(AUDIT_ISO_NORM_SCORES));
    } catch (e) {
      console.error(e);
    }
  })();
  const deltaStrip = document.createElement('div');
  deltaStrip.className = 'audit-cockpit-delta-strip';
  deltaStrip.setAttribute('role', 'status');
  if (cockpitPrevScore == null) {
    deltaStrip.textContent =
      'Évolution : pas d’audit précédent sur l’extrait affiché.';
  } else {
    const cur = Math.round(Math.max(0, Math.min(100, Number(LAST_AUDIT.score) || 0)));
    const d = cur - cockpitPrevScore;
    const sign = d > 0 ? '+' : '';
    deltaStrip.replaceChildren();
    const dStrong = document.createElement('strong');
    dStrong.textContent = `${sign}${d} pts`;
    deltaStrip.append(
      dStrong,
      document.createTextNode(
        ` vs audit précédent (${cockpitPrevScore}% → ${cur}%).`
      )
    );
  }
  auditTrendBody.append(deltaStrip);
  auditTrendCard.append(auditTrendBody);

  const auditChartsRow = document.createElement('section');
  auditChartsRow.className = 'audit-premium-chart-wrap';
  auditChartsRow.append(auditTrendCard);
  const cockpitCard = document.createElement('article');
  cockpitCard.className = 'content-card card-soft audit-cockpit-main audit-last-card audit-premium-cockpit';
  const stepperHtml = COCKPIT_CYCLE_LABELS.map((lab, i) => {
    let cls = 'audit-cockpit-step';
    if (i < COCKPIT_CYCLE_ACTIVE) cls += ' audit-cockpit-step--done';
    else if (i === COCKPIT_CYCLE_ACTIVE) cls += ' audit-cockpit-step--active';
    return `<div class="${cls}" role="listitem">${escapeHtml(lab)}</div>`;
  }).join('');

  cockpitCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Pilotage</div>
        <h3>Synthèse opérationnelle</h3>
        <p class="content-card-lead audit-last-lead">${escapeHtml(LAST_AUDIT.ref)} · cycle de correction</p>
      </div>
    </div>
    <div class="audit-premium-cockpit__body">
      <div class="audit-cockpit-metrics audit-premium-cockpit__metrics">
        <div class="audit-cockpit-metric"><span>NC (audit)</span><span>${escapeHtml(LAST_AUDIT.ncCount)}</span></div>
        <div class="audit-cockpit-metric"><span>Référentiels</span><span class="audit-premium-cockpit__iso">9001 · 14001 · 45001</span></div>
      </div>
      <div class="audit-cockpit-cycle">
        <p class="audit-cockpit-cycle__label">Cycle contrôle &amp; correction</p>
        <div class="audit-cockpit-stepper" role="list">${stepperHtml}</div>
        <p class="audit-cockpit-cycle-progress">Phase active : <strong>${escapeHtml(COCKPIT_CYCLE_LABELS[COCKPIT_CYCLE_ACTIVE])}</strong></p>
      </div>
    </div>
    <div class="audit-cockpit-ctas" data-audit-cockpit-ctas></div>
  `;

  const cockpitCtas = cockpitCard.querySelector('[data-audit-cockpit-ctas]');
  const cVoirConstats = document.createElement('button');
  cVoirConstats.type = 'button';
  cVoirConstats.className = 'btn btn-secondary';
  cVoirConstats.textContent = 'Voir la checklist';
  cVoirConstats.addEventListener('click', () => {
    document.querySelector('.audit-cockpit-checklist')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
  });
  cockpitCtas?.append(cVoirConstats);

  const isoSortedForInsight = [...AUDIT_ISO_NORM_SCORES].sort(
    (a, b) => a.score - b.score
  );
  const isoWeakestForInsight = isoSortedForInsight[0];
  const auditStrategicInsightLine =
    isoWeakestForInsight && String(isoWeakestForInsight.norm).includes('14001')
      ? 'Insight : priorité environnement ISO 14001 — écart vs 9001/45001 sur les scores affichés.'
      : isoWeakestForInsight
        ? `Insight : focus ${isoWeakestForInsight.norm} (${isoWeakestForInsight.score} %).`
        : '';

  const iaCard = document.createElement('article');
  iaCard.className = 'content-card card-soft audit-cockpit-ia audit-premium-assistant';
  iaCard.innerHTML = `
    <div class="audit-premium-assistant__head">
      <div>
        <div class="section-kicker">IA</div>
        <h3 class="audit-premium-assistant__title">Assistant audit</h3>
        <p class="audit-premium-assistant__lead">Suggestions — validation humaine, sans écriture automatique.</p>
      </div>
    </div>
    <p class="audit-premium-assistant__insight" role="status"></p>
    <div class="audit-premium-assistant__primary" data-audit-ia-primary></div>
    <details class="audit-premium-assistant__more">
      <summary>Autres suggestions</summary>
      <div class="audit-cockpit-ia__grid audit-premium-assistant__grid" data-audit-ia-secondary></div>
    </details>
  `;
  const iaInsight = iaCard.querySelector('.audit-premium-assistant__insight');
  if (iaInsight) {
    const line = String(auditStrategicInsightLine || '').trim();
    if (line) {
      iaInsight.textContent = line;
    } else {
      iaInsight.classList.add('audit-premium-assistant__insight--empty');
      iaInsight.textContent = '';
    }
  }
  const iaPrimary = iaCard.querySelector('[data-audit-ia-primary]');
  const iaSecondary = iaCard.querySelector('[data-audit-ia-secondary]');
  const iaActionsPrimary = [
    { label: 'Résumer les constats', key: 'resume' },
    { label: 'Proposer plan d’actions', key: 'plan' },
    { label: 'Identifier preuves manquantes', key: 'proof_gap' }
  ];
  const iaActionsSecondary = [
    { label: 'Préparer l’audit', key: 'prep' },
    { label: 'Détecter les écarts critiques', key: 'gap' },
    { label: 'Générer synthèse de clôture', key: 'close' },
    { label: 'Suggérer quand notifier les équipes', key: 'suggest_notify' }
  ];
  function wireIaButton(b, label, key) {
    b.addEventListener('click', () => {
      if (key === 'suggest_notify') {
        showToast(auditNotifModel.suggestNotifyHint, 'info');
        document
          .querySelector('.audit-cockpit-notifs')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        activityLogStore.add({
          module: 'audits',
          action: 'Suggestion IA — fenêtre de notification',
          detail: 'Quand notifier les participants',
          user: 'Utilisateur'
        });
        return;
      }
      if (key === 'proof_gap') {
        showToast(
          'Analyse locale : consulter « Documents & preuves » — colonnes manquants / à vérifier (aucun classement automatique engageant).',
          'info'
        );
        document
          .querySelector('.audit-cockpit-proofs')
          ?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        activityLogStore.add({
          module: 'audits',
          action: 'Assistant audit — preuves à compléter',
          detail: 'Focus zone preuves',
          user: 'Utilisateur'
        });
        return;
      }
      showToast(
        `Suggestion IA « ${label} » — connectez votre moteur ou API pour une analyse produite côté serveur.`,
        'info'
      );
      activityLogStore.add({
        module: 'audits',
        action: 'Action IA audit (assistant)',
        detail: key,
        user: 'Utilisateur'
      });
    });
  }
  if (iaPrimary) {
    iaActionsPrimary.forEach(({ label, key }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn btn-secondary audit-premium-assistant__btn-main';
      b.textContent = label;
      wireIaButton(b, label, key);
      iaPrimary.append(b);
    });
  }
  if (iaSecondary) {
    iaActionsSecondary.forEach(({ label, key }) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'audit-cockpit-ia__btn';
      b.textContent = label;
      wireIaButton(b, label, key);
      iaSecondary.append(b);
    });
  }

  enhanceAuditAssistantCard(
    iaCard,
    {
      missingProofs: AUDIT_PROOFS.filter((p) => p.status === 'missing').length,
      criticalNc: AUDIT_NC_MAJEURES,
      recommendations: [
        'Consolider le dossier probatoire avant la prochaine visite certification.',
        'Aligner le plan d’actions sur les écarts ISO 14001 identifiés au cockpit.'
      ]
    },
    {
      onPlan: () => {
        showToast('Plan d’action structuré — brouillon affiché.', 'info');
        document.getElementById('audit-iso-tier-treatment')?.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest'
        });
        activityLogStore.add({
          module: 'audits',
          action: 'IA — Générer plan d’action',
          detail: LAST_AUDIT.ref,
          user: su?.name || 'Utilisateur'
        });
      },
      onReport: () => {
        void generateAuditIsoClientPdf();
      },
      onPrior: () => {
        document.getElementById('audit-cockpit-tier-critical')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
        showToast('Priorisation : NC critiques et retards (zone « Priorités audit »).', 'info');
        activityLogStore.add({
          module: 'audits',
          action: 'IA — Prioriser',
          detail: 'Scroll cockpit',
          user: su?.name || 'Utilisateur'
        });
      }
    }
  );

  const prioCard = document.createElement('article');
  prioCard.className =
    'content-card card-soft audit-cockpit-prio audit-premium-nc audit-prio-audit-block';
  if (AUDIT_NC_MAJEURES > 0) {
    prioCard.classList.add('audit-cockpit-prio--expert-highlight');
  }
  const prioList = document.createElement('ul');
  prioList.className = 'audit-premium-nc__list';
  AUDIT_PRIORITY_LINES.forEach((line) => {
    const li = document.createElement('li');
    const strong = document.createElement('strong');
    strong.textContent = line.label;
    const span = document.createElement('span');
    span.className = 'audit-cockpit-prio__detail';
    span.textContent = line.detail;
    li.append(strong, span);
    prioList.append(li);
  });
  prioCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Pilotage</div>
        <h3>Priorités audit</h3>
        <p class="audit-cockpit-prio__lead">NC critiques, preuves manquantes, audits en retard — liens opérationnels ci-dessous.</p>
      </div>
    </div>
  `;
  prioCard.append(prioList);
  const prioFoot = document.createElement('div');
  prioFoot.className = 'audit-premium-nc__foot';
  const prioToActions = document.createElement('button');
  prioToActions.type = 'button';
  prioToActions.className = 'btn btn-primary';
  prioToActions.textContent = 'Ouvrir le plan d’actions';
  prioToActions.addEventListener('click', () => {
    qhseNavigate('actions', {
      skipDefaults: true,
      linkedAuditTitle: LAST_AUDIT.ref,
      linkedNonConformity: 'NC critiques & preuves (vue pilotage audits)'
    });
  });
  prioFoot.append(prioToActions);
  prioCard.append(prioFoot);

  const planCard = document.createElement('article');
  planCard.id = 'audit-cockpit-planning-block';
  planCard.className = 'content-card card-soft audit-plan-card audit-plan-card--cockpit';
  planCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Planification</div>
        <h3>Audits planifiés</h3>
      </div>
    </div>
  `;
  planCard.append(createPlanningTable());
  const planActions = document.createElement('div');
  planActions.className = 'audit-plan-actions';
  const planBtn = document.createElement('button');
  planBtn.type = 'button';
  planBtn.className = 'btn btn-primary';
  planBtn.textContent = 'Planifier un audit';
  planBtn.addEventListener('click', () => {
    showToast('Planification : ouvrez votre calendrier ou workflow selon votre organisation.', 'info');
    activityLogStore.add({
      module: 'audits',
      action: 'Demande de planification audit',
      detail: 'Depuis le cockpit Audit+',
      user: 'Coordinateur QHSE'
    });
  });
  if (!canAuditWrite && su) planBtn.style.display = 'none';
  planActions.append(planBtn);
  planCard.append(planActions);
  planCard.classList.add('audit-expert-hide-direction');

  const treatmentCard = document.createElement('article');
  treatmentCard.className =
    'content-card card-soft audit-iso-treatment-card audit-cockpit-treatment';
  treatmentCard.id = 'audit-iso-tier-treatment';
  treatmentCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Traitement</div>
        <h3>Non-conformités ouvertes &amp; actions correctives</h3>
        <p class="content-card-lead audit-iso-treatment-card__lead">NC, actions, responsables, échéances.</p>
      </div>
    </div>
  `;
  const treatmentTable = document.createElement('div');
  treatmentTable.className = 'audit-iso-treatment-table';
  treatmentTable.setAttribute('role', 'table');
  treatmentTable.setAttribute('aria-label', 'Liaison NC et actions correctives');
  const treatmentHead = document.createElement('div');
  treatmentHead.className = 'audit-iso-treatment-head';
  treatmentHead.setAttribute('role', 'row');
  treatmentHead.innerHTML = `
    <span role="columnheader">NC</span>
    <span role="columnheader">Action</span>
    <span role="columnheader">Responsable</span>
    <span role="columnheader">Échéance</span>
  `;
  treatmentTable.append(treatmentHead);
  AUDIT_TREATMENT_ROWS.forEach((r) => {
    appendTreatmentRowWithRisk(treatmentTable, r, su, LAST_AUDIT.ref);
  });
  treatmentCard.append(treatmentTable);

  const layout = document.createElement('section');

  const checklistCard = document.createElement('article');
  checklistCard.className = 'content-card card-soft audit-cockpit-checklist audit-premium-checklist';
  checklistCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Constats / checklist</div>
        <h3>Exigences — ${escapeHtml(LAST_AUDIT.ref)}</h3>
        <p class="content-card-lead audit-premium-checklist__legend">Point, statut, preuve, validation.</p>
      </div>
    </div>
  `;
  const checklistHeatmap = createExigenceHeatmap(CHECKLIST);
  const checklistStack = document.createElement('div');
  checklistStack.className = 'stack audit-premium-checklist-stack';
  CHECKLIST.forEach((item, idx) =>
    checklistStack.append(
      createConstatHumanRow(item, su, { bumpScore }, idx, {
        auditRef: LAST_AUDIT.ref,
        auditSite: LAST_AUDIT.site
      })
    )
  );
  checklistCard.append(checklistHeatmap, checklistStack);

  const rightStack = document.createElement('div');
  rightStack.className = 'audit-right-stack';

  const processScoresCard = createProcessScoresBlock(AUDIT_PROCESS_DOMAIN_SCORES);

  const historyCard = document.createElement('article');
  historyCard.className = 'content-card card-soft audit-cockpit-history audit-premium-history';
  historyCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Historique</div>
        <h3>Timeline audit</h3>
        <p class="content-card-lead" style="margin:4px 0 0;font-size:11px;color:var(--text3)">Événements chronologiques sur l’extrait affiché.</p>
      </div>
    </div>
  `;
  const timelineEvents = [
    {
      when: `${LAST_AUDIT.date} · ouverture`,
      icon: '📋',
      title: `Audit ${LAST_AUDIT.ref}`,
      detail: `${LAST_AUDIT.site} — lancement constats`
    },
    ...AUDIT_TRACE_ROWS.map((tr) => ({
      when: tr.when,
      icon: '✅',
      title: tr.action,
      detail: tr.comment
    })),
    ...HISTORY.map((h) => ({
      when: h.date,
      icon: '📊',
      title: 'Score historique',
      detail: `${h.score}% · audit interne`
    }))
  ];
  historyCard.append(buildAuditTimeline(timelineEvents));
  const histTrend = document.createElement('p');
  histTrend.className = 'audit-cockpit-history__trend';
  const histScores = HISTORY.map((h) => h?.score).filter(
    (n) => typeof n === 'number' && Number.isFinite(n)
  );
  const histMin = histScores.length ? Math.min(...histScores) : null;
  const histMax = histScores.length ? Math.max(...histScores) : null;
  const histSpan =
    histMin != null && histMax != null && histScores.length >= 2
      ? histMax - histMin
      : null;
  histTrend.textContent =
    histSpan != null
      ? `Écart de scores sur l’extrait affiché : ${histSpan} pts (min ${histMin}% · max ${histMax}%) — indépendant de l’ordre d’affichage.`
      : 'Tendance : au moins deux scores valides requis sur cet extrait.';
  historyCard.append(histTrend);

  rightStack.append(processScoresCard, historyCard);
  layout.className = 'two-column audit-cockpit-layout';
  layout.append(checklistCard, rightStack);

  const traceCard = document.createElement('article');
  traceCard.className = 'content-card card-soft audit-iso-trace-card audit-cockpit-trace';
  traceCard.id = 'audit-iso-tier-trace';
  traceCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Traçabilité</div>
        <h3>Piste d’audit — qui, quand, quoi</h3>
        <p class="content-card-lead audit-iso-trace-card__lead">Journal local des événements affichés.</p>
      </div>
    </div>
  `;
  const traceList = document.createElement('ul');
  traceList.className = 'audit-iso-trace-list';
  AUDIT_TRACE_ROWS.forEach((tr) => {
    const li = document.createElement('li');
    li.className = 'audit-iso-trace-item';
    const tw = document.createElement('div');
    tw.className = 'audit-iso-trace-item__who';
    tw.textContent = tr.who;
    const twh = document.createElement('div');
    twh.className = 'audit-iso-trace-item__when';
    twh.textContent = tr.when;
    const ta = document.createElement('div');
    ta.className = 'audit-iso-trace-item__action';
    ta.textContent = tr.action;
    const tc = document.createElement('div');
    tc.className = 'audit-iso-trace-item__comment';
    tc.textContent = tr.comment;
    li.append(tw, twh, ta, tc);
    traceList.append(li);
  });
  traceCard.append(traceList);

  const proofsCard = document.createElement('article');
  proofsCard.className =
    'content-card card-soft audit-cockpit-proofs audit-premium-proofs audit-expert-hide-direction';
  proofsCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Documents &amp; preuves</div>
        <h3>Dossier probatoire — ${escapeHtml(LAST_AUDIT.ref)}</h3>
        <p class="content-card-lead audit-premium-proofs__iso-lead">Présents · à vérifier · manquants.</p>
      </div>
    </div>
  `;
  const proofsGroups = document.createElement('div');
  proofsGroups.className = 'audit-premium-proofs-groups';
  const proofBuckets = { present: [], verify: [], missing: [] };
  AUDIT_PROOFS.forEach((p) => {
    if (p.status === 'present') proofBuckets.present.push(p);
    else if (p.status === 'missing') proofBuckets.missing.push(p);
    else proofBuckets.verify.push(p);
  });
  function proofGroupColumn(title, key, items) {
    const col = document.createElement('div');
    col.className = `audit-premium-proofs-col audit-premium-proofs-col--${key}`;
    const h = document.createElement('h4');
    h.className = 'audit-premium-proofs-col__title';
    h.textContent = title;
    const ul = document.createElement('ul');
    ul.className = 'audit-premium-proofs-col__list';
    if (!items.length) {
      const li = document.createElement('li');
      li.className = 'audit-premium-proofs-col__empty';
      li.textContent = 'Aucune';
      ul.append(li);
    } else {
      items.forEach((p) => {
        const li = document.createElement('li');
        li.textContent = p.name;
        ul.append(li);
      });
    }
    col.append(h, ul);
    return col;
  }
  proofsGroups.append(
    proofGroupColumn('Présents', 'present', proofBuckets.present),
    proofGroupColumn('À vérifier', 'verify', proofBuckets.verify),
    proofGroupColumn('Manquants', 'missing', proofBuckets.missing)
  );
  proofsCard.append(proofsGroups);

  const proofMissingActions = document.createElement('div');
  proofMissingActions.className = 'audit-proof-gen-actions';
  const proofGenHint = document.createElement('p');
  proofGenHint.className = 'audit-premium-proofs__iso-lead';
  proofGenHint.style.marginBottom = '8px';
  proofGenHint.textContent =
    'Les preuves manquantes peuvent être converties en actions correctives (brouillon local).';
  const genFromProofsBtn = document.createElement('button');
  genFromProofsBtn.type = 'button';
  genFromProofsBtn.className = 'btn btn-primary';
  genFromProofsBtn.textContent = 'Générer actions';
  genFromProofsBtn.addEventListener('click', () => {
    const missing = AUDIT_PROOFS.filter((p) => p.status === 'missing');
    if (!missing.length) {
      showToast('Aucune preuve manquante sur cet extrait.', 'info');
      return;
    }
    let added = 0;
    let seq = 0;
    missing.forEach((p) => {
      const exists = AUDIT_TREATMENT_ROWS.some(
        (r) => String(r.action || '').includes(String(p.name))
      );
      if (exists) return;
      seq += 1;
      const row = {
        nc: `PREUVE-${LAST_AUDIT.ref}-${seq}`,
        action: `Fournir la preuve : ${p.name}`,
        owner: su?.name || 'À assigner',
        due: 'Sous 15 j.'
      };
      AUDIT_TREATMENT_ROWS.push(row);
      appendTreatmentRowWithRisk(treatmentTable, row, su);
      added += 1;
    });
    if (!added) {
      showToast('Actions déjà générées pour ces preuves — consulter le tableau NC / actions.', 'info');
      return;
    }
    bumpScore(0.6);
    showToast(`${added} action(s) ajoutée(s) au plan (depuis preuves manquantes).`, 'info');
    document.getElementById('audit-iso-tier-treatment')?.scrollIntoView({
      behavior: 'smooth',
      block: 'nearest'
    });
    activityLogStore.add({
      module: 'audits',
      action: 'Générer actions depuis preuves manquantes',
      detail: `${added} ligne(s) — ${LAST_AUDIT.ref}`,
      user: su?.name || 'Utilisateur'
    });
  });
  proofMissingActions.append(proofGenHint, genFromProofsBtn);
  proofsCard.append(proofMissingActions);

  const mainActions = document.createElement('div');
  mainActions.className =
    'audit-main-actions audit-cockpit-footer-actions audit-premium-footer-actions audit-expert-hide-direction';

  const sendReportRow = document.createElement('div');
  sendReportRow.className = 'audit-send-report-row';
  sendReportRow.style.cssText =
    'display:flex;flex-wrap:wrap;gap:10px;align-items:center;margin-top:0;width:100%';

  const emailInput = document.createElement('input');
  emailInput.type = 'text';
  emailInput.className = 'control-input audit-send-report-email';
  emailInput.setAttribute('aria-label', 'Destinataires du rapport PDF par e-mail');
  emailInput.placeholder = 'E-mail(s), séparés par une virgule';
  emailInput.autocomplete = 'off';
  emailInput.style.cssText = 'flex:1;min-width:min(100%,260px);min-height:44px';

  const sendPdfEmailBtn = document.createElement('button');
  sendPdfEmailBtn.type = 'button';
  sendPdfEmailBtn.className = 'text-button';
  sendPdfEmailBtn.textContent = 'Envoyer le PDF par e-mail';
  sendPdfEmailBtn.style.fontWeight = '800';

  sendReportRow.append(emailInput, sendPdfEmailBtn);

  fetchUsers()
    .then((users) => {
      if (!Array.isArray(users) || !users.length) return;
      const dl = document.createElement('datalist');
      dl.id = `qhse-audit-report-emails-${Math.random().toString(36).slice(2, 9)}`;
      users.forEach((u) => {
        if (!u?.email) return;
        const o = document.createElement('option');
        o.value = u.email;
        if (u.name) o.label = u.name;
        dl.append(o);
      });
      emailInput.setAttribute('list', dl.id);
      sendReportRow.append(dl);
    })
    .catch(() => {});

  sendPdfEmailBtn.addEventListener('click', async () => {
    const toRaw = (emailInput.value || '').trim();
    if (!toRaw) {
      showToast('Indiquez au moins une adresse e-mail.', 'error');
      return;
    }
    sendPdfEmailBtn.disabled = true;
    try {
      const { ok, ref: latestRef, status } = await loadLatestAuditRef();
      if (!ok) throw new Error(`Audits ${status}`);
      if (!latestRef) {
        showToast('Aucun audit en base : impossible d’envoyer le rapport.', 'error');
        return;
      }
      const res = await qhseFetch(
        `/api/audits/${encodeURIComponent(latestRef)}/send-report`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ to: toRaw })
        }
      );
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          typeof body.error === 'string'
            ? body.error
            : `Envoi impossible (erreur ${res.status})`;
        showToast(msg, 'error');
        return;
      }
      if (body.ok !== true) {
        showToast(
          typeof body.error === 'string'
            ? body.error
            : 'Réponse serveur inattendue.',
          'error'
        );
        return;
      }
      showToast(body.message || 'Rapport PDF envoyé par e-mail.', 'info');
      activityLogStore.add({
        module: 'audits',
        action: 'Envoi rapport PDF par e-mail',
        detail: `${latestRef} → ${Array.isArray(body.sentTo) ? body.sentTo.join(', ') : toRaw}`,
        user: 'Responsable QHSE'
      });
    } catch (e) {
      console.error(e);
      showToast('Erreur serveur', 'error');
    } finally {
      sendPdfEmailBtn.disabled = false;
    }
  });

  if (!canReportWrite && su) {
    sendReportRow.style.display = 'none';
  }

  const autoReportNote = document.createElement('p');
  autoReportNote.className = 'content-card-lead audit-auto-report-note';
  autoReportNote.style.cssText =
    'margin:8px 0 0;font-size:12px;color:var(--text3);max-width:60ch;line-height:1.45';
  autoReportNote.hidden = true;

  mainActions.append(sendReportRow, autoReportNote);

  loadLatestAuditRow().then(({ ok, row }) => {
    if (!ok || !row?.autoReportSentAt) return;
    const d = new Date(row.autoReportSentAt);
    if (Number.isNaN(d.getTime())) return;
    autoReportNote.textContent = `Audit ${row.ref} : rapport PDF envoyé automatiquement le ${d.toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })} (clôture).`;
    autoReportNote.hidden = false;
  });

  const docComplianceStrip = createAuditDocumentComplianceStrip();

  const tierScore = document.createElement('section');
  tierScore.className = 'audit-cockpit-tier audit-cockpit-tier--score audit-premium-tier';
  tierScore.id = 'audit-cockpit-tier-score';
  tierScore.append(
    createAuditTerrainWorkflowStrip(page),
    heroCard,
    auditExpertCockpitBlock,
    strategicKpis,
    docComplianceStrip,
    auditChartsRow
  );

  const tierCritical = document.createElement('section');
  tierCritical.className = 'audit-cockpit-tier audit-cockpit-tier--critical';
  tierCritical.id = 'audit-cockpit-tier-critical';
  tierCritical.append(prioCard);

  const tierProgress = document.createElement('section');
  tierProgress.className = 'audit-cockpit-tier audit-cockpit-tier--progress';
  tierProgress.id = 'audit-cockpit-tier-progress';
  tierProgress.append(cockpitCard, planCard, treatmentCard, layout, traceCard);

  const tierActions = document.createElement('section');
  tierActions.className = 'audit-cockpit-tier audit-cockpit-tier--actions';
  tierActions.id = 'audit-cockpit-tier-actions';
  fieldMode.element.classList.add('audit-expert-hide-direction');
  tierActions.append(notifCard, iaCard, proofsCard, fieldMode.element, mainActions);

  const auditsAdvancedStack = document.createElement('div');
  auditsAdvancedStack.className = 'qhse-page-advanced-only';
  auditsAdvancedStack.append(tierProgress, tierActions);

  const tierNavHost = heroCard.querySelector('[data-audit-tier-nav]');
  if (tierNavHost) {
    [
      ['Vue ISO', tierScore],
      ['Critiques', tierCritical],
      ['Avancement', tierProgress],
      ['Actions', tierActions]
    ].forEach(([label, el]) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'audit-cockpit-hero__nav-btn';
      b.textContent = label;
      b.addEventListener('click', () => {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
      tierNavHost.append(b);
    });
  }

  if (importDraftEl) importDraftEl.classList.add('audit-expert-hide-direction');

  const auditGuideEl = createSimpleModeGuide({
    title: 'Audit — ce qui compte tout de suite',
    hint: 'Le bandeau du haut résume le dernier audit ; la zone « Critiques » liste ce qui bloque la conformité.',
    nextStep: 'Ensuite : traiter les constats ouverts, puis le suivi d’avancement — le détail technique reste en mode Expert.'
  });
  auditGuideEl.classList.add('audit-expert-hide-direction', 'qhse-page-advanced-only');

  page.append(
    auditsPageViewBar,
    auditGuideEl,
    ...(importDraftEl ? [importDraftEl] : []),
    tierScore,
    tierCritical,
    auditsAdvancedStack
  );

  queueMicrotask(() => {
    runAuditExpertAlerts({
      page,
      score: LAST_AUDIT.score,
      hasCriticalNc: AUDIT_NC_MAJEURES > 0,
      auditsEnRetard: AUDITS_RETARD_COUNT
    });
    if (dashboardIntent?.source === 'dashboard' && dashboardIntent?.chart === 'qhse_score') {
      heroCard.querySelector('.audit-premium-header__score')?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      showToast(
        dashboardIntent?.period
          ? `Contexte Dashboard appliqué : score QHSE (${dashboardIntent.period}).`
          : 'Contexte Dashboard appliqué : score QHSE.',
        'info'
      );
    }
    if (
      dashboardIntent?.scrollToId &&
      !(dashboardIntent.source === 'dashboard' && dashboardIntent.chart === 'qhse_score')
    ) {
      scheduleScrollIntoView(String(dashboardIntent.scrollToId));
    }
    tryFocusAuditFromIntent();
  });

  return page;
}
