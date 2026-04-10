import fs from 'node:fs';

const p = 'src/pages/incidents.js';
let s = fs.readFileSync(p, 'utf8');

/* --- Imports & top cleanup --- */
s = s.replace(
  `import { siteOptions, pageTopbarById } from '../data/navigation.js';
import { appState } from '../utils/state.js';
import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { linkModules } from '../services/moduleLinks.service.js';
import { createSeveritySegment } from '../components/severitySegment.js';
import { getApiBase } from '../config.js';

function sanitizeClassToken(value, fallback = 'neutral') {
  const token = String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '');
  return token || fallback;
}
import { qhseFetch } from '../utils/qhseFetch.js';`,
  `import { siteOptions, pageTopbarById } from '../data/navigation.js';
import { appState } from '../utils/state.js';
import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { createSeveritySegment } from '../components/severitySegment.js';
import { qhseFetch } from '../utils/qhseFetch.js';`
);

s = s.replace(
  `import { readImportDraft, clearImportDraft } from '../utils/importDraft.js';
import { getRiskTitlesForSelect, formatRiskLinkTag } from '../utils/riskIncidentLinks.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';
import { mergeActionOverlay, appendActionHistory } from '../utils/actionPilotageMock.js';
import { openRiskCreateDialog } from './risks.js';
import { openActionCreateDialog } from '../components/actionCreateDialog.js';
import { buildActionDefaultsFromIncident } from '../utils/qhseAssistantFormSuggestions.js';
import { escapeHtml } from '../utils/escapeHtml.js';`,
  `import { readImportDraft, clearImportDraft } from '../utils/importDraft.js';
import { getRiskTitlesForSelect, formatRiskLinkTag } from '../utils/riskIncidentLinks.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import {
  mapApiIncident,
  mapRowToDisplay,
  formatIsoDateToFr,
  normalizeSeverity
} from '../utils/incidentsMappers.js';
import { ensureUsersCached, createLinkedAction } from '../utils/incidentsActions.js';
import {
  mountIncidentDetailEmpty,
  mountIncidentDetailPanel
} from '../components/incidentDetailPanel.js';
import { setupIncidentDeclareFlow } from '../components/incidentFormDialog.js';`
);

s = s.replace(
  `import { fetchUsers } from '../services/users.service.js';
import { getSessionUser } from '../data/sessionUser.js';`,
  `import { getSessionUser } from '../data/sessionUser.js';`
);

s = s.replace(
  `function parsePhotosFromApiRow(row) {
  const raw = row?.photosJson;
  if (!raw || typeof raw !== 'string') return [];
  try {
    const j = JSON.parse(raw);
    if (!Array.isArray(j)) return [];
    return j.filter((x) => typeof x === 'string' && x.startsWith('data:image'));
  } catch {
    return [];
  }
}

function incidentOperationalPhase(status) {
  const s = String(status || '').toLowerCase();
  if (/clos|ferm|termin|clôtur|clotur|résolu|resolu|done|complete|trait/.test(s)) {
    return 'traite';
  }
  if (/invest|analys/.test(s) || /\\bcours\\b/.test(s)) {
    return 'analyse';
  }
  return 'ouvert';
}

function incidentPhaseLabel(status) {
  const p = incidentOperationalPhase(status);
  if (p === 'traite') return 'Traité';
  if (p === 'analyse') return 'En analyse';
  return 'Ouvert';
}

const LIST_SUB_DEFAULT =
  'Tri : gravité critique en tête, puis plus récents. Carte = titre, type, gravité, date, statut.';

/** Statuts proposés pour le select rapide (libre côté API si autre valeur en base). */
const STATUS_PRESETS = ['Nouveau', 'En cours', 'Investigation', 'Clôturé'];

const INCIDENTS_STATES_STYLE_ID`,
  `const INCIDENTS_STATES_STYLE_ID`
);

