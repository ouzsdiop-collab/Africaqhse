import { showToast } from '../components/toast.js';
import { ensureSensitiveAccess } from '../components/sensitiveAccessGate.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { createAuditIsoNormBarsChart } from '../components/dashboardCharts.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { appState } from '../utils/state.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { activityLogStore } from '../data/activityLog.js';
import { ensureAuditProductsStyles } from '../components/auditProductsStyles.js';
import { ensureAuditPlusStyles } from '../components/auditPlusStyles.js';
import { ensureQhsePilotageStyles } from '../components/qhsePilotageStyles.js';
import { createAuditFieldMode } from '../components/auditFieldMode.js';
import { fetchUsers } from '../services/users.service.js';
import { readImportDraft, clearImportDraft } from '../utils/importDraft.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';

/** Données mock — module Audits (cockpit) */
const AUDITS_RETARD_COUNT = 2;
const NC_OUVERTES_COUNT = 8;
const ACTIONS_RETARD_COUNT = 5;

const AUDIT_PROOFS = [
  { name: 'PV d’audit signé', status: 'present' },
  { name: 'Photos zones de stockage', status: 'missing' },
  { name: 'Registre déchets (extrait)', status: 'verify' }
];

const AUDIT_PRIORITY_LINES = [
  { label: 'NC critiques', detail: '2 écarts majeurs liés au dernier audit — pilotage plan d’actions' },
  { label: 'Audits à préparer', detail: 'AUD-P-021 (08/04) — dossier preuves incomplet' },
  { label: 'Preuves manquantes', detail: '3 pièces signalées sur le périmètre stockage' },
  { label: 'Actions urgentes', detail: `${ACTIONS_RETARD_COUNT} actions en retard < 15 j (lien module Actions)` }
];

