import { siteOptions, pageTopbarById } from '../data/navigation.js';
import { appState } from '../utils/state.js';
import { showToast } from '../components/toast.js';
import { activityLogStore } from '../data/activityLog.js';
import { createSeveritySegment } from '../components/severitySegment.js';
import { getApiBase } from '../config.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import {
  buildMonthlyCountSeries,
  createDashboardLineChart,
  createIncidentTypeBreakdown,
  buildTopIncidentTypes
} from '../components/dashboardCharts.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import { fetchSitesCatalog } from '../services/sitesCatalog.service.js';
import { fetchUsers } from '../services/users.service.js';
import { getSessionUser } from '../data/sessionUser.js';
import { canResource } from '../utils/permissionsUi.js';
import { readImportDraft, clearImportDraft } from '../utils/importDraft.js';
import { getRiskTitlesForSelect, formatRiskLinkTag } from '../utils/riskIncidentLinks.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';

const INCIDENT_TYPES = [
  'Quasi-accident',
  'Accident',
  'Environnement',
  'Engin / circulation',
  'Autre'
];

const LIST_SUB_DEFAULT =
  'Tri : gravité critique en tête, puis plus récents. Carte = titre, type, gravité, date, statut.';

/** Statuts proposés pour le select rapide (libre côté API si autre valeur en base). */
const STATUS_PRESETS = ['Nouveau', 'En cours', 'Investigation', 'Clôturé'];

const INCIDENTS_STATES_STYLE_ID = 'qhse-incidents-states-styles';