s = s.replace(
  `let incidentRecords = [];

function normalizedUserRole(role) {
  return String(role ?? '').trim().toUpperCase();
}

function normalizeSeverity(label) {
  const t = String(label).toLowerCase();
  if (t.includes('critique')) return 'critique';
  if (t.includes('faible')) return 'faible';
  return 'moyen';
}

function formatDateFromIso(iso) {
  if (!iso) return formatToday();
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return formatToday();
  }
}

function formatIsoDateToFr(isoDate) {
  if (!isoDate || typeof isoDate !== 'string') return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return \`\${d}/\${m}/\${y}\`;
}

function incidentTitleFromRow(row) {
  const raw = (row.description || '').trim();
  if (raw) {
    const line = raw.split(/\\r?\\n/)[0].trim();
    return line.length > 76 ? \`\${line.slice(0, 73)}…\` : line;
  }
  return \`\${row.type} · \${row.site}\`;
}

/**
 * @param {Record<string, unknown>} row
 */
function mapApiIncident(row) {
  if (!row || typeof row !== 'object' || !row.ref) return null;
  const createdAtMs = row.createdAt ? new Date(row.createdAt).getTime() : Date.now();
  const sev = normalizeSeverity(row.severity);
  return {
    ref: row.ref,
    type: row.type,
    site: row.site,
    severity: sev,
    status: row.status ?? 'Nouveau',
    date: formatDateFromIso(row.createdAt),
    createdAt: row.createdAt ?? null,
    createdAtMs,
    description: typeof row.description === 'string' ? row.description : '',
    location: typeof row.location === 'string' ? row.location : '',
    causes: typeof row.causes === 'string' ? row.causes : '',
    causeCategory: typeof row.causeCategory === 'string' ? row.causeCategory : '',
    photos: parsePhotosFromApiRow(row),
    responsible: typeof row.responsible === 'string' ? row.responsible : ''
  };
}

function mapRowToDisplay(inc) {
  return {
    ...inc,
    title: incidentTitleFromRow(inc)
  };
}

function computeNextRef(list) {`,
  `let incidentRecords = [];

function computeNextRef(list) {`
);

s = s.replace(
  `function formatToday() {
  return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function severityDsBadgeClass(sev) {`,
  `function severityDsBadgeClass(sev) {`
);

s = s.replace(
  `function statusOptionsForSelect(current) {
  const cur = String(current || '').trim();
  const set = new Set(STATUS_PRESETS);
  if (cur && !set.has(cur)) {
    return [cur, ...STATUS_PRESETS];
  }
  return [...STATUS_PRESETS];
}

function isStatusClosed(st) {`,
  `function isStatusClosed(st) {`
);

s = s.replace(
  `/**
 * @param {string} ref
 * @returns {Promise<Record<string, unknown>[]>}
 */
async function fetchActionsLinkedToIncident(ref) {
  const needle = String(ref || '').trim().toUpperCase();
  if (!needle) return [];
  try {
    const res = await qhseFetch(withSiteQuery('/api/actions?limit=400'));
    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];
    return data.filter((a) => {
      const t = String(a.title || '').toUpperCase();
      const d = String(a.detail || '').toUpperCase();
      return t.includes(needle) || d.includes(needle);
    });
  } catch {
    return [];
  }
}

/**
 * @param {ReturnType<typeof mapApiIncident>[]} list
 */
function computeIncidentsInsight(list) {`,
  `/**
 * @param {ReturnType<typeof mapApiIncident>[]} list
 */
function computeIncidentsInsight(list) {`
);

s = s.replace(
  `function inferIncidentAiCauseProbable(inc) {
  const t = String(inc.type || '');
  if (/accident/i.test(t) && !/quasi/i.test(t)) {
    return 'Scénario accidentel : vérifier conditions de poste, EPI et consignes appliquées.';
  }
  if (/quasi/i.test(t)) {
    return 'Near-miss : dérive comportementale ou situation non maîtrisée — creuser avant reproduction.';
  }
  if (/environnement/i.test(t)) {
    return 'Facteur environnement / matière : contrôler stockage, déchets, rejets ou conditions météo.';
  }
  if (/engin|circulation/i.test(t)) {
    return 'Cohabitation engins / piétons ou circulation : signalisation, vitesse, zones de croisement.';
  }
  return 'Cause à affiner après retour terrain et recoupement des témoins.';
}

function inferIncidentAiActionRecommandee(inc) {
  if (inc.severity === 'critique') {
    return 'Sécuriser la zone, prévenir la hiérarchie, consigner les faits et lancer une action corrective immédiate.';
  }
  if (inc.severity === 'moyen') {
    return 'Analyse rapide en équipe, contrôle des barrières existantes et plan de suivi sous 48 h.';
  }
  return 'Point sécurité en début de poste et vérification des mesures préventives habituelles.';
}

function buildSeverityBreakdownEntries(list) {`,
  `function buildSeverityBreakdownEntries(list) {`
);