const COCKPIT_CYCLE_LABELS = [
  'Détection',
  'Contrôle humain',
  'Correction',
  'Vérification',
  'Clôture'
];
/** Index phase mise en avant (0-based) — maquette */
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
 * Notifications cockpit — dérivées du mock + constantes existantes (aucun appel API).
 * @returns {{ items: { key: string; title: string; detail: string; tone: 'blue'|'amber'|'green'|'red' }[]; suggestNotifyHint: string }}
 */
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
 * Carte notifications intelligentes + CTA participants (maquette front, pas d’API).
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
  head.innerHTML = `
    <div>
      <div class="section-kicker">Pilotage</div>
      <h3 id="audit-cockpit-notifs-title">Alertes planning</h3>
      <p class="content-card-lead audit-cockpit-notifs__lead">
        Échéances et relances — <strong>aucun envoi auto</strong> sans clic.
      </p>
    </div>
    <div class="audit-cockpit-notifs__badges" aria-label="Synthèse alertes">
      <span class="badge blue audit-cockpit-notifs__count">${items.length} alerte(s)</span>
      ${
        unreadish
          ? `<span class="badge amber audit-cockpit-notifs__prio">${unreadish} à traiter</span>`
          : `<span class="badge green audit-cockpit-notifs__prio">Situation stable</span>`
      }
    </div>
  `;

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
    empty.textContent = 'Aucune alerte dérivée des données affichées — le registre est à jour (mock).';
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
      'Maquette : notification enregistrée pour diffusion aux participants (e-mail / push à brancher sur votre SI).',
      'info'
    );
    activityLogStore.add({
      module: 'audits',
      action: 'Notification participants (maquette cockpit)',
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

function meanAuditScore() {
  const scores = [...HISTORY.map((h) => h.score), LAST_AUDIT.score];
  const n = scores.length;
  if (!n) return LAST_AUDIT.score;
  return Math.round(scores.reduce((a, b) => a + b, 0) / n);
}

function buildAuditKpiStripItems() {
  const planifies = PLANNED_AUDITS.length;
  const enCours = countPlannedByStatut('en cours');
  const retard = AUDITS_RETARD_COUNT;
  return [
    { label: 'Audits planifiés', value: String(planifies), tone: 'blue', hint: 'Vue planification active' },
    { label: 'Audits en cours', value: String(enCours), tone: 'amber', hint: 'Exécution terrain' },
    { label: 'Audits en retard', value: String(retard), tone: 'red', hint: 'À reprogrammer ou escalader' },
    {
      label: 'Score moyen',
      value: `${meanAuditScore()}%`,
      tone: 'green',
      hint: 'Historique + dernier audit (mock)'
    }
  ];
}

const PLANNED_AUDITS = [
  {
    ref: 'AUD-P-021',
    site: 'Site principal',
    auditeur: 'M. Diallo',
    date: '08/04/2026',
    statut: 'à venir'
  },
  {
    ref: 'AUD-P-022',
    site: 'Site sud',
    auditeur: 'Équipe qualité',
    date: '02/04/2026',
    statut: 'en cours'
  },
  {
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

/** Lignes maquette — traitement NC / actions (affichage certification). */
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

/** Piste d’audit locale (maquette — même esprit que journal). */
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

/** Points pour le mode terrain (même thématique que la checklist synthèse) */
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

/**
 * Brouillon issu de l’import (phase 3) — création API uniquement après validation utilisateur.
 * @param {Record<string, unknown>} prefill
 */
function createAuditImportDraftSection(prefill, canAuditWrite, su) {
  const card = document.createElement('article');
  card.className = 'content-card card-soft';
  card.style.marginBottom = '14px';
  card.innerHTML = `
    <div class="content-card-head">
      <div>
        <div class="section-kicker">Import documentaire</div>
        <h3>Brouillon audit — à valider</h3>
        <p class="content-card-lead" style="margin:0;max-width:56ch;font-size:13px">Données proposées depuis l’import ; rien n’est créé tant vous n’enregistrez pas.</p>
      </div>
    </div>
    <div class="form-grid" style="gap:12px">
      <label class="field"><span>Référence</span><input type="text" class="control-input audit-draft-ref" autocomplete="off" /></label>
      <label class="field"><span>Site</span><input type="text" class="control-input audit-draft-site" autocomplete="off" /></label>
      <label class="field"><span>Score (0–100)</span><input type="number" min="0" max="100" class="control-input audit-draft-score" /></label>
      <label class="field field-full"><span>Statut</span><input type="text" class="control-input audit-draft-status" placeholder="ex. terminé, en cours" autocomplete="off" /></label>
    </div>
    <div style="display:flex;flex-wrap:wrap;gap:10px;margin-top:12px;align-items:center">
      <button type="button" class="btn btn-primary audit-draft-save">Créer l’audit</button>
      <button type="button" class="text-button audit-draft-dismiss" style="font-weight:700">Ignorer le brouillon</button>
    </div>
  `;
  const refIn = card.querySelector('.audit-draft-ref');
  const siteIn = card.querySelector('.audit-draft-site');
  const scoreIn = card.querySelector('.audit-draft-score');
  const statusIn = card.querySelector('.audit-draft-status');
  refIn.value = prefill.ref != null ? String(prefill.ref) : '';
  siteIn.value = prefill.site != null ? String(prefill.site) : '';
  scoreIn.value =
    prefill.score != null && prefill.score !== ''
      ? String(prefill.score)
      : '';
  statusIn.value = prefill.status != null ? String(prefill.status) : 'en cours';

  const saveBtn = card.querySelector('.audit-draft-save');
  const dismissBtn = card.querySelector('.audit-draft-dismiss');
  if (!canAuditWrite && su) {
    saveBtn.disabled = true;
    saveBtn.title = 'Création réservée';
  }
  saveBtn.addEventListener('click', async () => {
    const ref = refIn.value.trim();
    const site = siteIn.value.trim();
    const status = statusIn.value.trim() || 'en cours';
    const score = parseInt(scoreIn.value, 10);
    if (!ref || !site || Number.isNaN(score)) {
      showToast('Référence, site et score valides requis', 'error');
      return;
    }
    saveBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/audits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref,
          site,
          score,
          status,
          checklist: Array.isArray(prefill.checklist) ? prefill.checklist : undefined,
          ...(appState.activeSiteId ? { siteId: appState.activeSiteId } : {})
        })
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast(
          typeof body.error === 'string' ? body.error : 'Erreur création',
          'error'
        );
        return;
      }
      showToast(`Audit ${ref} enregistré.`, 'info');
      clearImportDraft();
      card.remove();
      activityLogStore.add({
        module: 'audits',
        action: 'Audit créé depuis import documentaire',
        detail: ref,
        user: 'Utilisateur'
      });
    } catch (e) {
      console.error(e);
      showToast('Erreur serveur', 'error');
    } finally {
      saveBtn.disabled = !canAuditWrite && !!su;
    }
  });
  dismissBtn.addEventListener('click', () => {
    clearImportDraft();
    card.remove();
  });
  return card;
}