function ensureIncidentsStatesStyles() {
  if (document.getElementById(INCIDENTS_STATES_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = INCIDENTS_STATES_STYLE_ID;
  el.textContent = `
.incidents-skeleton{
  display:flex;flex-direction:column;gap:8px;padding:2px 0;
}
.skeleton-card{
  padding:12px 14px;border-radius:10px;
  border:1px solid rgba(255,255,255,.055);
  background:rgba(255,255,255,.018);
}
.skeleton-line{
  border-radius:3px;
  background:rgba(255,255,255,.065);
  animation:skeletonPulse 1.5s ease-in-out infinite;
}
.skeleton-line--title{height:11px;width:52%;margin-bottom:8px;}
.skeleton-line--sub{height:10px;width:78%;margin-bottom:6px;}
.skeleton-line--meta{height:9px;width:34%;}
@keyframes skeletonPulse{
  0%,100%{opacity:.5}50%{opacity:1}
}
.incidents-list-host .incidents-empty{
  display:flex;flex-direction:column;
  align-items:center;justify-content:center;
  gap:8px;padding:36px 20px;text-align:center;
}
.incidents-list-host .incidents-empty__title{
  margin:0;font-size:15px;font-weight:600;
  color:var(--text,rgba(255,255,255,.88));
}
.incidents-list-host .incidents-empty__sub{
  margin:0;font-size:13px;line-height:1.5;
  color:var(--text2,rgba(255,255,255,.5));
  max-width:34ch;
}
.incidents-list-host .incidents-empty__cta{margin-top:6px;}
`;
  document.head.append(el);
}

const INCIDENTS_SLIDEOVER_STYLE_ID = 'qhse-incidents-slideover';

function ensureIncidentsSlideOverStyles() {
  if (document.getElementById(INCIDENTS_SLIDEOVER_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = INCIDENTS_SLIDEOVER_STYLE_ID;
  el.textContent = `
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
  background: var(--bg, #0f172a);
  border-left: 1px solid rgba(255,255,255,.09);
  z-index: 201;
  transform: translateX(100%);
  transition: transform 220ms ease;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
`;
  document.head.append(el);
}

let incidentRecords = [];

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
  return `${d}/${m}/${y}`;
}

function incidentTitleFromRow(row) {
  const raw = (row.description || '').trim();
  if (raw) {
    const line = raw.split(/\r?\n/)[0].trim();
    return line.length > 76 ? `${line.slice(0, 73)}…` : line;
  }
  return `${row.type} · ${row.site}`;
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
    description: typeof row.description === 'string' ? row.description : ''
  };
}

function mapRowToDisplay(inc) {
  return {
    ...inc,
    title: incidentTitleFromRow(inc)
  };
}

function computeNextRef(list) {
  const nums = list.map((r) => {
    const m = /^INC-(\d+)$/i.exec(r.ref);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = nums.length ? Math.max(...nums) : 200;
  return `INC-${max + 1}`;
}

function formatToday() {
  return new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function severityDsBadgeClass(sev) {
  if (sev === 'faible') return 'ds-badge--ok';
  if (sev === 'critique') return 'ds-badge--danger';
  return 'ds-badge--warn';
}

function severityOrder(sev) {
  if (sev === 'critique') return 0;
  if (sev === 'moyen') return 1;
  if (sev === 'faible') return 2;
  return 3;
}

function sortIncidentsForDisplay(list) {
  return [...list].sort((a, b) => {
    const da = severityOrder(a.severity);
    const db = severityOrder(b.severity);
    if (da !== db) return da - db;
    return (b.createdAtMs || 0) - (a.createdAtMs || 0);
  });
}

function statusOptionsForSelect(current) {
  const cur = String(current || '').trim();
  const set = new Set(STATUS_PRESETS);
  if (cur && !set.has(cur)) {
    return [cur, ...STATUS_PRESETS];
  }
  return [...STATUS_PRESETS];
}

function isStatusClosed(st) {
  return /clos|ferm|termin|clôtur|résolu|resolu|done|complete/i.test(String(st));
}

function countOpenIncidents(list) {
  return list.filter((i) => !isStatusClosed(i.status)).length;
}

function countCriticalOpenIncidents(list) {
  return list.filter((i) => i.severity === 'critique' && !isStatusClosed(i.status)).length;
}

function countInvestigationOpenIncidents(list) {
  return list.filter((i) => {
    if (isStatusClosed(i.status)) return false;
    const s = String(i.status || '').toLowerCase();
    return s.includes('investigation') || s.includes('investig');
  }).length;
}

/**
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
function computeIncidentsInsight(list) {
  if (!list.length) return '';
  const bySite = {};
  for (const i of list) {
    const s = i.site || '—';
    bySite[s] = (bySite[s] || 0) + 1;
  }
  const sorted = Object.entries(bySite).sort((a, b) => b[1] - a[1]);
  const top = sorted[0];
  if (!top) return '';
  const [topSite, n] = top;
  const total = list.length;
  if (n >= 2 && total >= 4 && n / total >= 0.35) {
    return `Fort volume sur le site « ${topSite} » (${n} incidents) — prioriser la veille terrain.`;
  }
  const weekAgo = Date.now() - 7 * 86400000;
  const recent = list.filter((i) => (i.createdAtMs || 0) >= weekAgo).length;
  if (recent >= 3) {
    return `${recent} incident(s) sur les 7 derniers jours — rythme à surveiller.`;
  }
  return '';
}

function countIncidentsLastDays(list, days) {
  const d = Math.max(1, Number(days) || 7);
  const cut = Date.now() - d * 86400000;
  return list.filter((i) => (i.createdAtMs || 0) >= cut).length;
}

/** Âge moyen (jours) des dossiers encore ouverts — proxy sans date de clôture en base. */
function computeMeanOpenDays(list) {
  const open = list.filter((i) => !isStatusClosed(i.status));
  if (!open.length) return null;
  const sum = open.reduce((acc, i) => {
    const t = i.createdAtMs || Date.now();
    return acc + (Date.now() - t) / 86400000;
  }, 0);
  return Math.round((sum / open.length) * 10) / 10;
}

function inferIncidentAiCauseProbable(inc) {
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

function buildSeverityBreakdownEntries(list) {
  let c = 0;
  let m = 0;
  let f = 0;
  list.forEach((i) => {
    if (i.severity === 'critique') c += 1;
    else if (i.severity === 'faible') f += 1;
    else m += 1;
  });
  return [
    { type: 'Critique', count: c },
    { type: 'Moyen', count: m },
    { type: 'Faible', count: f }
  ];
}

function buildCauseProxyEntries(list) {
  const map = new Map();
  buildTopIncidentTypes(list, 12).forEach(({ type, count }) => {
    const lbl =
      type === 'Accident'
        ? 'Comportement / geste'
        : type === 'Quasi-accident'
          ? 'Near-miss / vigilance'
          : type === 'Environnement'
            ? 'Environnement / matière'
            : type === 'Engin / circulation'
              ? 'Circulation / engins'
              : 'Autres facteurs';
    map.set(lbl, (map.get(lbl) || 0) + count);
  });
  return [...map.entries()]
    .map(([type, count]) => ({ type, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/** @type {object[] | null} */
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
    `Incident ${inc.ref}`,
    `${inc.type} · ${inc.site}`,
    inc.severity ? `Gravité : ${inc.severity}` : '',
    inc.description ? inc.description.slice(0, 400) : ''
  ].filter(Boolean);
  const body = {
    title: `Suite incident ${inc.ref}`,
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
  showToast(`Action créée — liée à ${inc.ref}`, 'info');
  activityLogStore.add({
    module: 'incidents',
    action: 'Création action liée',
    detail: `Depuis incident ${inc.ref}`,
    user: getSessionUser()?.name || 'Responsable QHSE'
  });
}

function buildIncidentTableRow(inc, handlers) {
  const { onSelect, onDetail, onCreateAction, canWriteActions } = handlers;

  const tr = document.createElement('tr');
  tr.className = 'incidents-table-row';
  tr.dataset.severity = inc.severity;
  tr.dataset.ref = inc.ref;
  tr.tabIndex = 0;
  if (inc.severity === 'critique') {
    tr.classList.add('incidents-table-row--critique');
  }

  const tdTitle = document.createElement('td');
  tdTitle.className = 'incidents-table-cell incidents-table-cell--title';
  const titleStrong = document.createElement('div');
  titleStrong.className = 'incidents-table-title';
  titleStrong.textContent = inc.title;
  const refSmall = document.createElement('div');
  refSmall.className = 'incidents-table-ref';
  refSmall.textContent = inc.ref;
  tdTitle.append(titleStrong, refSmall);

  const tdSev = document.createElement('td');
  tdSev.className = 'incidents-table-cell';
  const badgeSev = document.createElement('span');
  badgeSev.className = `ds-badge ${severityDsBadgeClass(inc.severity)}`;
  badgeSev.textContent =
    inc.severity.charAt(0).toUpperCase() + inc.severity.slice(1);
  tdSev.append(badgeSev);

  const tdSt = document.createElement('td');
  tdSt.className = 'incidents-table-cell';
  const badgeSt = document.createElement('span');
  badgeSt.className = `ds-badge ${isStatusClosed(inc.status) ? 'ds-badge--ok' : 'ds-badge--info'}`;
  badgeSt.textContent = inc.status;
  tdSt.append(badgeSt);

  const tdDate = document.createElement('td');
  tdDate.className = 'incidents-table-cell incidents-table-cell--num';
  tdDate.textContent = inc.date;

  const tdSite = document.createElement('td');
  tdSite.className = 'incidents-table-cell';
  tdSite.textContent = inc.site;

  const tdAct = document.createElement('td');
  tdAct.className = 'incidents-table-cell incidents-table-cell--acts';
  const btnDetail = document.createElement('button');
  btnDetail.type = 'button';
  btnDetail.className = 'btn btn-secondary incidents-table-btn';
  btnDetail.textContent = 'Voir';
  btnDetail.addEventListener('click', (e) => {
    e.stopPropagation();
    onDetail(inc);
  });
  const btnAction = document.createElement('button');
  btnAction.type = 'button';
  btnAction.className = 'btn btn-primary incidents-table-btn';
  btnAction.textContent = 'Traiter';
  btnAction.hidden = !canWriteActions;
  btnAction.addEventListener('click', (e) => {
    e.stopPropagation();
    onCreateAction(inc);
  });
  tdAct.append(btnDetail, btnAction);

  tr.append(tdTitle, tdSev, tdSt, tdDate, tdSite, tdAct);

  function activate() {
    onSelect(inc);
  }
  tr.addEventListener('click', activate);
  tr.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      activate();
    }
  });

  return tr;
}

export function renderIncidents(onAddLog) {
  ensureDashboardStyles();
  /* Évite liste / compteurs obsolètes quand on revient sur la page (variable module). */
  incidentRecords = [];

  const page = document.createElement('section');
  page.className = 'page-stack incidents-page incidents-page--premium';

  let panelFilterStatus = 'all';
  let filterDateRange = 'all';
  let filterSeverity = '';
  let filterStatus = '';
  let filterSite = '';

  function renderFilteredList() {
    refreshList();
  }

  let selectedRef = null;

  const siteLabel = appState.currentSite || 'Tous sites';

  const pageIntro = document.createElement('header');
  pageIntro.className = 'incidents-page-header incidents-page-header--intro';

  const introTitles = document.createElement('div');
  introTitles.className = 'incidents-page-header__titles';
  const incMeta = pageTopbarById.incidents ?? {
    kicker: 'Opérations',
    title: 'Incidents terrain',
    subtitle: 'Suivi des événements, investigations et plans de correction.'
  };
  const kicker = document.createElement('div');
  kicker.className = 'section-kicker incidents-page-header__kicker';
  kicker.textContent = `${incMeta.kicker} · ${siteLabel}`;
  const hTitle = document.createElement('h1');
  hTitle.className = 'incidents-page-header__title';
  hTitle.textContent = incMeta.title;
  const subTitle = document.createElement('p');
  subTitle.className = 'incidents-page-header__subtitle';
  subTitle.textContent = incMeta.subtitle;
  introTitles.append(kicker, hTitle, subTitle);
  pageIntro.append(introTitles);

  const pilotageBlock = document.createElement('section');
  pilotageBlock.className = 'incidents-pilotage-block';
  pilotageBlock.setAttribute('aria-labelledby', 'incidents-pilotage-heading');

  const pilotageHead = document.createElement('div');
  pilotageHead.className = 'incidents-pilotage-block__head';
  const pilotageKicker = document.createElement('div');
  pilotageKicker.className = 'incidents-section-kicker';
  pilotageKicker.textContent = 'Pilotage';
  const pilotageTitle = document.createElement('h2');
  pilotageTitle.id = 'incidents-pilotage-heading';
  pilotageTitle.className = 'incidents-pilotage-block__title';
  pilotageTitle.textContent = 'Vue opérationnelle';
  const pilotageLead = document.createElement('p');
  pilotageLead.className = 'incidents-pilotage-block__lead';
  pilotageLead.textContent =
    'Indicateurs calculés sur le périmètre chargé — pour le détail, utilisez le registre ci-dessous.';
  pilotageHead.append(pilotageKicker, pilotageTitle, pilotageLead);

  const statsRow = document.createElement('div');
  statsRow.className = 'incidents-pilotage-block__stats incidents-synth';
  function makeSynthTile(label, extraClass = '', titleHint = '') {
    const box = document.createElement('div');
    box.className = `incidents-synth-tile ${extraClass}`.trim();
    if (titleHint) box.title = titleHint;
    const lb = document.createElement('div');
    lb.className = 'incidents-synth-tile__label';
    lb.textContent = label;
    const val = document.createElement('div');
    val.className = 'incidents-synth-tile__value';
    val.textContent = '—';
    box.append(lb, val);
    return { box, val };
  }
  const stCrit = makeSynthTile(
    'Critiques ouverts',
    'incidents-synth-tile--alert',
    'Gravité critique et statut encore ouvert'
  );
  const stRecent = makeSynthTile(
    'Récents (7 j.)',
    '',
    'Nouvelles déclarations sur les 7 derniers jours'
  );
  const stInv = makeSynthTile(
    'En investigation',
    '',
    'Dossiers ouverts dont le statut indique une investigation en cours'
  );
  const stMean = makeSynthTile(
    'Délai moyen traitement (j)',
    '',
    'Proxy : ancienneté moyenne des dossiers encore ouverts (pas de date de clôture serveur)'
  );
  statsRow.append(stCrit.box, stRecent.box, stInv.box, stMean.box);

  const insightBar = document.createElement('div');
  insightBar.className = 'incidents-insight incidents-pilotage-block__insight';
  insightBar.setAttribute('role', 'status');
  insightBar.hidden = true;

  pilotageBlock.append(pilotageHead, statsRow, insightBar);

  const quickActionsCard = document.createElement('article');
  quickActionsCard.className =
    'content-card card-soft incidents-premium-card incidents-quick-actions-card';
  const quickActionsInner = document.createElement('div');
  quickActionsInner.className = 'incidents-quick-actions-card__inner';
  const quickActionsCopy = document.createElement('div');
  quickActionsCopy.className = 'incidents-quick-actions-card__copy';
  const qaKicker = document.createElement('div');
  qaKicker.className = 'incidents-section-kicker';
  qaKicker.textContent = 'Action';
  const qaTitle = document.createElement('h2');
  qaTitle.className = 'incidents-quick-actions-card__title';
  qaTitle.textContent = 'Déclaration & raccourcis';
  const qaLead = document.createElement('p');
  qaLead.className = 'incidents-quick-actions-card__lead';
  qaLead.textContent =
    'Ouvrez l’assistant guidé pour une déclaration structurée. Le registre en dessous sert à la consultation.';
  quickActionsCopy.append(qaKicker, qaTitle, qaLead);
  const quickActionsBtns = document.createElement('div');
  quickActionsBtns.className = 'incidents-quick-actions-card__buttons';
  const btnDeclare = document.createElement('button');
  btnDeclare.type = 'button';
  btnDeclare.className = 'btn btn-primary incidents-page-header__cta';
  btnDeclare.textContent = '+ Déclarer un incident';
  const btnTerrain = document.createElement('button');
  btnTerrain.type = 'button';
  btnTerrain.className = 'btn btn-secondary incidents-quick-actions-card__terrain';
  btnTerrain.textContent = 'Déclaration terrain';
  btnTerrain.title = 'Même assistant — optimisé pour une saisie rapide sur le terrain';
  const btnDash = document.createElement('button');
  btnDash.type = 'button';
  btnDash.className = 'incidents-page-header__linkish';
  btnDash.textContent = 'Tableau de bord';
  btnDash.addEventListener('click', () => {
    window.location.hash = 'dashboard';
  });
  quickActionsBtns.append(btnDeclare, btnTerrain, btnDash);
  quickActionsInner.append(quickActionsCopy, quickActionsBtns);
  quickActionsCard.append(quickActionsInner);

  const prioritiesCard = document.createElement('article');
  prioritiesCard.className =
    'content-card card-soft incidents-premium-card incidents-priorities-card';
  const prioritiesHead = document.createElement('div');
  prioritiesHead.className = 'incidents-priorities-card__head';
  prioritiesHead.innerHTML = `
    <div>
      <div class="incidents-section-kicker">Lecture rapide</div>
      <h2 class="incidents-priorities-card__title">Priorités</h2>
      <p class="incidents-priorities-card__lead">Aperçu des fiches à traiter en premier — cliquez pour ouvrir le détail.</p>
    </div>`;
  const prioritiesHost = document.createElement('div');
  prioritiesHost.className = 'incidents-priorities-card__host';
  prioritiesCard.append(prioritiesHead, prioritiesHost);

  function filterIncidents(list) {
    return list.filter((inc) => {
      if (filterSeverity && inc.severity !== filterSeverity) return false;
      if (filterStatus && String(inc.status || '').trim() !== filterStatus) {
        return false;
      }
      if (filterSite && String(inc.site || '').trim() !== filterSite) {
        return false;
      }
      if (panelFilterStatus === 'all') return true;
      const st = String(inc.status).toLowerCase();
      if (panelFilterStatus === 'nouveau') {
        return st.includes('nouveau') || st.includes('new');
      }
      if (panelFilterStatus === 'clos') {
        return isStatusClosed(st);
      }
      return true;
    });
  }

  function getFilteredSortedRows() {
    let rows = filterIncidents(incidentRecords);
    if (filterDateRange !== 'all') {
      const days = parseInt(filterDateRange, 10);
      const cutoff = Date.now() - days * 86400000;
      rows = rows.filter((inc) => {
        const t = inc.createdAtMs;
        return Number.isFinite(t) && t >= cutoff;
      });
    }
    return sortIncidentsForDisplay(rows);
  }

  function updateHeaderStats() {
    const dash = '—';
    if (apiLoadState === 'loading' || apiLoadState === 'error') {
      stCrit.val.textContent = dash;
      stRecent.val.textContent = dash;
      stInv.val.textContent = dash;
      stMean.val.textContent = dash;
      insightBar.hidden = true;
      return;
    }
    stCrit.val.textContent = String(countCriticalOpenIncidents(incidentRecords));
    stRecent.val.textContent = String(countIncidentsLastDays(incidentRecords, 7));
    stInv.val.textContent = String(countInvestigationOpenIncidents(incidentRecords));
    const mean = computeMeanOpenDays(incidentRecords);
    stMean.val.textContent = mean != null ? String(mean) : '—';
    const insight = computeIncidentsInsight(incidentRecords);
    if (insight) {
      insightBar.textContent = insight;
      insightBar.hidden = false;
    } else {
      insightBar.hidden = true;
    }
  }

  const compactFilters = document.createElement('div');
  compactFilters.className = 'incidents-compact-filters';

  const filtersBar = document.createElement('div');
  filtersBar.className = 'incidents-compact-filters__grid';

  const statusLab = document.createElement('label');
  const statusLabSpan = document.createElement('span');
  statusLabSpan.textContent = 'Vue statut';
  const statusSel = document.createElement('select');
  statusSel.className = 'control-select';
  [
    ['all', 'Tous'],
    ['nouveau', 'Nouveau'],
    ['clos', 'Clos / terminé']
  ].forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = t;
    statusSel.append(o);
  });
  statusSel.addEventListener('change', () => {
    panelFilterStatus = statusSel.value;
    refreshList();
  });
  statusLab.append(statusLabSpan, statusSel);

  const dateLab = document.createElement('label');
  const dateLabSpan = document.createElement('span');
  dateLabSpan.textContent = 'Période';
  const dateSel = document.createElement('select');
  dateSel.className = 'control-select';
  [
    ['all', 'Toutes'],
    ['7', '7 derniers jours'],
    ['30', '30 derniers jours']
  ].forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = t;
    dateSel.append(o);
  });
  dateSel.addEventListener('change', () => {
    filterDateRange = dateSel.value;
    refreshList();
  });
  dateLab.append(dateLabSpan, dateSel);

  const filSevLab = document.createElement('label');
  const filSevLabSpan = document.createElement('span');
  filSevLabSpan.textContent = 'Gravité';
  const filSevSel = document.createElement('select');
  filSevSel.className = 'control-select incidents-filter-severity';
  [
    ['', 'Toutes gravités'],
    ['critique', 'Critique'],
    ['moyen', 'Moyen'],
    ['faible', 'Faible']
  ].forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = t;
    filSevSel.append(o);
  });
  filSevSel.addEventListener('change', () => {
    filterSeverity = filSevSel.value;
    renderFilteredList();
  });
  filSevLab.append(filSevLabSpan, filSevSel);

  const filStLab = document.createElement('label');
  const filStLabSpan = document.createElement('span');
  filStLabSpan.textContent = 'Statut';
  const filStSel = document.createElement('select');
  filStSel.className = 'control-select incidents-filter-status';
  [
    ['', 'Tous statuts'],
    ['Nouveau', 'Nouveau'],
    ['En cours', 'En cours'],
    ['Investigation', 'Investigation'],
    ['Clôturé', 'Clôturé']
  ].forEach(([v, t]) => {
    const o = document.createElement('option');
    o.value = v;
    o.textContent = t;
    filStSel.append(o);
  });
  filStSel.addEventListener('change', () => {
    filterStatus = filStSel.value;
    renderFilteredList();
  });
  filStLab.append(filStLabSpan, filStSel);

  const filSiteLab = document.createElement('label');
  const filSiteLabSpan = document.createElement('span');
  filSiteLabSpan.textContent = 'Site';
  const filSiteSel = document.createElement('select');
  filSiteSel.className = 'control-select incidents-filter-site';
  const optSiteAll = document.createElement('option');
  optSiteAll.value = '';
  optSiteAll.textContent = 'Tous les sites';
  filSiteSel.append(optSiteAll);
  filSiteSel.addEventListener('change', () => {
    filterSite = filSiteSel.value;
    renderFilteredList();
  });
  filSiteLab.append(filSiteLabSpan, filSiteSel);

  const filtersChunkViews = document.createElement('div');
  filtersChunkViews.className = 'incidents-compact-filters__chunk';
  filtersChunkViews.setAttribute('aria-label', 'Vues rapides');
  filtersChunkViews.append(statusLab, dateLab);

  const filtersChunkRefine = document.createElement('div');
  filtersChunkRefine.className =
    'incidents-compact-filters__chunk incidents-compact-filters__chunk--refine';
  filtersChunkRefine.setAttribute('aria-label', 'Filtres précis');
  filtersChunkRefine.append(filSevLab, filStLab, filSiteLab);

  filtersBar.append(filtersChunkViews, filtersChunkRefine);
  compactFilters.append(filtersBar);

  const quick = document.createElement('article');
  quick.id = 'incidents-declare';
  quick.className =
    'content-card card-soft incidents-form-card incidents-premium-card incidents-declare-card';

  const head = document.createElement('div');
  head.className = 'content-card-head';
  head.innerHTML = `
      <div>
        <div class="section-kicker">Terrain</div>
        <h3>Déclaration express</h3>
        <p class="incidents-form-lead">
          5 étapes courtes — une seule question visible à la fois. Validation finale requise avant envoi API.
        </p>
        <p class="incidents-form-api-hint" title="URL technique pour support / intégration">
          API : <code>${getApiBase()}</code>
        </p>
      </div>`;

  const wizRoot = document.createElement('div');
  wizRoot.className = 'incidents-rapid-wizard';

  const stepLabel = document.createElement('div');
  stepLabel.className = 'incidents-rapid-wizard__step-label';
  const dots = document.createElement('div');
  dots.className = 'incidents-rapid-dots';
  for (let i = 0; i < 5; i += 1) {
    const d = document.createElement('span');
    d.className = 'incidents-rapid-dot';
    d.dataset.idx = String(i);
    dots.append(d);
  }
  wizRoot.append(stepLabel, dots);

  const paneTitles = [
    'Type d’incident',
    'Gravité perçue',
    'Description courte',
    'Photo (optionnel)',
    'Site & localisation'
  ];

  const pane0 = document.createElement('div');
  pane0.className = 'incidents-rapid-pane';
  pane0.dataset.pane = '0';
  const q0 = document.createElement('p');
  q0.className = 'incidents-rapid-q';
  q0.textContent = 'Quel type d’événement ?';
  const typeChips = document.createElement('div');
  typeChips.className = 'incidents-rapid-type-chips';
  const typeSelect = document.createElement('select');
  typeSelect.className = 'control-select incident-field-type incidents-sr-only';
  typeSelect.setAttribute('aria-hidden', 'true');
  typeSelect.tabIndex = -1;
  const optTypePlaceholder = document.createElement('option');
  optTypePlaceholder.value = '';
  optTypePlaceholder.textContent = '—';
  typeSelect.append(optTypePlaceholder);
  INCIDENT_TYPES.forEach((t) => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    typeSelect.append(opt);
  });
  const chipByType = new Map();
  INCIDENT_TYPES.forEach((t) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'incidents-rapid-chip';
    b.textContent = t;
    b.addEventListener('click', () => {
      typeSelect.value = t;
      chipByType.forEach((btn, key) => {
        btn.classList.toggle('incidents-rapid-chip--on', key === t);
      });
      syncNav();
    });
    chipByType.set(t, b);
    typeChips.append(b);
  });
  pane0.append(q0, typeChips, typeSelect);

  const pane1 = document.createElement('div');
  pane1.className = 'incidents-rapid-pane';
  pane1.dataset.pane = '1';
  pane1.hidden = true;
  const q1 = document.createElement('p');
  q1.className = 'incidents-rapid-q';
  q1.textContent = 'Quelle gravité ?';
  const severityMount = document.createElement('div');
  severityMount.className = 'incident-severity-mount';
  pane1.append(q1, severityMount);

  const pane2 = document.createElement('div');
  pane2.className = 'incidents-rapid-pane';
  pane2.dataset.pane = '2';
  pane2.hidden = true;
  const q2 = document.createElement('p');
  q2.className = 'incidents-rapid-q';
  q2.textContent = 'Que s’est-il passé ? (2–3 phrases max)';
  const descInput = document.createElement('textarea');
  descInput.className = 'control-input incidents-field-desc incident-field-desc';
  descInput.maxLength = 2000;
  descInput.rows = 3;
  descInput.placeholder = 'Faits, lieu immédiat, conséquences visibles…';
  descInput.autocomplete = 'off';
  pane2.append(q2, descInput);

  const pane3 = document.createElement('div');
  pane3.className = 'incidents-rapid-pane';
  pane3.dataset.pane = '3';
  pane3.hidden = true;
  const q3 = document.createElement('p');
  q3.className = 'incidents-rapid-q';
  q3.textContent = 'Ajouter une photo ?';
  const photoInput = document.createElement('input');
  photoInput.type = 'file';
  photoInput.accept = 'image/*';
  photoInput.className = 'incidents-rapid-photo-input';
  const photoNote = document.createElement('p');
  photoNote.className = 'incidents-form-lead incidents-rapid-photo-note';
  photoNote.textContent =
    'Le serveur ne stocke pas encore les médias : une mention « photo signalée » sera ajoutée au texte. Pour archivage réel, branchez un endpoint fichiers.';
  const photoPreview = document.createElement('div');
  photoPreview.className = 'incidents-rapid-photo-preview';
  photoInput.addEventListener('change', () => {
    photoPreview.replaceChildren();
    const f = photoInput.files?.[0];
    if (!f || !f.type.startsWith('image/')) return;
    const url = URL.createObjectURL(f);
    const img = document.createElement('img');
    img.src = url;
    img.alt = 'Aperçu';
    img.className = 'incidents-rapid-photo-preview__img';
    photoPreview.append(img);
  });
  pane3.append(q3, photoInput, photoNote, photoPreview);

  const pane4 = document.createElement('div');
  pane4.className = 'incidents-rapid-pane';
  pane4.dataset.pane = '4';
  pane4.hidden = true;
  const q4 = document.createElement('p');
  q4.className = 'incidents-rapid-q';
  q4.textContent = 'Où cela s’est-il produit ?';
  const siteSelect = document.createElement('select');
  siteSelect.className = 'control-select incident-field-site';
  const locInput = document.createElement('input');
  locInput.type = 'text';
  locInput.className = 'control-input incidents-rapid-loc';
  locInput.placeholder = 'Zone, atelier, ligne, poste…';
  const dateFactsInput = document.createElement('input');
  dateFactsInput.type = 'date';
  dateFactsInput.className = 'control-input incidents-field-date incident-field-date';
  try {
    dateFactsInput.valueAsDate = new Date();
  } catch {
    /* ignore */
  }
  const geoRow = document.createElement('div');
  geoRow.className = 'incidents-rapid-geo-row';
  const geoBtn = document.createElement('button');
  geoBtn.type = 'button';
  geoBtn.className = 'btn btn-secondary';
  geoBtn.textContent = 'Remplir par GPS';
  geoBtn.addEventListener('click', () => {
    if (!navigator.geolocation) {
      showToast('Géolocalisation non disponible', 'warning');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        locInput.value = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
        showToast('Coordonnées insérées', 'info');
      },
      () => showToast('Position refusée ou indisponible', 'warning'),
      { enableHighAccuracy: true, timeout: 12000 }
    );
  });
  geoRow.append(geoBtn);
  const dateFactsWrap = document.createElement('label');
  dateFactsWrap.className = 'incidents-rapid-date-field';
  const dateSpan = document.createElement('span');
  dateSpan.textContent = 'Date des faits';
  dateFactsWrap.append(dateSpan, dateFactsInput);

  const riskLinkField = document.createElement('label');
  riskLinkField.className = 'incidents-rapid-risk-field';
  const riskLinkFieldLabel = document.createElement('span');
  riskLinkFieldLabel.className = 'incidents-rapid-risk-field__label';
  riskLinkFieldLabel.textContent = 'Associer à un risque du registre (optionnel)';
  const riskSelect = document.createElement('select');
  riskSelect.className = 'control-select incidents-risk-link-select';
  riskSelect.setAttribute('aria-label', 'Risque QHSE lié');
  const riskOptNone = document.createElement('option');
  riskOptNone.value = '';
  riskOptNone.textContent = '— Aucun —';
  riskSelect.append(riskOptNone);

  function fillIncidentRiskSelect() {
    riskSelect.querySelectorAll('option:not([value=""])').forEach((o) => o.remove());
    getRiskTitlesForSelect().forEach((title) => {
      const o = document.createElement('option');
      o.value = title;
      o.textContent = title.length > 64 ? `${title.slice(0, 61)}…` : title;
      riskSelect.append(o);
    });
  }
  fillIncidentRiskSelect();

  const riskLinkHint = document.createElement('p');
  riskLinkHint.className = 'incidents-rapid-risk-field__hint';
  riskLinkHint.textContent =
    'Enregistré dans la description sous forme de repère texte — même logique que le module Risques pour retrouver les incidents liés.';
  riskLinkField.append(riskLinkFieldLabel, riskSelect, riskLinkHint);
  pane4.append(q4, siteSelect, locInput, dateFactsWrap, riskLinkField, geoRow);

  const nav = document.createElement('div');
  nav.className = 'incidents-rapid-nav';
  const btnPrev = document.createElement('button');
  btnPrev.type = 'button';
  btnPrev.className = 'btn btn-secondary';
  btnPrev.textContent = 'Retour';
  const btnNext = document.createElement('button');
  btnNext.type = 'button';
  btnNext.className = 'btn btn-primary';
  btnNext.textContent = 'Continuer';
  const submitBtn = document.createElement('button');
  submitBtn.type = 'button';
  submitBtn.className = 'btn btn-primary incidents-submit incident-submit';
  submitBtn.textContent = 'Enregistrer l’incident';
  nav.append(btnPrev, btnNext, submitBtn);

  wizRoot.append(pane0, pane1, pane2, pane3, pane4, nav);
  quick.append(head, wizRoot);

  const panes = [pane0, pane1, pane2, pane3, pane4];
  let wizardStep = 0;

  function setWizardStep(idx) {
    wizardStep = Math.max(0, Math.min(4, idx));
    panes.forEach((p, i) => {
      p.hidden = i !== wizardStep;
    });
    dots.querySelectorAll('.incidents-rapid-dot').forEach((d, i) => {
      d.classList.toggle('incidents-rapid-dot--on', i === wizardStep);
      d.classList.toggle('incidents-rapid-dot--done', i < wizardStep);
    });
    stepLabel.textContent = `Étape ${wizardStep + 1} / 5 — ${paneTitles[wizardStep]}`;
    btnPrev.hidden = wizardStep === 0;
    btnNext.hidden = wizardStep === 4;
    submitBtn.hidden = wizardStep !== 4;
    syncNav();
  }

  function syncNav() {
    if (wizardStep === 0) {
      btnNext.disabled = !typeSelect.value.trim();
    } else if (wizardStep === 4) {
      btnNext.disabled = false;
      submitBtn.disabled = !siteSelect.value.trim();
    } else {
      btnNext.disabled = false;
    }
  }

  typeSelect.addEventListener('change', syncNav);
  siteSelect.addEventListener('change', syncNav);

  btnPrev.addEventListener('click', () => setWizardStep(wizardStep - 1));
  btnNext.addEventListener('click', () => setWizardStep(wizardStep + 1));

  const severity = createSeveritySegment('moyen');
  severityMount.append(severity.element);

  setWizardStep(0);

  async function fillIncidentSiteSelect() {
    siteSelect.innerHTML = '';
    const namesSeen = new Set();
    try {
      const catalog = await fetchSitesCatalog();
      catalog.forEach((s) => {
        if (!s?.name) return;
        const opt = document.createElement('option');
        opt.value = s.name;
        opt.textContent = s.code ? `${s.name} (${s.code})` : s.name;
        opt.dataset.siteId = s.id;
        siteSelect.append(opt);
        namesSeen.add(s.name);
      });
    } catch {
      /* fallback */
    }
    siteOptions.forEach((s) => {
      if (namesSeen.has(s)) return;
      const opt = document.createElement('option');
      opt.value = s;
      opt.textContent = s;
      siteSelect.append(opt);
    });

    if (appState.activeSiteId) {
      const hit = [...siteSelect.options].find(
        (o) => o.dataset.siteId === appState.activeSiteId
      );
      if (hit) {
        siteSelect.value = hit.value;
        return;
      }
    }
    const activeSite = appState.currentSite;
    if (activeSite && siteOptions.includes(activeSite)) {
      siteSelect.value = activeSite;
    } else if ([...siteSelect.options].some((o) => o.value === activeSite)) {
      siteSelect.value = activeSite;
    } else if (siteSelect.options.length) {
      siteSelect.selectedIndex = 0;
    }
  }

  function applyIncidentImportDraftIfAny() {
    const draft = readImportDraft();
    if (!draft || draft.targetPageId !== 'incidents' || !draft.prefillData) {
      return;
    }
    const p = draft.prefillData;
    if (p.type && INCIDENT_TYPES.includes(p.type)) {
      typeSelect.value = p.type;
      chipByType.forEach((btn, key) => {
        btn.classList.toggle('incidents-rapid-chip--on', key === p.type);
      });
    }
    if (p.site && typeof p.site === 'string') {
      const siteStr = p.site.trim();
      const matchValue = [...siteSelect.options].some((o) => o.value === siteStr);
      if (matchValue) {
        siteSelect.value = siteStr;
      } else if (siteOptions.includes(p.site)) {
        siteSelect.value = p.site;
      }
    }
    const sevRaw = p.severity || p.gravite;
    if (sevRaw) {
      severity.setValue(normalizeSeverity(String(sevRaw)));
    }
    let desc = p.description ? String(p.description) : '';
    if (
      p.site &&
      typeof p.site === 'string' &&
      !siteOptions.includes(p.site) &&
      ![...siteSelect.options].some((o) => o.value === p.site.trim()) &&
      desc.length < 1900
    ) {
      const hint = `[Site détecté (non listé) : ${p.site.slice(0, 48)}] `;
      desc = hint + desc;
    }
    if (desc) {
      descInput.value = desc.slice(0, 2000);
    }
    clearImportDraft();
    showToast('Brouillon import appliqué — vérifiez puis enregistrez.', 'info');
  }

  (async function initIncidentSiteAndDraft() {
    await fillIncidentSiteSelect();
    fillIncidentRiskSelect();
    applyIncidentImportDraftIfAny();
  })();

  const canDeclare = canResource(getSessionUser()?.role, 'incidents', 'write');
  if (!canDeclare && getSessionUser()) {
    wizRoot.style.opacity = '0.58';
    submitBtn.disabled = true;
    btnNext.disabled = true;
    btnPrev.disabled = true;
    submitBtn.title = 'Déclaration réservée — votre rôle est en lecture sur les incidents';
  }

  ensureIncidentsSlideOverStyles();
  document.getElementById('qhse-inc-slideover-overlay')?.remove();
  document.getElementById('qhse-inc-slideover-panel')?.remove();

  function createSlideOver() {
    const overlay = document.createElement('div');
    overlay.className = 'inc-overlay';
    overlay.id = 'qhse-inc-slideover-overlay';
    overlay.setAttribute('aria-hidden', 'true');

    const panel = document.createElement('div');
    panel.className = 'inc-slideover';
    panel.id = 'qhse-inc-slideover-panel';
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', 'Déclarer un incident');

    const header = document.createElement('div');
    header.className = 'inc-slideover__head';
    header.innerHTML = `
    <span class="inc-slideover__title">
      Déclarer un incident
    </span>
    <button type="button"
      class="inc-slideover__close"
      aria-label="Fermer">
      <svg width="18" height="18"
        viewBox="0 0 24 24" fill="none"
        stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  `;

    const body = document.createElement('div');
    body.className = 'inc-slideover__body';

    panel.append(header, body);

    function onDocKeydown(e) {
      if (e.key !== 'Escape') return;
      if (!panel.classList.contains('inc-slideover--open')) return;
      e.preventDefault();
      close();
    }

    function open(formElement) {
      body.replaceChildren(formElement);
      overlay.setAttribute('aria-hidden', 'false');
      overlay.classList.add('inc-overlay--open');
      panel.classList.add('inc-slideover--open');
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', onDocKeydown);
      panel.querySelector('input, select, textarea')?.focus();
    }

    function close() {
      overlay.setAttribute('aria-hidden', 'true');
      overlay.classList.remove('inc-overlay--open');
      panel.classList.remove('inc-slideover--open');
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onDocKeydown);
      body.replaceChildren();
    }

    overlay.addEventListener('click', close);
    header.querySelector('.inc-slideover__close').addEventListener('click', close);

    document.body.append(overlay, panel);
    return { open, close };
  }

  const slideOver = createSlideOver();

  btnDeclare.addEventListener('click', () => slideOver.open(quick));
  btnTerrain.addEventListener('click', () => slideOver.open(quick));

  const split = document.createElement('div');
  split.className = 'incidents-split incidents-split--register-stacked';

  const listCol = document.createElement('div');
  listCol.className =
    'incidents-split__list incidents-split__list--consult content-card card-soft incidents-premium-card';
  listCol.id = 'incidents-recent-list';

  const listColHead = document.createElement('div');
  listColHead.className = 'incidents-split-list-head';
  const listTitleRow = document.createElement('div');
  listTitleRow.className = 'incidents-split-list-head__row';
  const listHeading = document.createElement('h2');
  listHeading.className = 'incidents-list-heading';
  listHeading.textContent = 'Consultation — registre';
  const listCount = document.createElement('span');
  listCount.className = 'incidents-list-count';
  listTitleRow.append(listHeading, listCount);
  const listLead = document.createElement('p');
  listLead.className = 'incidents-registry-lead';
  listLead.textContent =
    'Tableau sur toute la largeur : filtres ci-dessus, tri par criticité. Ligne ou « Voir » → fiche détaillée sous le registre.';
  listColHead.append(listTitleRow, listLead);

  const listHost = document.createElement('div');
  listHost.className = 'incidents-list-host';

  ensureIncidentsStatesStyles();

  listCol.append(listColHead, listHost);

  const detailCol = document.createElement('aside');
  detailCol.className = 'incidents-split__detail content-card card-soft incidents-premium-card';
  detailCol.setAttribute('aria-label', 'Détail incident');

  const detailInner = document.createElement('div');
  detailInner.className = 'incidents-detail-panel';
  detailCol.append(detailInner);

  split.append(listCol, detailCol);

  let apiLoadState = 'loading';

  const canWriteIncidents = canResource(getSessionUser()?.role, 'incidents', 'write');
  const canWriteActions = canResource(getSessionUser()?.role, 'actions', 'write');

  const analyticsCard = document.createElement('article');
  analyticsCard.className =
    'content-card card-soft incidents-premium-card incidents-analytics-card';
  const analyticsHead = document.createElement('div');
  analyticsHead.className = 'content-card-head';
  analyticsHead.innerHTML = `
    <div>
      <div class="section-kicker">Tendances</div>
      <h3>Analytics</h3>
      <p class="incidents-form-lead incidents-analytics-card__lead">
        Tendances sur le périmètre chargé — même source que le registre.
      </p>
    </div>`;
  const analyticsGrid = document.createElement('div');
  analyticsGrid.className = 'incidents-analytics-grid';
  analyticsCard.append(analyticsHead, analyticsGrid);

  const registryShell = document.createElement('div');
  registryShell.className = 'incidents-registry-shell incidents-registry-shell--secondary';
  const registryZoneTitle = document.createElement('div');
  registryZoneTitle.className = 'incidents-registry-zone-title';
  registryZoneTitle.innerHTML = `
    <p class="incidents-registry-zone-kicker">Consultation</p>
    <h2 class="incidents-registry-zone-heading">Registre incidents</h2>
  `;
  registryShell.append(registryZoneTitle, compactFilters, split);

  page.append(
    createSimpleModeGuide({
      title: 'Incidents — lire vite, agir sûr',
      hint: 'En-tête : pilotage et priorités ; déclarez depuis le bloc action ; le registre sert à parcourir les fiches.',
      nextStep: 'Déclarer si besoin, sinon parcourir les priorités puis le tableau de consultation.'
    }),
    pageIntro,
    pilotageBlock,
    quickActionsCard,
    prioritiesCard,
    analyticsCard,
    registryShell
  );

  function refreshAnalytics() {
    analyticsGrid.replaceChildren();
    if (apiLoadState !== 'ok' || !incidentRecords.length) {
      const p = document.createElement('p');
      p.className = 'incidents-detail-muted';
      p.textContent =
        apiLoadState === 'loading'
          ? 'Chargement des graphiques…'
          : 'Aucune donnée incident à analyser sur cette vue.';
      analyticsGrid.append(p);
      return;
    }
    const monthly = buildMonthlyCountSeries(
      incidentRecords,
      (row) => (row.createdAt ? String(row.createdAt) : null),
      6
    );
    const c1 = document.createElement('div');
    c1.className = 'incidents-analytics-cell';
    const t1 = document.createElement('h4');
    t1.className = 'incidents-analytics-cell__title';
    t1.textContent = 'Évolution des déclarations';
    c1.append(
      t1,
      createDashboardLineChart(monthly, {
        lineTheme: 'incidents',
        footText: null,
        ariaLabel: 'Nombre d’incidents déclarés par mois sur six mois.'
      })
    );

    const c2 = document.createElement('div');
    c2.className = 'incidents-analytics-cell';
    const t2 = document.createElement('h4');
    t2.className = 'incidents-analytics-cell__title';
    t2.textContent = 'Répartition par type';
    c2.append(t2, createIncidentTypeBreakdown(buildTopIncidentTypes(incidentRecords)));

    const c3 = document.createElement('div');
    c3.className = 'incidents-analytics-cell';
    const t3 = document.createElement('h4');
    t3.className = 'incidents-analytics-cell__title';
    t3.textContent = 'Gravité';
    c3.append(t3, createIncidentTypeBreakdown(buildSeverityBreakdownEntries(incidentRecords)));

    const c4 = document.createElement('div');
    c4.className = 'incidents-analytics-cell';
    const t4 = document.createElement('h4');
    t4.className = 'incidents-analytics-cell__title';
    t4.textContent = 'Causes apparentes (proxy types)';
    c4.append(t4, createIncidentTypeBreakdown(buildCauseProxyEntries(incidentRecords)));

    analyticsGrid.append(c1, c2, c3, c4);
  }

  function renderDetailEmpty(message) {
    detailInner.replaceChildren();
    const wrap = document.createElement('div');
    wrap.className = 'incidents-detail-empty';
    const p = document.createElement('p');
    p.className = 'incidents-detail-empty__title';
    p.textContent = message || 'Sélectionnez un incident';
    const sub = document.createElement('p');
    sub.className = 'incidents-detail-empty__sub';
    sub.textContent =
      message === 'Sélectionnez un incident'
        ? 'Cliquez une ligne dans la liste ou « Voir » pour afficher la fiche, le statut et les actions liées.'
        : '';
    wrap.append(p, sub);
    detailInner.append(wrap);
  }

  async function renderDetailForIncident(inc) {
    detailInner.replaceChildren();
    const row = mapRowToDisplay(inc);
    const wrap = document.createElement('div');
    wrap.className = 'incidents-detail-filled incidents-detail-filled--premium';

    const mainSec = document.createElement('section');
    mainSec.className = 'incidents-detail-section incidents-detail-section--main';
    const mainH = document.createElement('h3');
    mainH.className = 'incidents-detail-section__title';
    mainH.textContent = 'Informations principales';
    const head = document.createElement('div');
    head.className = 'incidents-detail-head';
    const h2 = document.createElement('h2');
    h2.className = 'incidents-detail-ref';
    h2.textContent = row.ref;
    const titleEl = document.createElement('p');
    titleEl.className = 'incidents-detail-title-line';
    titleEl.textContent = row.title;
    const typeLine = document.createElement('p');
    typeLine.className = 'incidents-detail-type';
    typeLine.textContent = `${row.type} · ${row.site} · ${row.date}`;
    head.append(h2, titleEl, typeLine);

    const badges = document.createElement('div');
    badges.className = 'incidents-detail-badges';
    const badgeSev = document.createElement('span');
    badgeSev.className = `ds-badge ${severityDsBadgeClass(row.severity)}`;
    badgeSev.textContent =
      row.severity.charAt(0).toUpperCase() + row.severity.slice(1);
    badges.append(badgeSev);

    const statusBlock = document.createElement('div');
    statusBlock.className = 'incidents-detail-status';
    const lab = document.createElement('label');
    const labSpan = document.createElement('span');
    labSpan.textContent = 'Statut';
    const sel = document.createElement('select');
    sel.className = 'control-select';
    sel.disabled = !canWriteIncidents;
    if (!canWriteIncidents) {
      sel.title = 'Modification du statut réservée (écriture incidents)';
    }
    statusOptionsForSelect(row.status).forEach((opt) => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      sel.append(o);
    });
    if ([...sel.options].some((o) => o.value === row.status)) {
      sel.value = row.status;
    }
    sel.addEventListener('change', () => {
      if (sel.value !== row.status) {
        patchIncidentStatus(inc, sel.value, sel);
      }
    });
    lab.append(labSpan, sel);
    statusBlock.append(lab);
    mainSec.append(mainH, head, badges, statusBlock);

    const descSec = document.createElement('section');
    descSec.className = 'incidents-detail-section';
    const descH = document.createElement('h3');
    descH.className = 'incidents-detail-section__title';
    descH.textContent = 'Description';
    const descP = document.createElement('p');
    descP.className = 'incidents-detail-desc';
    descP.textContent = (row.description || '').trim() || '— Aucune description.';
    descSec.append(descH, descP);

    const photoSec = document.createElement('section');
    photoSec.className = 'incidents-detail-section';
    const photoH = document.createElement('h3');
    photoH.className = 'incidents-detail-section__title';
    photoH.textContent = 'Photo';
    const photoP = document.createElement('p');
    photoP.className = 'incidents-detail-muted';
    const hasPhotoMention = /📷|photo terrain|Photo signalée/i.test(row.description || '');
    photoP.textContent = hasPhotoMention
      ? 'Une mention de photo figure dans la description. Le stockage fichier n’est pas encore branché sur l’API — conserver la preuve selon votre procédure interne.'
      : 'Aucune mention de photo sur cette fiche.';
    photoSec.append(photoH, photoP);

    const aiCause = inferIncidentAiCauseProbable(row);
    const aiAction = inferIncidentAiActionRecommandee(row);
    const aiSec = document.createElement('section');
    aiSec.className = 'incidents-detail-section incidents-detail-section--ai';
    const aiH = document.createElement('h3');
    aiH.className = 'incidents-detail-section__title';
    aiH.textContent = 'Suggestions IA (assistance)';
    const aiDisclaimer = document.createElement('p');
    aiDisclaimer.className = 'incidents-detail-muted';
    aiDisclaimer.textContent =
      'Propositions générées localement (type + gravité). Elles ne sont jamais enregistrées sans action de votre part — l’API PATCH incident ne prend pas encore la description.';
    const aiGrid = document.createElement('div');
    aiGrid.className = 'incidents-ai-grid';
    const boxC = document.createElement('div');
    boxC.className = 'incidents-ai-box';
    const lc = document.createElement('span');
    lc.className = 'incidents-ai-box__label';
    lc.textContent = 'Cause probable';
    const tc = document.createElement('p');
    tc.className = 'incidents-ai-box__text';
    tc.textContent = aiCause;
    boxC.append(lc, tc);
    const boxA = document.createElement('div');
    boxA.className = 'incidents-ai-box';
    const la = document.createElement('span');
    la.className = 'incidents-ai-box__label';
    la.textContent = 'Action recommandée';
    const ta = document.createElement('p');
    ta.className = 'incidents-ai-box__text';
    ta.textContent = aiAction;
    boxA.append(la, ta);
    aiGrid.append(boxC, boxA);
    const aiFoot = document.createElement('div');
    aiFoot.className = 'incidents-ai-foot';
    const copyAiBtn = document.createElement('button');
    copyAiBtn.type = 'button';
    copyAiBtn.className = 'btn btn-secondary';
    copyAiBtn.textContent = 'Copier analyse (IA)';
    const aiDraft = `Cause probable (IA) : ${aiCause}\nAction recommandée (IA) : ${aiAction}`;
    copyAiBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(aiDraft);
        showToast('Texte copié — à coller dans votre rapport ou SI.', 'info');
      } catch {
        showToast('Copie impossible sur ce navigateur', 'error');
      }
    });
    const chkLab = document.createElement('label');
    chkLab.className = 'incidents-ai-validate';
    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.id = `inc-ai-validate-${row.ref.replace(/[^a-z0-9-]/gi, '')}`;
    const chkSpan = document.createElement('span');
    chkSpan.textContent = 'J’ai relu ces suggestions (validation humaine obligatoire avant toute décision).';
    chkLab.append(chk, chkSpan);
    aiFoot.append(copyAiBtn, chkLab);
    aiSec.append(aiH, aiDisclaimer, aiGrid, aiFoot);

    const analysisSec = document.createElement('section');
    analysisSec.className = 'incidents-detail-section';
    const anH = document.createElement('h3');
    anH.className = 'incidents-detail-section__title';
    anH.textContent = 'Analyse (brouillon local)';
    const anTa = document.createElement('textarea');
    anTa.className = 'incidents-detail-analysis-draft';
    anTa.readOnly = true;
    anTa.rows = 5;
    anTa.value = aiDraft;
    const anNote = document.createElement('p');
    anNote.className = 'incidents-detail-muted';
    anNote.textContent =
      'Non synchronisé avec le serveur — utilisez « Copier » pour votre GED / rapport. Aucune écriture automatique.';
    analysisSec.append(anH, anTa, anNote);

    const actSec = document.createElement('section');
    actSec.className = 'incidents-detail-section';
    const actH = document.createElement('h3');
    actH.className = 'incidents-detail-section__title';
    actH.textContent = 'Actions liées';
    const actHost = document.createElement('div');
    actHost.className = 'incidents-detail-actions-host';
    const actLoad = document.createElement('p');
    actLoad.className = 'incidents-detail-muted';
    actLoad.textContent = 'Chargement…';
    actHost.append(actLoad);
    actSec.append(actH, actHost);

    const foot = document.createElement('div');
    foot.className = 'incidents-detail-foot';
    const btnAct = document.createElement('button');
    btnAct.type = 'button';
    btnAct.className = 'btn btn-primary';
    btnAct.textContent = 'Créer une action liée';
    btnAct.hidden = !canWriteActions;
    btnAct.addEventListener('click', () => {
      createLinkedAction(inc);
    });
    const btnActionsPage = document.createElement('button');
    btnActionsPage.type = 'button';
    btnActionsPage.className = 'btn incidents-detail-foot__secondary';
    btnActionsPage.textContent = 'Ouvrir pilotage actions';
    btnActionsPage.addEventListener('click', () => {
      window.location.hash = 'actions';
    });
    foot.append(btnAct, btnActionsPage);

    wrap.append(mainSec, descSec, photoSec, aiSec, analysisSec, actSec, foot);
    detailInner.append(wrap);

    const linked = await fetchActionsLinkedToIncident(inc.ref);
    actHost.replaceChildren();
    if (!linked.length) {
      const empty = document.createElement('p');
      empty.className = 'incidents-detail-muted';
      empty.textContent = 'Aucune action trouvée dont le libellé ou le détail mentionne cette référence.';
      actHost.append(empty);
    } else {
      const ul = document.createElement('ul');
      ul.className = 'incidents-detail-action-list';
      linked.slice(0, 12).forEach((a) => {
        const li = document.createElement('li');
        li.className = 'incidents-detail-action-item';
        const t = document.createElement('strong');
        t.textContent = String(a.title || '—');
        const st = document.createElement('span');
        st.className = 'incidents-detail-action-status';
        st.textContent = String(a.status || '');
        li.append(t, document.createTextNode(' — '), st);
        ul.append(li);
      });
      actHost.append(ul);
      if (linked.length > 12) {
        const more = document.createElement('p');
        more.className = 'incidents-detail-muted';
        more.textContent = `… et ${linked.length - 12} autre(s) — voir pilotage actions.`;
        actHost.append(more);
      }
    }
  }

  function syncListSelectionVisual() {
    listHost.querySelectorAll('.incidents-table-row').forEach((row) => {
      row.classList.toggle('incidents-table-row--selected', row.dataset.ref === selectedRef);
    });
  }

  function activateIncidentRow(inc) {
    selectedRef = inc.ref;
    syncListSelectionVisual();
    renderDetailForIncident(inc);
  }

  function refreshPrioritiesStrip() {
    prioritiesHost.replaceChildren();
    if (apiLoadState === 'loading') {
      const p = document.createElement('p');
      p.className = 'incidents-priorities-muted';
      p.textContent = 'Chargement des priorités…';
      prioritiesHost.append(p);
      return;
    }
    if (apiLoadState === 'error' && incidentRecords.length === 0) {
      const p = document.createElement('p');
      p.className = 'incidents-priorities-muted';
      p.textContent = 'Synthèse indisponible.';
      prioritiesHost.append(p);
      return;
    }
    const critRows = sortIncidentsForDisplay(
      incidentRecords.filter((i) => i.severity === 'critique' && !isStatusClosed(i.status))
    ).slice(0, 3);
    const weekAgo = Date.now() - 7 * 86400000;
    const recentRows = sortIncidentsForDisplay(
      incidentRecords.filter((i) => (i.createdAtMs || 0) >= weekAgo)
    ).slice(0, 3);
    const grid = document.createElement('div');
    grid.className = 'incidents-priorities-grid';
    function buildCol(title, rows, emptyMsg) {
      const c = document.createElement('div');
      c.className = 'incidents-priorities-col';
      const h = document.createElement('h3');
      h.className = 'incidents-priorities-col__title';
      h.textContent = title;
      c.append(h);
      if (!rows.length) {
        const e = document.createElement('p');
        e.className = 'incidents-priorities-muted';
        e.textContent = emptyMsg;
        c.append(e);
        return c;
      }
      const ul = document.createElement('ul');
      ul.className = 'incidents-priorities-ul';
      rows.forEach((raw) => {
        const inc = mapRowToDisplay(raw);
        const li = document.createElement('li');
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'incidents-priorities-item';
        const refSpan = document.createElement('span');
        refSpan.className = 'incidents-priorities-item__ref';
        refSpan.textContent = inc.ref;
        const titleSpan = document.createElement('span');
        titleSpan.className = 'incidents-priorities-item__title';
        titleSpan.textContent = inc.title;
        b.append(refSpan, titleSpan);
        b.addEventListener('click', () => {
          const fresh = incidentRecords.find((r) => r.ref === inc.ref);
          if (fresh) activateIncidentRow(fresh);
          document.getElementById('incidents-recent-list')?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest'
          });
        });
        li.append(b);
        ul.append(li);
      });
      c.append(ul);
      return c;
    }
    grid.append(
      buildCol('Critiques ouverts', critRows, 'Aucun critique ouvert.'),
      buildCol('Récents (7 j.)', recentRows, 'Aucun incident sur 7 j.')
    );
    prioritiesHost.append(grid);
  }

  async function patchIncidentStatus(inc, newStatus, selectEl) {
    selectEl.disabled = true;
    try {
      const res = await qhseFetch(
        `/api/incidents/${encodeURIComponent(inc.ref)}`,
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
      showToast(`Statut : ${newStatus}`, 'info');
      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'incidents',
          action: 'Statut incident',
          detail: `${inc.ref} → ${newStatus}`,
          user: getSessionUser()?.name || 'Responsable QHSE'
        });
      }
      refreshList();
    } catch (err) {
      console.error('[incidents] PATCH', err);
      showToast('Erreur réseau', 'error');
      selectEl.value = inc.status;
    } finally {
      selectEl.disabled = !canWriteIncidents;
    }
  }

  function refreshList() {
    const rows = getFilteredSortedRows();
    updateHeaderStats();

    if (apiLoadState === 'ok') {
      const keepSite = filterSite;
      filSiteSel.querySelectorAll('option:not([value=""])').forEach((o) => o.remove());
      const seenSites = new Set();
      incidentRecords.forEach((r) => {
        const s = String(r.site || '').trim();
        if (s && !seenSites.has(s)) {
          seenSites.add(s);
          const o = document.createElement('option');
          o.value = s;
          o.textContent = s;
          filSiteSel.append(o);
        }
      });
      siteOptions.forEach((s) => {
        if (s && !seenSites.has(s)) {
          seenSites.add(s);
          const o = document.createElement('option');
          o.value = s;
          o.textContent = s;
          filSiteSel.append(o);
        }
      });
      if (keepSite && [...filSiteSel.options].some((o) => o.value === keepSite)) {
        filSiteSel.value = keepSite;
      } else {
        filterSite = '';
        filSiteSel.value = '';
      }
    }

    const n = rows.length;
    const total = incidentRecords.length;
    if (apiLoadState === 'loading') {
      listHeading.textContent = 'Chargement du registre…';
      listCount.textContent = '';
      listCount.hidden = true;
    } else if (apiLoadState === 'error') {
      listHeading.textContent = 'Registre indisponible';
      listCount.textContent = '';
      listCount.hidden = true;
    } else {
      listHeading.textContent = 'Consultation — registre';
      listCount.hidden = false;
      listCount.textContent =
        n === total
          ? `${n} affiché${n !== 1 ? 's' : ''}`
          : `${n} affiché${n !== 1 ? 's' : ''} / ${total}`;
    }

    listHost.replaceChildren();

    if (apiLoadState === 'loading') {
      const wrap = document.createElement('div');
      wrap.className = 'incidents-skeleton';
      const skeletonHTML = [1, 2, 3]
        .map(
          () => `
  <div class="skeleton-card">
    <div class="skeleton-line skeleton-line--title"></div>
    <div class="skeleton-line skeleton-line--sub"></div>
    <div class="skeleton-line skeleton-line--meta"></div>
  </div>
`
        )
        .join('');
      wrap.innerHTML = skeletonHTML;
      listHost.append(wrap);
      refreshAnalytics();
      refreshPrioritiesStrip();
      return;
    }

    if (apiLoadState === 'error' && incidentRecords.length === 0) {
      const wrap = document.createElement('div');
      wrap.className = 'incidents-empty';
      const t = document.createElement('p');
      t.className = 'incidents-empty__title';
      t.textContent = 'Liste indisponible';
      const s = document.createElement('p');
      s.className = 'incidents-empty__sub';
      s.textContent =
        'Vérifiez que l’API tourne et que le navigateur peut l’atteindre (ex. http://localhost:5173 avec backend actif).';
      wrap.append(t, s);
      listHost.append(wrap);
      refreshAnalytics();
      refreshPrioritiesStrip();
      return;
    }

    if (apiLoadState === 'ok' && incidentRecords.length === 0) {
      const wrap = document.createElement('div');
      wrap.className = 'incidents-empty';
      wrap.innerHTML = `
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none"
    stroke="currentColor" stroke-width="1.5"
    style="opacity:.35;color:var(--text2)">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94
             a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
    <path d="M12 9v4"/><path d="M12 17h.01"/>
  </svg>
  <p class="incidents-empty__title">Aucun incident enregistré</p>
  <p class="incidents-empty__sub">
    Déclarez le premier incident de votre périmètre.
  </p>
  <button type="button" class="btn btn-primary incidents-empty__cta">
    Déclarer un incident
  </button>
`;
      const emptyCta = wrap.querySelector('.incidents-empty__cta');
      if (emptyCta) emptyCta.addEventListener('click', () => slideOver.open(quick));
      listHost.append(wrap);
      refreshAnalytics();
      refreshPrioritiesStrip();
      return;
    }

    if (apiLoadState === 'ok' && rows.length === 0 && incidentRecords.length > 0) {
      const wrap = document.createElement('div');
      wrap.className = 'incidents-empty';
      const t = document.createElement('p');
      t.className = 'incidents-empty__title';
      t.textContent = 'Aucun résultat';
      const s = document.createElement('p');
      s.className = 'incidents-empty__sub';
      s.textContent =
        'Ajustez les filtres (statut, gravité, période) pour retrouver des fiches dans le registre.';
      wrap.append(t, s);
      listHost.append(wrap);
      refreshAnalytics();
      refreshPrioritiesStrip();
      return;
    }

    const displayRows = rows.map((r) => mapRowToDisplay(r));
    const scroll = document.createElement('div');
    scroll.className = 'incidents-table-scroll';
    const table = document.createElement('table');
    table.className = 'incidents-table-premium';
    const thead = document.createElement('thead');
    const thr = document.createElement('tr');
    ['Incident', 'Gravité', 'Statut', 'Date', 'Site', ''].forEach((lab) => {
      const th = document.createElement('th');
      th.textContent = lab;
      thr.append(th);
    });
    thead.append(thr);
    const tbody = document.createElement('tbody');
    displayRows.forEach((inc) => {
      tbody.append(
        buildIncidentTableRow(inc, {
          onSelect: (i) => activateIncidentRow(i),
          onDetail: (i) => activateIncidentRow(i),
          onCreateAction: async (i) => {
            await createLinkedAction(i);
          },
          canWriteActions
        })
      );
    });
    table.append(thead, tbody);
    scroll.append(table);
    listHost.append(scroll);
    syncListSelectionVisual();
    if (selectedRef) {
      const fresh = incidentRecords.find((r) => r.ref === selectedRef);
      if (fresh) {
        renderDetailForIncident(mapRowToDisplay(fresh));
      } else {
        selectedRef = null;
        renderDetailEmpty('Sélectionnez un incident');
      }
    }
    refreshAnalytics();
    refreshPrioritiesStrip();
  }

  try {
    renderDetailEmpty('Sélectionnez un incident');
    refreshList();
  } catch (err) {
    console.error('[incidents] rendu initial du registre', err);
  }

  (async function loadIncidentsFromApi() {
    try {
      const res = await qhseFetch(withSiteQuery('/api/incidents?limit=500'));
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data = await res.json();
      const rows = Array.isArray(data) ? data : [];
      incidentRecords = rows.map(mapApiIncident).filter(Boolean);
      apiLoadState = 'ok';
      refreshList();
    } catch (err) {
      console.error('[incidents] GET /api/incidents', err);
      showToast('Erreur serveur', 'error');
      incidentRecords = [];
      apiLoadState = 'error';
      refreshList();
    }
  })();

  ensureUsersCached().catch(() => {});

  submitBtn.addEventListener('click', async () => {
    const type = typeSelect.value.trim();
    const site = siteSelect.value.trim();

    if (!type || !site) {
      showToast('Type et site obligatoires', 'error');
      return;
    }

    const sev = severity.getValue();
    const descRaw = (descInput.value || '').trim();
    const dateNote =
      dateFactsInput.value && typeof dateFactsInput.value === 'string'
        ? `Faits le ${formatIsoDateToFr(dateFactsInput.value)}. `
        : '';
    const locPart = locInput.value.trim()
      ? `[Lieu précis] ${locInput.value.trim()}\n`
      : '';
    const hasPhoto = !!(photoInput.files && photoInput.files.length);
    const photoPart = hasPhoto
      ? '📷 Photo terrain signalée (média non stocké sur le serveur dans cette version).\n'
      : '';
    const riskTitlePick = riskSelect.value.trim();
    const riskPart = riskTitlePick ? `\n\n${formatRiskLinkTag(riskTitlePick)}` : '';
    const detailText = (dateNote + locPart + photoPart + descRaw + riskPart).trim();
    const detailForLog = detailText || 'Sans description';

    const ref = computeNextRef(incidentRecords);

    submitBtn.disabled = true;
    try {
      const res = await qhseFetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ref,
          type,
          site,
          severity: sev,
          description: detailText || undefined,
          status: 'Nouveau',
          ...(siteSelect.selectedOptions[0]?.dataset.siteId
            ? { siteId: siteSelect.selectedOptions[0].dataset.siteId }
            : {})
        })
      });

      if (!res.ok) {
        try {
          const body = await res.json();
          console.error('[incidents] POST /api/incidents', res.status, body);
        } catch {
          console.error('[incidents] POST /api/incidents', res.status);
        }
        showToast('Erreur serveur', 'error');
        return;
      }

      const created = await res.json();
      const entry = mapApiIncident(created);
      if (!entry) {
        console.error('[incidents] réponse POST invalide', created);
        showToast('Erreur serveur', 'error');
        return;
      }
      incidentRecords = [entry, ...incidentRecords.filter((r) => r.ref !== entry.ref)];
      apiLoadState = 'ok';
      refreshList();
      slideOver.close();

      if (typeof onAddLog === 'function') {
        onAddLog({
          module: 'incidents',
          action: 'Incident déclaré',
          detail: `${ref} · ${type} · ${site} · ${sev} — ${detailForLog.slice(0, 80)}${detailForLog.length > 80 ? '…' : ''}`,
          user: 'Agent terrain'
        });
      }

      showToast(`Incident enregistré : ${ref}`, 'info');
      descInput.value = '';
      locInput.value = '';
      photoInput.value = '';
      photoPreview.replaceChildren();
      severity.setValue('moyen');
      typeSelect.value = '';
      chipByType.forEach((btn) => btn.classList.remove('incidents-rapid-chip--on'));
      try {
        dateFactsInput.valueAsDate = new Date();
      } catch {
        dateFactsInput.value = '';
      }
      await fillIncidentSiteSelect();
      fillIncidentRiskSelect();
      riskSelect.value = '';
      setWizardStep(0);

      setTimeout(() => {
        document.getElementById('incidents-recent-list')?.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }, 0);
    } catch (err) {
      console.error('[incidents] POST /api/incidents', err);
      showToast('Erreur serveur', 'error');
    } finally {
      submitBtn.disabled = !canDeclare;
      if (canDeclare) syncNav();
    }
  });

  return page;
}