s = s.replace(
  `/** @type {object[] | null} */
let cachedUsersForActions = null;

async function ensureUsersCached() {
  if (cachedUsersForActions) return cachedUsersForActions;
  try {
    cachedUsersForActions = await fetchUsers();
  } catch (e) {
    console.warn('[incidents] fetchUsers', e);
    cachedUsersForActions = [];
  }
  return cachedUsersForActions;
}

/**
 * @param {ReturnType<typeof mapApiIncident> & { title: string }} inc
 */
async function createLinkedAction(inc) {
  await ensureUsersCached();
  const qhse = cachedUsersForActions?.find((u) => normalizedUserRole(u.role) === 'QHSE');
  const detailParts = [
    \`Incident \${inc.ref}\`,
    \`\${inc.type} · \${inc.site}\`,
    inc.severity ? \`Gravité : \${inc.severity}\` : '',
    inc.description ? inc.description.slice(0, 400) : ''
  ].filter(Boolean);
  const body = {
    title: \`Suite incident \${inc.ref}\`,
    detail: detailParts.join(' — '),
    status: 'À lancer',
    owner: 'Responsable QHSE'
  };
  if (qhse) {
    body.assigneeId = qhse.id;
    body.owner = qhse.name;
  }
  if (appState.activeSiteId) {
    body.siteId = appState.activeSiteId;
  }
  const res = await qhseFetch('/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    try {
      const errBody = await res.json();
      console.error('[incidents] POST action liée', res.status, errBody);
    } catch {
      console.error('[incidents] POST action liée', res.status);
    }
    showToast('Impossible de créer l’action', 'error');
    return;
  }
  showToast(\`Action créée — liée à \${inc.ref}\`, 'info');
  linkModules({
    fromModule: 'incidents',
    fromId: inc.ref,
    toModule: 'actions',
    toId: \`action_for_\${inc.ref}\`,
    kind: 'incident_to_action'
  });
  activityLogStore.add({
    module: 'incidents',
    action: 'Création action liée',
    detail: \`Depuis incident \${inc.ref}\`,
    user: getSessionUser()?.name || 'Responsable QHSE'
  });
}

/**
 * @param {ReturnType<typeof mapApiIncident> & { title?: string }} inc
 */
async function proposeCorrectiveActionViaAssistant(inc) {
  await ensureUsersCached();
  openActionCreateDialog({
    users: cachedUsersForActions || [],
    defaults: buildActionDefaultsFromIncident(inc),
    onCreated: () => {
      showToast('Action enregistrée — issue du formulaire assistant.', 'success');
      activityLogStore.add({
        module: 'incidents',
        action: 'Création action (assistant guidé)',
        detail: inc.ref,
        user: getSessionUser()?.name || 'Utilisateur'
      });
    }
  });
}

async function createCorrectiveAction(inc) {
  await ensureUsersCached();
  const qhse = cachedUsersForActions?.find((u) => normalizedUserRole(u.role) === 'QHSE');
  const detailParts = [
    \`Action corrective — incident \${inc.ref}\`,
    \`\${inc.type} · \${inc.site}\`,
    inc.severity ? \`Gravité : \${inc.severity}\` : '',
    inc.description ? inc.description.slice(0, 400) : ''
  ].filter(Boolean);
  const body = {
    title: \`Corrective — \${inc.ref}\`,
    detail: detailParts.join(' — '),
    status: 'À lancer',
    owner: 'Responsable QHSE'
  };
  if (qhse) {
    body.assigneeId = qhse.id;
    body.owner = qhse.name;
  }
  if (appState.activeSiteId) {
    body.siteId = appState.activeSiteId;
  }
  const res = await qhseFetch('/api/actions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) {
    showToast('Impossible de créer l’action corrective', 'error');
    return;
  }
  const created = await res.json();
  const id = created?.id;
  if (id) {
    mergeActionOverlay(String(id), {
      actionType: 'corrective',
      origin: 'incident',
      priority: inc.severity === 'critique' ? 'haute' : 'normale',
      progressPct: 0,
      linkedIncident: inc.ref
    });
    appendActionHistory(String(id), \`Créée depuis incident \${inc.ref} (corrective).\`);
  }
  showToast(\`Action corrective créée — \${inc.ref}\`, 'success');
  linkModules({
    fromModule: 'incidents',
    fromId: inc.ref,
    toModule: 'actions',
    toId: \`corrective_for_\${inc.ref}\`,
    kind: 'incident_to_action'
  });
  activityLogStore.add({
    module: 'incidents',
    action: 'Création action corrective',
    detail: inc.ref,
    user: getSessionUser()?.name || 'Responsable QHSE'
  });
}

function buildIncidentTableRow(inc, handlers) {`,
  `function buildIncidentTableRow(inc, handlers) {`
);