function statutBadgeClass(statut) {
  if (statut === 'terminé') return 'green';
  if (statut === 'en cours') return 'amber';
  return 'blue';
}

function createChecklistRow(item) {
  const row = document.createElement('article');
  row.className = 'list-row audit-checklist-row';
  const ok = Boolean(item?.conforme);
  if (!ok) {
    row.style.borderLeft = '4px solid rgba(239, 91, 107, 0.6)';
    row.style.paddingLeft = '12px';
  }
  const left = document.createElement('div');
  const strong = document.createElement('strong');
  strong.textContent = item?.point != null ? String(item.point) : '—';
  left.append(strong);
  const badge = document.createElement('span');
  badge.className = `badge ${ok ? 'green' : 'red'}`;
  badge.textContent = ok ? 'Conforme' : 'Non conforme';
  row.append(left, badge);
  return row;
}

/**
 * Constat + bandeau validation humaine (maquette locale — pas d’API).
 * @param {{ point: string; conforme: boolean; proofRef?: string }} item
 */
function createConstatHumanRow(item) {
  const wrap = document.createElement('div');
  wrap.className = 'audit-constat-human audit-constat-human--compact';
  const ok = Boolean(item?.conforme);

  const top = document.createElement('div');
  top.className = 'audit-checklist-compact-top';
  if (!ok) top.classList.add('audit-checklist-compact-top--nc');
  const pointEl = document.createElement('span');
  pointEl.className = 'audit-checklist-compact-point';
  pointEl.textContent = item?.point != null ? String(item.point) : '—';
  const badge = document.createElement('span');
  badge.className = `badge ${ok ? 'green' : 'red'} audit-checklist-compact-badge`;
  badge.textContent = ok ? 'Conforme' : 'NC';
  const proofEl = document.createElement('span');
  proofEl.className = 'audit-checklist-compact-proof';
  proofEl.setAttribute('title', 'Preuve documentaire ciblée (lien indicatif — maquette)');
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
      showToast(`Suggestion / constat — ${labels[next]} (maquette, validation humaine).`, 'info');
      activityLogStore.add({
        module: 'audits',
        action: `Validation constat : ${labels[next]}`,
        detail: String(item.point || '').slice(0, 80),
        user: 'Auditeur'
      });
    });
    return b;
  }

  actions.append(
    wireBtn('Valider', 'validated'),
    wireBtn('Ajuster', 'adjusted'),
    wireBtn('Rejeter', 'rejected')
  );
  strip.append(legend, statusEl, actions);

  treatBtn.addEventListener('click', () => {
    strip.hidden = !strip.hidden;
    treatBtn.setAttribute('aria-expanded', strip.hidden ? 'false' : 'true');
  });

  wrap.append(top, strip);
  return wrap;
}

function proofBadgeClass(st) {
  if (st === 'present') return 'audit-proof-badge--present';
  if (st === 'missing') return 'audit-proof-badge--missing';
  return 'audit-proof-badge--verify';
}