/* --- Detail panel splice (same as splice-incidents-detail.mjs) --- */
const detStart = s.indexOf('  function renderDetailEmpty(message) {');
const detEnd = s.indexOf('  function syncListSelectionVisual() {');
if (detStart < 0 || detEnd < 0) throw new Error('detail markers');
const patchDetail = `  function renderDetailEmpty(message) {
    mountIncidentDetailEmpty(detailInner, message);
  }

  async function patchIncidentStatus(inc, newStatus, selectEl) {
    selectEl.disabled = true;
    try {
      const res = await qhseFetch(
        \`/api/incidents/\${encodeURIComponent(inc.ref)}\`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        }
      );
      if (!res.ok) {
        let msg = 'Mise à jour impossible';
        try {
          const b = await res.json();
          if (b.error) msg = b.error;
        } catch {
          /* ignore */
        }
        showToast(msg, 'error');
        selectEl.value = inc.status;
        return;
      }
      const updated = await res.json();
      const entry = mapApiIncident(updated);
      if (!entry) {
        showToast('Réponse serveur inattendue', 'error');
        selectEl.value = inc.status;
        return;
      }
      const idx = incidentRecords.findIndex((r) => r.ref === entry.ref);
      if (idx >= 0) incidentRecords[idx] = entry;
      else incidentRecords = [entry, ...incidentRecords];
      showToast(\`Statut : \${newStatus}\`, 'info');
      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'incidents',
          action: 'Statut incident',
          detail: \`\${inc.ref} → \${newStatus}\`,
          user: getSessionUser()?.name || 'Responsable QHSE'
        });
      }
      refreshIncidentJournal();
      refreshList();
    } catch (err) {
      console.error('[incidents] PATCH', err);
      showToast('Erreur réseau', 'error');
      selectEl.value = inc.status;
    } finally {
      selectEl.disabled = !canWriteIncidents;
    }
  }

  const detailCtx = {
    get incidentRecords() {
      return incidentRecords;
    },
    patchIncidentStatus,
    onAddLog,
    refreshIncidentJournal,
    canWriteIncidents,
    canWriteActions
  };

`;
s = s.slice(0, detStart) + patchDetail + s.slice(detEnd);
const dup = s.indexOf('  async function patchIncidentStatus(inc, newStatus, selectEl) {', detStart + patchDetail.length);
if (dup < 0) throw new Error('dup patch');
const dupEnd = s.indexOf('  function refreshList() {', dup);
if (dupEnd < 0) throw new Error('dupEnd');
s = s.slice(0, dup) + s.slice(dupEnd);

s = s.replace(
  `  function activateIncidentRow(inc) {
    selectedRef = inc.ref;
    syncListSelectionVisual();
    renderDetailForIncident(inc);
  }`,
  `  function activateIncidentRow(inc) {
    selectedRef = inc.ref;
    syncListSelectionVisual();
    void mountIncidentDetailPanel(detailInner, inc, detailCtx);
  }`
);
s = s.replace(
  `        renderDetailForIncident(mapRowToDisplay(fresh));`,
  `        void mountIncidentDetailPanel(detailInner, fresh, detailCtx);`
);