function proofBadgeLabel(st) {
  if (st === 'present') return 'Présent';
  if (st === 'missing') return 'Manquant';
  return 'À vérifier';
}

function createPlanningTable() {
  const wrap = document.createElement('div');
  wrap.className = 'audit-plan-table-wrap';
  const table = document.createElement('div');
  table.className = 'audit-plan-table';

  const head = document.createElement('div');
  head.className = 'audit-plan-head';
  head.innerHTML = `
    <span>Réf.</span>
    <span>Site</span>
    <span>Auditeur</span>
    <span>Date</span>
    <span>Statut</span>
  `;
  table.append(head);

  PLANNED_AUDITS.forEach((row) => {
    const line = document.createElement('div');
    line.className = 'audit-plan-row';
    const stClass = statutBadgeClass(row.statut);
    line.innerHTML = `
      <span class="audit-plan-ref" data-label="Réf.">${row.ref}</span>
      <span data-label="Site">${row.site}</span>
      <span data-label="Auditeur">${row.auditeur}</span>
      <span data-label="Date">${row.date}</span>
      <span data-label="Statut"><span class="badge ${stClass}">${row.statut}</span></span>
    `;
    table.append(line);
  });

  wrap.append(table);
  return wrap;
}

export function renderAudits() {
  ensureAuditProductsStyles();
  ensureAuditPlusStyles();
  ensureQhsePilotageStyles();
  ensureDashboardStyles();

  const su = getSessionUser();
  const canAuditWrite = canResource(su?.role, 'audits', 'write');
  const canReportRead = canResource(su?.role, 'reports', 'read');
  const canReportWrite = canResource(su?.role, 'reports', 'write');
  const auditNotifModel = buildAuditSmartNotifications();
  const statusTone = LAST_AUDIT.conforme ? 'green' : 'red';
  const cockpitPrevScore = getCockpitPreviousAuditScore();

  const page = document.createElement('section');
  page.className =
    'page-stack audit-products-page audit-plus-page audit-cockpit-page audit-premium-page';

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
    showToast('Mode terrain activé — renseignez la checklist ci-dessous.', 'info');
    activityLogStore.add({
      module: 'audits',
      action: 'Ouverture mode audit terrain',
      detail: 'Checklist interactive — maquette',
      user: 'Auditeur terrain'
    });
  }

  async function generateAuditPdfReport() {
    try {
      const { ok, ref: latestRef, status } = await loadLatestAuditRef();
      if (!ok) throw new Error(`Audits ${status}`);
      if (!latestRef) {
        showToast('Aucun audit en base : impossible de générer le rapport PDF.', 'error');
        return;
      }
      const rpt = await qhseFetch(
        `/api/audits/${encodeURIComponent(latestRef)}/report`
      );
      if (!rpt.ok) {
        showToast('Export PDF indisponible', 'error');
        return;
      }
      const blob = await rpt.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
      setTimeout(() => URL.revokeObjectURL(blobUrl), 120_000);
      activityLogStore.add({
        module: 'audits',
        action: 'Demande de rapport audit',
        detail: `Synthèse ${latestRef} — export PDF`,
        user: 'Responsable QHSE'
      });
    } catch (e) {
      console.error(e);
      showToast('Erreur serveur', 'error');
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
    showToast('Export constats téléchargé (CSV, maquette locale).', 'info');
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
    showToast('Export plan d’actions téléchargé (CSV, maquette locale).', 'info');
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
  const auditActionsGeneratedCount = LAST_AUDIT.ncCount + AUDIT_TREATMENT_ROWS.length + 2;

  const heroCard = document.createElement('article');
  heroCard.className = 'content-card card-soft audit-premium-header';
  heroCard.innerHTML = `
    <div class="audit-iso-pilot-wrap">
      <div class="audit-iso-pilot-bar">
        <div class="audit-iso-pilot-bar__main">
          <div class="audit-iso-pilot-bar__title-block">
            <div class="section-kicker audit-premium-header__kicker">Audit documenté</div>
            <h3 class="audit-premium-header__title">${LAST_AUDIT.ref}</h3>
          </div>
          <dl class="audit-iso-pilot-bar__meta" aria-label="Fiche d’identification audit">
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Référentiel</dt>
              <dd>${AUDIT_REFERENTIEL_LABEL}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Site</dt>
              <dd>${LAST_AUDIT.site}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Auditeur</dt>
              <dd>${LAST_AUDIT.auditeur}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Date</dt>
              <dd>${LAST_AUDIT.date}</dd>
            </div>
            <div class="audit-iso-pilot-bar__meta-item">
              <dt>Statut</dt>
              <dd><span class="badge ${statusTone} audit-premium-header__status">${LAST_AUDIT.conforme ? 'Conforme' : 'Non conforme'}</span></dd>
            </div>
          </dl>
          <div class="audit-premium-header__score" aria-label="Score global">
            <span class="audit-premium-header__score-val">${LAST_AUDIT.score}%</span>
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
          <span>${LAST_AUDIT.progress}%</span>
        </div>
        <div class="audit-progress-bar audit-premium-header__progress-bar"><span style="width:${LAST_AUDIT.progress}%"></span></div>
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
  const heroPdf = document.createElement('button');
  heroPdf.type = 'button';
  heroPdf.className = 'btn btn-secondary';
  heroPdf.textContent = 'Rapport PDF';
  heroPdf.addEventListener('click', () => {
    void generateAuditPdfReport();
  });
  if (!canReportRead && su) heroPdf.style.display = 'none';
  heroCtasHost?.append(heroLaunch, heroPdf);

  const notifCard = createAuditIntelligentNotificationsCard({
    canAuditWrite,
    su,
    model: auditNotifModel
  });

  const conformitySummary = document.createElement('div');
  conformitySummary.className = 'audit-iso-conformity-row';
  conformitySummary.setAttribute('aria-label', 'Résumé de conformité — constats checklist');
  conformitySummary.innerHTML = `
    <div class="audit-iso-conformity-card audit-iso-conformity-card--ok">
      <span class="audit-iso-conformity-card__lbl">Conformes</span>
      <span class="audit-iso-conformity-card__val">${checklistConformeCount}</span>
      <span class="audit-iso-conformity-card__hint">Points checklist</span>
    </div>
    <div class="audit-iso-conformity-card audit-iso-conformity-card--partial">
      <span class="audit-iso-conformity-card__lbl">Partiels</span>
      <span class="audit-iso-conformity-card__val">${checklistPartialCount}</span>
      <span class="audit-iso-conformity-card__hint">Déclarés sur l’extrait</span>
    </div>
    <div class="audit-iso-conformity-card audit-iso-conformity-card--nc">
      <span class="audit-iso-conformity-card__lbl">Non-conformités</span>
      <span class="audit-iso-conformity-card__val">${checklistNcPoints}</span>
      <span class="audit-iso-conformity-card__hint">Constats checklist</span>
    </div>
    <div class="audit-iso-conformity-card audit-iso-conformity-card--act">
      <span class="audit-iso-conformity-card__lbl">Actions générées</span>
      <span class="audit-iso-conformity-card__val">${auditActionsGeneratedCount}</span>
      <span class="audit-iso-conformity-card__hint">Maquette pilotage</span>
    </div>
  `;

  const strategicKpis = document.createElement('div');
  strategicKpis.className = 'audit-strategic-kpis';
  strategicKpis.setAttribute('aria-label', 'Indicateurs stratégiques');
  strategicKpis.innerHTML = `
    <div class="audit-strategic-kpi">
      <span class="audit-strategic-kpi__lbl">Audits en cours</span>
      <span class="audit-strategic-kpi__val">${countPlannedByStatut('en cours')}</span>
    </div>
    <div class="audit-strategic-kpi">
      <span class="audit-strategic-kpi__lbl">Planifiés</span>
      <span class="audit-strategic-kpi__val">${PLANNED_AUDITS.length}</span>
      <span class="audit-strategic-kpi__hint">Registre planification</span>
    </div>
    <div class="audit-strategic-kpi">
      <span class="audit-strategic-kpi__lbl">NC ouvertes</span>
      <span class="audit-strategic-kpi__val">${NC_OUVERTES_COUNT}</span>
    </div>
    <div class="audit-strategic-kpi">
      <span class="audit-strategic-kpi__lbl">Actions en retard</span>
      <span class="audit-strategic-kpi__val">${ACTIONS_RETARD_COUNT}</span>
    </div>
  `;

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
  exportActionsHost?.append(exportConstatsBtn, exportPlanBtn);

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
  auditTrendBody.append(createAuditIsoNormBarsChart(AUDIT_ISO_NORM_SCORES));
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
    deltaStrip.innerHTML = `<strong>${sign}${d} pts</strong> vs audit précédent (${cockpitPrevScore}% → ${cur}%).`;
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
    return `<div class="${cls}" role="listitem">${lab}</div>`;
  }).join('');

  cockpitCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Pilotage</div>
        <h3>Synthèse opérationnelle</h3>
        <p class="content-card-lead audit-last-lead">${LAST_AUDIT.ref} · cycle de correction</p>
      </div>
    </div>
    <div class="audit-premium-cockpit__body">
      <div class="audit-cockpit-metrics audit-premium-cockpit__metrics">
        <div class="audit-cockpit-metric"><span>NC (audit)</span><span>${LAST_AUDIT.ncCount}</span></div>
        <div class="audit-cockpit-metric"><span>Référentiels</span><span class="audit-premium-cockpit__iso">9001 · 14001 · 45001</span></div>
      </div>
      <div class="audit-cockpit-cycle">
        <p class="audit-cockpit-cycle__label">Cycle contrôle &amp; correction</p>
        <div class="audit-cockpit-stepper" role="list">${stepperHtml}</div>
        <p class="audit-cockpit-cycle-progress">Phase active : <strong>${COCKPIT_CYCLE_LABELS[COCKPIT_CYCLE_ACTIVE]}</strong></p>
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
      ? 'Insight : priorité environnement ISO 14001 — écart vs 9001/45001 (cockpit démo).'
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
      <summary>Autres aides (démo)</summary>
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
          detail: 'Quand notifier les participants (maquette)',
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
          detail: 'Scroll zone preuves (maquette)',
          user: 'Utilisateur'
        });
        return;
      }
      showToast(`Suggestion IA « ${label} » — maquette front, branchez votre moteur ou API.`, 'info');
      activityLogStore.add({
        module: 'audits',
        action: 'Action IA audit (maquette)',
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

  const prioCard = document.createElement('article');
  prioCard.className = 'content-card card-soft audit-cockpit-prio audit-premium-nc';
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
        <div class="section-kicker">Non-conformités</div>
        <h3>Points critiques &amp; priorités</h3>
        <p class="audit-cockpit-prio__lead">Vue priorisée — plan d’actions module Actions.</p>
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
    window.location.hash = 'actions';
  });
  prioFoot.append(prioToActions);
  prioCard.append(prioFoot);

  const planCard = document.createElement('article');
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
    showToast('Planification : ouvrir le module calendrier / workflow (démo).', 'info');
    activityLogStore.add({
      module: 'audits',
      action: 'Demande de planification audit',
      detail: 'Depuis Audit+ — maquette front',
      user: 'Coordinateur QHSE'
    });
  });
  if (!canAuditWrite && su) planBtn.style.display = 'none';
  planActions.append(planBtn);
  planCard.append(planActions);

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
    const line = document.createElement('div');
    line.className = 'audit-iso-treatment-row';
    line.setAttribute('role', 'row');
    line.innerHTML = `
      <span role="cell" data-label="NC">${r.nc}</span>
      <span role="cell" data-label="Action">${r.action}</span>
      <span role="cell" data-label="Responsable">${r.owner}</span>
      <span role="cell" data-label="Échéance">${r.due}</span>
    `;
    treatmentTable.append(line);
  });
  treatmentCard.append(treatmentTable);

  const layout = document.createElement('section');

  const checklistCard = document.createElement('article');
  checklistCard.className = 'content-card card-soft audit-cockpit-checklist audit-premium-checklist';
  checklistCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Constats / checklist</div>
        <h3>Exigences — ${LAST_AUDIT.ref}</h3>
        <p class="content-card-lead audit-premium-checklist__legend">Point, statut, preuve, validation.</p>
      </div>
    </div>
  `;
  const checklistStack = document.createElement('div');
  checklistStack.className = 'stack audit-premium-checklist-stack';
  CHECKLIST.forEach((item) => checklistStack.append(createConstatHumanRow(item)));
  checklistCard.append(checklistStack);

  const rightStack = document.createElement('div');
  rightStack.className = 'audit-right-stack';

  const historyCard = document.createElement('article');
  historyCard.className = 'content-card card-soft audit-cockpit-history audit-premium-history';
  historyCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Historique</div>
        <h3>Scores précédents</h3>
      </div>
    </div>
  `;
  const histStack = document.createElement('div');
  histStack.className = 'audit-history-stack';
  HISTORY.forEach((h) => {
    const row = document.createElement('article');
    row.className = 'list-row audit-history-row';
    row.innerHTML = `
      <div>
        <strong>${h.date}</strong>
        <p style="margin:4px 0 0;font-size:13px;color:var(--text2)">Score ${h.score}%</p>
      </div>
      <span class="badge blue">Interne</span>
    `;
    histStack.append(row);
  });
  historyCard.append(histStack);
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
      ? `Écart de scores sur l’extrait (mock) : ${histSpan} pts (min ${histMin}% · max ${histMax}%) — indépendant de l’ordre d’affichage.`
      : 'Tendance : au moins deux scores valides requis sur cet extrait.';
  historyCard.append(histTrend);

  rightStack.append(historyCard);
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
    li.innerHTML = `
      <div class="audit-iso-trace-item__who">${tr.who}</div>
      <div class="audit-iso-trace-item__when">${tr.when}</div>
      <div class="audit-iso-trace-item__action">${tr.action}</div>
      <div class="audit-iso-trace-item__comment">${tr.comment}</div>
    `;
    traceList.append(li);
  });
  traceCard.append(traceList);

  const proofsCard = document.createElement('article');
  proofsCard.className = 'content-card card-soft audit-cockpit-proofs audit-premium-proofs';
  proofsCard.innerHTML = `
    <div class="content-card-head content-card-head--tight">
      <div>
        <div class="section-kicker">Documents &amp; preuves</div>
        <h3>Dossier probatoire — ${LAST_AUDIT.ref}</h3>
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

  const mainActions = document.createElement('div');
  mainActions.className =
    'audit-main-actions audit-cockpit-footer-actions audit-premium-footer-actions';

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

  const tierScore = document.createElement('section');
  tierScore.className = 'audit-cockpit-tier audit-cockpit-tier--score audit-premium-tier';
  tierScore.id = 'audit-cockpit-tier-score';
  tierScore.append(heroCard, strategicKpis, auditChartsRow);

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
  tierActions.append(notifCard, iaCard, proofsCard, fieldMode.element, mainActions);

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

  page.append(
    createSimpleModeGuide({
      title: 'Audit — ce qui compte tout de suite',
      hint: 'Le bandeau du haut résume le dernier audit ; la zone « Critiques » liste ce qui bloque la conformité.',
      nextStep: 'Ensuite : traiter les constats ouverts, puis le suivi d’avancement — le détail technique reste en mode Expert.'
    }),
    ...(importDraftEl ? [importDraftEl] : []),
    tierScore,
    tierCritical,
    tierProgress,
    tierActions
  );
  return page;
}