/* --- Remove declare block, insert setup --- */
const qm = s.indexOf('  const quick = document.createElement(\'article\');');
const rm = s.indexOf('  return page;');
if (qm < 0 || rm < 0) throw new Error('declare markers');
const insertDeclare = `
  const declareFlow = setupIncidentDeclareFlow({
    btnDeclare,
    btnTerrain,
    getIncidentRecords: () => incidentRecords,
    onDeclared(entry) {
      incidentRecords = [entry, ...incidentRecords.filter((r) => r.ref !== entry.ref)];
      apiLoadState = 'ok';
      refreshList();
    },
    refreshList,
    refreshIncidentJournal,
    onAddLog
  });
  const openDeclarePanel = () => declareFlow.openDeclare();
`;
s = s.slice(0, qm) + insertDeclare + s.slice(rm);

/* empty list CTA */
s = s.replace(
  `slideOver.open(quick)`,
  `openDeclarePanel()`
);

/* Remove page-level slideover + types only used by declare */
s = s.replace(
  `const INCIDENTS_SLIDEOVER_STYLE_ID = 'qhse-incidents-slideover';

function ensureIncidentsSlideOverStyles() {
  if (document.getElementById(INCIDENTS_SLIDEOVER_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = INCIDENTS_SLIDEOVER_STYLE_ID;
  el.textContent = \`
.inc-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,.6);
  z-index: 200;
  opacity: 0;
  pointer-events: none;
  transition: opacity 200ms ease;
}
.inc-overlay--open {
  opacity: 1;
  pointer-events: all;
}
.inc-slideover {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  width: min(440px, 100vw);
  max-width: 100vw;
  background: var(--bg, #0f172a);
  border-left: 1px solid rgba(255,255,255,.09);
  z-index: 201;
  transform: translateX(100%);
  transition: transform 220ms ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}
@media (max-width: 520px) {
  .inc-slideover { width: 100vw; }
  .incidents-rapid-nav .btn { min-height: 48px; font-size: 15px; }
}
.inc-slideover--open {
  transform: translateX(0);
}
.inc-slideover__head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  border-bottom: 1px solid rgba(255,255,255,.065);
  flex-shrink: 0;
}
.inc-slideover__title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text, rgba(255,255,255,.9));
}
.inc-slideover__close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: 0.5px solid rgba(255,255,255,.1);
  background: transparent;
  color: var(--text2, rgba(255,255,255,.5));
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 150ms;
}
.inc-slideover__close:hover {
  background: rgba(255,255,255,.07);
  color: var(--text, rgba(255,255,255,.88));
}
.inc-slideover__body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 18px 20px;
}
\`;
  document.head.append(el);
}

let incidentRecords`,
  `let incidentRecords`
);

s = s.replace(
  `const INCIDENT_TYPES = [
  'Quasi-accident',
  'Accident',
  'Environnement',
  'Sécurité',
  'Engin / circulation',
  'Autre'
];

const CAUSE_CATEGORY_CHIPS = [
  ['humain', 'Humain'],
  ['materiel', 'Matériel'],
  ['organisation', 'Organisation'],
  ['mixte', 'Mixte']
];

/**
 * @param {File} file
 * @returns {Promise<string>}
 */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result || ''));
    r.onerror = () => reject(new Error('lecture fichier'));
    r.readAsDataURL(file);
  });
}

const INCIDENTS_STATES_STYLE_ID`,
  `const INCIDENTS_STATES_STYLE_ID`
);

s = s.replace(
  `function computeNextRef(list) {
  const nums = list.map((r) => {
    const m = /^INC-(\\d+)$/i.exec(r.ref);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = nums.length ? Math.max(...nums) : 200;
  return \`INC-\${max + 1}\`;
}

function severityDsBadgeClass(sev) {`,
  `function severityDsBadgeClass(sev) {`
);

fs.writeFileSync(p, s, 'utf8');
console.log('incidents.js lines', s.split('\n').length);
