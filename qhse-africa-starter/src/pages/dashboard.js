import { pageTopbarById } from '../data/navigation.js';
import { getSessionUser } from '../data/sessionUser.js';
import { createDashboardTodayBlock } from '../components/dashboardTodayBlock.js';
import { appState } from '../utils/state.js';
import { showToast } from '../components/toast.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { createDashboardCeoHero } from '../components/dashboardCeoHero.js';
import { createDashboardAlertsPriorites } from '../components/dashboardAlertsPriorites.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { getApiBase } from '../config.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import {
  buildIncidentMonthlySeries,
  buildAuditScoreSeriesFromAudits,
  buildTopIncidentTypes,
  classifyActionsForMix,
  createActionsMixChart,
  createDashboardLineChart,
  createIncidentTypeBreakdown,
  createPilotageLoadMixChart
} from '../components/dashboardCharts.js';
import { createDashboardAuditChartBlock } from '../components/dashboardAuditChartBlock.js';
import { createDashboardActivitySection } from '../components/dashboardActivity.js';
import { createDashboardCockpit } from '../components/dashboardCockpit.js';
import { createDashboardCockpitPremium } from '../components/dashboardCockpitPremium.js';
import { createDashboardShortcutsSection } from '../components/dashboardShortcuts.js';
import { createDashboardSystemStatus } from '../components/dashboardSystemStatus.js';
import { createDashboardVigilancePoints } from '../components/dashboardVigilancePoints.js';
import { createDashboardAutoAnalysis } from '../components/dashboardAutoAnalysis.js';
import { createDashboardPriorityNow } from '../components/dashboardPriorityNow.js';
import { createDashboardPilotageAssistant } from '../components/dashboardPilotageAssistant.js';
import { buildAssistantSnapshot } from '../services/qhsePilotageIntelligence.service.js';
import { createDashboardBlockActions } from '../utils/dashboardBlockActions.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';
import { createKpiDetailDrawer } from '../components/kpiDetailDrawer.js';
import { isActionOverdueDashboardRow } from '../utils/actionOverdueDashboard.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

const DASH_DECISION_STYLE_ID = 'qhse-dashboard-decision-styles';

function ensureDashboardDecisionStyles() {
  if (document.getElementById(DASH_DECISION_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = DASH_DECISION_STYLE_ID;
  el.textContent = `
.dashboard-decision-alerts{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.dashboard-decision-alert{padding:12px;border-radius:12px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary);transition:transform .18s ease,box-shadow .18s ease}
.dashboard-decision-alert:hover{transform:translateY(-1px)}
.dashboard-decision-alert--green{border-color:rgba(34,197,94,.35)}
.dashboard-decision-alert--orange{border-color:rgba(251,146,60,.4)}
.dashboard-decision-alert--red{border-color:rgba(239,68,68,.5);box-shadow:0 0 0 1px rgba(239,68,68,.25),0 10px 24px rgba(239,68,68,.15)}
.dashboard-decision-alert__k{font-size:11px;color:var(--text3)}
.dashboard-decision-alert__v{font-size:20px;font-weight:800}
.dashboard-decision-grid{display:grid;grid-template-columns:1.25fr .9fr;gap:12px}
.dashboard-decision-chart-card canvas{max-height:220px}
.dashboard-decision-ia,.dashboard-decision-priority{padding:12px;border:1px solid var(--color-border-tertiary);border-radius:12px;background:var(--color-background-secondary)}
.dashboard-decision-ia ul,.dashboard-decision-priority ul{margin:0;padding-left:18px;display:grid;gap:6px}
.dashboard-kpi-card--crit{box-shadow:0 0 0 1px rgba(239,68,68,.28),0 0 22px rgba(239,68,68,.16)}
@media (max-width:980px){.dashboard-decision-alerts{grid-template-columns:1fr}.dashboard-decision-grid{grid-template-columns:1fr}}
`;
  document.head.append(el);
}

function toneByValue(value, warn = 1, crit = 3) {
  const n = Number(value) || 0;
  if (n >= crit) return 'red';
  if (n >= warn) return 'orange';
  return 'green';
}

function upsertKpiFilterModal() {
  let d = document.getElementById('qhse-kpi-filter-modal');
  if (d) return d;
  d = document.createElement('dialog');
  d.id = 'qhse-kpi-filter-modal';
  d.className = 'kpi-detail-drawer';
  document.body.append(d);
  return d;
}

/**
 * Listes chargées par le dashboard — référence stable pour le drawer KPI (pas de re-fetch).
 * @type {{ incidents: unknown[]; actions: unknown[]; audits: unknown[]; ncs: unknown[] }}
 */
const kpiDashboardLists = { incidents: [], actions: [], audits: [], ncs: [] };
/** @type {{ open: (k: string) => void; element: HTMLDialogElement } | null} */
let kpiDetailDrawerSingleton = null;

const KPI_SPECS = [
  { key: 'incidents', label: 'Incidents', note: 'Total déclarés (périmètre)', tone: 'amber' },
  { key: 'ncOpen', label: 'NC ouvertes', note: 'Non clos — détail après chargement', tone: 'amber' },
  {
    key: 'actionsLate',
    label: 'Actions en retard',
    note: 'Échéance dépassée ou statut « retard » (hors clôturées)',
    tone: 'red'
  },
  { key: 'actions', label: 'Actions (total)', note: 'En base sur le périmètre', tone: 'blue' },
  { key: 'auditScore', label: 'Score moyen audits', note: 'Moyenne sur audits récents', tone: 'green' },
  { key: 'auditsN', label: 'Audits (liste)', note: 'Nombre sur cette vue', tone: 'blue' }
];

function formatDateForMeta(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch {
    return '—';
  }
}

function formatDashboardCount(v) {
  return typeof v === 'number' && !Number.isNaN(v) ? String(v) : '—';
}

/** Bandeau titre cockpit — aligné sur pageTopbarById.dashboard (cohérence topbar / page). */
function createDashboardShellIntro() {
  const dashMeta = pageTopbarById.dashboard;
  if (!dashMeta) return null;
  const pageIntro = document.createElement('div');
  pageIntro.className = 'page-intro module-page-hero dashboard-page-shell-intro';
  const inner = document.createElement('div');
  inner.className = 'module-page-hero__inner';
  if (dashMeta.kicker) {
    const k = document.createElement('p');
    k.className = 'page-intro__kicker section-kicker';
    k.textContent = dashMeta.kicker;
    inner.append(k);
  }
  const h = document.createElement('h1');
  h.className = 'page-intro__title';
  h.textContent = dashMeta.title;
  inner.append(h);
  if (dashMeta.subtitle) {
    const p = document.createElement('p');
    p.className = 'page-intro__desc';
    p.textContent = dashMeta.subtitle;
    inner.append(p);
  }
  if (dashMeta.cta?.label && dashMeta.cta?.pageId) {
    const actions = document.createElement('div');
    actions.className = 'page-intro__actions';
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'btn btn-primary';
    btn.textContent = dashMeta.cta.label;
    btn.addEventListener('click', () => {
      window.location.hash = dashMeta.cta.pageId;
    });
    actions.append(btn);
    inner.append(actions);
  }
  pageIntro.append(inner);
  return pageIntro;
}

function asDashboardCount(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function normalizeDashboardPayload(raw) {
  if (raw == null || typeof raw !== 'object' || Array.isArray(raw)) return null;
  return {
    incidents: asDashboardCount(raw.incidents),
    actions: asDashboardCount(raw.actions),
    overdueActions: asDashboardCount(raw.overdueActions),
    nonConformities: asDashboardCount(raw.nonConformities),
    criticalIncidents: Array.isArray(raw.criticalIncidents) ? raw.criticalIncidents : [],
    overdueActionItems: Array.isArray(raw.overdueActionItems) ? raw.overdueActionItems : []
  };
}

function isNcOpen(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
  return true;
}

async function fetchJsonList(path) {
  try {
    const res = await qhseFetch(withSiteQuery(path));
    if (!res.ok) return null;
    const j = await res.json().catch(() => null);
    return Array.isArray(j) ? j : null;
  } catch (err) {
    console.warn('[dashboard] fetchJsonList', path, err);
    return null;
  }
}

/**
 * Quelques tentatives — le serveur peut redémarrer (node --watch) ou être lent au démarrage.
 * @param {string} path
 * @param {{ attempts?: number; delayMs?: number }} [opts]
 */
async function fetchJsonListWithRetry(path, { attempts = 4, delayMs = 300 } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    const data = await fetchJsonList(path);
    if (data != null) return data;
    if (i < attempts - 1) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return null;
}

/**
 * Stats de secours quand GET /api/dashboard/stats échoue mais les listes répondent
 * (évite tableau de bord « vide » et journal d’activité figé).
 * @param {object[]} incidents
 * @param {object[]} actions
 * @param {object[]} ncs
 */
function deriveDashboardStatsFromLists(incidents, actions, ncs) {
  const inc = Array.isArray(incidents) ? incidents : [];
  const act = Array.isArray(actions) ? actions : [];
  const ncList = Array.isArray(ncs) ? ncs : [];
  const criticalIncidents = inc
    .filter((row) => String(row?.severity || '').toLowerCase().includes('critique'))
    .slice(0, 5)
    .map(({ severity: _s, ...rest }) => rest);
  const overdueActionItems = act
    .filter((row) => isActionOverdueDashboardRow(row))
    .slice(0, 5)
    .map((row) => ({
      title: row.title,
      detail: row.detail ?? null,
      status: row.status,
      owner: row.owner ?? null,
      dueDate: row.dueDate ?? null,
      createdAt: row.createdAt ?? null
    }));
  return {
    incidents: inc.length,
    actions: act.length,
    overdueActions: act.filter((row) => isActionOverdueDashboardRow(row)).length,
    nonConformities: ncList.filter((r) => isNcOpen(r)).length,
    criticalIncidents,
    overdueActionItems
  };
}

/**
 * Plusieurs tentatives si le réseau échoue (démarrage concurrent api + web avec `npm run dev`).
 */
async function qhseFetchWithNetworkRetry(path, { attempts = 8, delayMs = 350 } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await qhseFetch(path);
    } catch (err) {
      lastErr = err;
      if (i < attempts - 1) {
        await new Promise((r) => setTimeout(r, delayMs));
      }
    }
  }
  throw lastErr;
}

function makeChartCard(kicker, title, lead, extraCardClass = '') {
  const card = document.createElement('article');
  card.className = [
    'content-card',
    'card-soft',
    'dashboard-chart-card',
    'dashboard-chart-card-inner',
    extraCardClass
  ]
    .filter(Boolean)
    .join(' ');
  const head = document.createElement('div');
  head.className = 'content-card-head dashboard-chart-card-head';
  const leadBlock =
    lead && String(lead).trim()
      ? `<p class="dashboard-muted-lead dashboard-chart-lead">${escapeHtml(lead)}</p>`
      : '';
  head.innerHTML = `
    <div>
      <div class="section-kicker">${escapeHtml(kicker)}</div>
      <h3 class="dashboard-chart-h">${escapeHtml(title)}</h3>
      ${leadBlock}
    </div>
  `;
  const body = document.createElement('div');
  body.className = 'dashboard-chart-body';
  card.append(head, body);
  return { card, body };
}

function makeSectionHeader(kicker, title, sub) {
  const head = document.createElement('header');
  head.className = 'dashboard-section-head';
  const k = document.createElement('span');
  k.className = 'dashboard-section-kicker';
  k.textContent = kicker;
  const h = document.createElement('h2');
  h.className = 'dashboard-section-title';
  h.textContent = title;
  head.append(k, h);
  if (sub) {
    const p = document.createElement('p');
    p.className = 'dashboard-section-sub';
    p.textContent = sub;
    head.append(p);
  }
  return head;
}

/**
 * Bandeau visible (centré) quand l’API n’est pas joignable — complète le toast.
 * @param {HTMLElement} slot
 */
function showDashboardConnectivityError(slot) {
  slot.hidden = false;
  slot.replaceChildren();
  const apiBase = getApiBase();

  const card = document.createElement('article');
  card.className = 'content-card card-soft dashboard-connectivity-card';
  card.setAttribute('role', 'alert');
  card.setAttribute('aria-live', 'polite');

  const title = document.createElement('h3');
  title.className = 'dashboard-connectivity-title';
  title.textContent = 'Connexion au serveur impossible';

  const lead = document.createElement('p');
  lead.className = 'dashboard-connectivity-lead';
  lead.textContent =
    'Le tableau de bord a besoin du backend (API). Sans lui, les données ne peuvent pas s’afficher.';

  const apiLabel = document.createElement('p');
  apiLabel.className = 'dashboard-connectivity-api-label';
  apiLabel.textContent = 'URL API utilisée par l’application :';

  const apiCode = document.createElement('code');
  apiCode.className = 'dashboard-connectivity-code';
  apiCode.textContent = apiBase;

  const urlHint = document.createElement('p');
  urlHint.className = 'dashboard-connectivity-urlhint';
  urlHint.textContent =
    'Ouvrez l’application via http://localhost:5173 (terminal « vite » avec npm run dev). Ne pas ouvrir index.html en double-clic depuis l’explorateur.';

  /** @type {HTMLElement[]} */
  const urlExtra = [];
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    const fileWarn = document.createElement('p');
    fileWarn.className = 'dashboard-connectivity-filewarn';
    fileWarn.textContent =
      'Vous utilisez un fichier local (file://) : le navigateur ne peut pas joindre l’API. Ouvrez http://localhost:5173 dans la barre d’adresse.';
    urlExtra.push(fileWarn);
  }

  const actions = document.createElement('div');
  actions.className = 'dashboard-connectivity-actions';
  const retryBtn = document.createElement('button');
  retryBtn.type = 'button';
  retryBtn.className = 'btn btn-primary dashboard-connectivity-retry';
  retryBtn.textContent = 'Réessayer (recharger la page)';
  retryBtn.addEventListener('click', () => {
    window.location.reload();
  });
  actions.append(retryBtn);

  const steps = document.createElement('ol');
  steps.className = 'dashboard-connectivity-steps';
  const li1 = document.createElement('li');
  li1.textContent =
    'Ouvrez un terminal dans le dossier qui contient le sous-dossier « qhse-africa-starter », puis : npm run dev (API + front) ou npm run dev:api. Si vous êtes déjà dans qhse-africa-starter : npm run dev --prefix backend.';
  const li2 = document.createElement('li');
  li2.textContent =
    'npm run dev --prefix backend ne marche que si le terminal est dans le dossier qhse-africa-starter (le backend est dans qhse-africa-starter/backend).';
  const li3 = document.createElement('li');
  li3.textContent =
    'Dans ce navigateur, testez http://127.0.0.1:3001/api/health — si ça ne s’affiche pas, un pare-feu ou l’aperçu intégré bloque l’accès : ouvrez l’app dans Chrome ou Edge (http://localhost:5173).';
  const li4 = document.createElement('li');
  li4.textContent =
    'Si l’API tourne ailleurs, définissez window.__QHSE_API_BASE__ avant le chargement de l’app (voir src/config.js).';
  steps.append(li1, li2, li3, li4);

  card.append(title, lead, apiLabel, apiCode, urlHint, ...urlExtra, actions, steps);
  slot.append(card);
}

export function renderDashboard() {
  ensureDashboardStyles();
  ensureDashboardDecisionStyles();

  const siteName = appState.currentSite || 'Tous sites';

  function exportDirectionToast() {
    showToast('Export direction (PDF / Excel) : à brancher sur le SI — démo.', 'info');
  }

  const ceoHero = createDashboardCeoHero(siteName, {
    onExport: exportDirectionToast,
    onOpenAuditTrendPoint: ({ label, value }) => {
      showToast(`Audits ${label} · ${value}%`, 'info');
      window.location.hash = 'audits';
    }
  });

  const page = document.createElement('section');
  page.className = 'page-stack dashboard-page';

  const shellIntro = createDashboardShellIntro();

  const simpleGuide = createSimpleModeGuide({
    title: 'Vue du jour — l’essentiel en premier',
    hint: 'Lecture du haut vers le bas : signaux critiques, score QHSE, cockpit, actions immédiates — puis indicateurs détaillés.',
    nextStep: 'Dépliez « Indicateurs & graphiques » pour la synthèse système et les courbes ; l’activité récente reste en bas de page.'
  });
  page.prepend(simpleGuide);
  if (shellIntro) {
    page.insertBefore(shellIntro, simpleGuide);
  }

  const bandCeo = document.createElement('div');
  bandCeo.className = 'dashboard-band dashboard-band--ceo';
  bandCeo.append(ceoHero.root);

  const connectivitySlot = document.createElement('div');
  connectivitySlot.className = 'dashboard-connectivity-slot';
  connectivitySlot.hidden = true;

  const cockpit = createDashboardCockpit();

  const alertsSection = document.createElement('section');
  alertsSection.className = 'dashboard-section';
  const alertsPrio = createDashboardAlertsPriorites();
  alertsSection.append(
    makeSectionHeader(
      'Alertes',
      'Signaux par criticité',
      'Signaux faibles et tendances'
    ),
    alertsPrio.root
  );

  const bandCriticalAlerts = document.createElement('div');
  bandCriticalAlerts.className = 'dashboard-band dashboard-band--alerts dashboard-band--alerts-first';
  bandCriticalAlerts.append(alertsSection);

  const decisionAlertsBand = document.createElement('section');
  decisionAlertsBand.className = 'dashboard-section';
  const decisionAlerts = document.createElement('div');
  decisionAlerts.className = 'dashboard-decision-alerts';
  decisionAlertsBand.append(
    makeSectionHeader('Décision', 'Alertes critiques dynamiques', 'Synthèse prioritaire en temps réel.'),
    decisionAlerts
  );
  let lastStats = {
    incidents: 0,
    actions: 0,
    overdueActions: 0,
    nonConformities: 0,
    criticalIncidents: [],
    overdueActionItems: []
  };
  let dashboardNcListForKpi = [];
  alertsPrio.update({ stats: lastStats, ncs: [], audits: [] });

  const shortcutsBundle = createDashboardShortcutsSection({
    onExportDirection: exportDirectionToast,
    overdueCount: 0,
    ncCount: 0
  });
  const shortcutsSection = shortcutsBundle.root;

  const todayBlock = createDashboardTodayBlock({
    sessionUser: getSessionUser(),
    incidents: 0,
    overdueActionItems: lastStats.overdueActionItems ?? [],
    criticalIncidents: lastStats.criticalIncidents ?? []
  });

  const bandToday = document.createElement('div');
  bandToday.className = 'dashboard-band dashboard-band--today-snapshot';
  bandToday.append(todayBlock);

  const priorityNow = createDashboardPriorityNow();
  priorityNow.update({ stats: lastStats, ncs: [], audits: [] });

  const bandPriority = document.createElement('div');
  bandPriority.className = 'dashboard-band dashboard-band--priority';
  bandPriority.append(priorityNow.root);

  const cockpitPremium = createDashboardCockpitPremium({
    data: lastStats,
    incidents: [],
    actions: [],
    audits: [],
    ncs: [],
    sessionUser: getSessionUser()
  });

  const pilotageAssistant = createDashboardPilotageAssistant({
    onActivateRecommendation: (rec) => {
      if (rec?.navigateHash) {
        window.location.hash = rec.navigateHash;
      }
      if (rec?.dialogDefaults) {
        void (async () => {
          const [{ openActionCreateDialog }, { fetchUsers }] = await Promise.all([
            import('../components/actionCreateDialog.js'),
            import('../services/users.service.js')
          ]);
          const users = await fetchUsers().catch(() => []);
          openActionCreateDialog({
            users,
            defaults: rec.dialogDefaults,
            onCreated: () => {
              showToast('Action créée depuis l’assistant de pilotage.', 'success');
            }
          });
        })();
      }
    }
  });
  const bandAssistant = document.createElement('div');
  bandAssistant.className = 'dashboard-band dashboard-band--assistant';
  bandAssistant.append(pilotageAssistant.root);

  const bandCockpit = document.createElement('div');
  bandCockpit.className = 'dashboard-band dashboard-band--cockpit';
  bandCockpit.append(cockpit.root);

  const bandShortcuts = document.createElement('div');
  bandShortcuts.className = 'dashboard-band dashboard-band--shortcuts';
  bandShortcuts.append(shortcutsSection);

  const extendedSection = document.createElement('div');
  extendedSection.className = 'dashboard-extended';
  const savedState = localStorage.getItem('dashboard-extended');
  extendedSection.dataset.expanded = savedState ?? 'true';

  const toggleRow = document.createElement('div');
  toggleRow.className = 'dashboard-toggle-row';
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'dashboard-toggle-btn';
  toggleBtn.innerHTML = `
  <span class="dashboard-toggle-label">Indicateurs & graphiques</span>
  <span class="dashboard-toggle-icon" aria-hidden="true">▾</span>
`;
  toggleRow.append(toggleBtn);

  const initExpanded = localStorage.getItem('dashboard-extended') ?? 'true';
  const toggleIcon = toggleBtn.querySelector('.dashboard-toggle-icon');
  if (toggleIcon) toggleIcon.textContent = initExpanded === 'true' ? '▾' : '▸';

  toggleBtn.addEventListener('click', () => {
    const isExpanded = extendedSection.dataset.expanded === 'true';
    extendedSection.dataset.expanded = isExpanded ? 'false' : 'true';
    const ic = toggleBtn.querySelector('.dashboard-toggle-icon');
    if (ic) ic.textContent = isExpanded ? '▸' : '▾';
    localStorage.setItem('dashboard-extended', isExpanded ? 'false' : 'true');
  });

  const systemSection = document.createElement('section');
  systemSection.className = 'dashboard-section';
  const systemStatus = createDashboardSystemStatus();
  systemSection.append(
    makeSectionHeader(
      'Synthèse',
      'État du système QHSE',
      'Lecture direction — maîtrise et vigilance.'
    ),
    systemStatus.root
  );
  systemStatus.update({
    stats: lastStats,
    incidents: [],
    actions: [],
    audits: [],
    ncs: []
  });

  const vigilanceSection = document.createElement('section');
  vigilanceSection.className = 'dashboard-section';
  const vigilance = createDashboardVigilancePoints();
  vigilanceSection.append(
    makeSectionHeader('Veille', 'Points de vigilance', ''),
    vigilance.root
  );
  vigilance.update({
    stats: lastStats,
    incidents: [],
    actions: [],
    audits: [],
    ncs: []
  });

  const bandSecondary = document.createElement('div');
  bandSecondary.className = 'dashboard-band dashboard-band--secondary';
  bandSecondary.append(vigilanceSection);

  const autoAnalysisSection = document.createElement('section');
  autoAnalysisSection.className = 'dashboard-section';
  const autoAnalysis = createDashboardAutoAnalysis();
  autoAnalysisSection.append(
    makeSectionHeader('Pilotage', 'Décisions recommandées', null),
    autoAnalysis.root
  );
  autoAnalysis.update({
    stats: lastStats,
    incidents: [],
    ncs: []
  });

  const bandAnalysisLecture = document.createElement('div');
  bandAnalysisLecture.className = 'dashboard-band dashboard-band--analysis';
  bandAnalysisLecture.append(autoAnalysisSection);

  /** @type {Record<string, HTMLDivElement>} */
  const kpiValues = {};
  /** @type {Record<string, HTMLDivElement>} */
  const kpiNotes = {};
  if (!kpiDetailDrawerSingleton) {
    kpiDetailDrawerSingleton = createKpiDetailDrawer({
      getData: () => kpiDashboardLists
    });
    kpiDetailDrawerSingleton.element.id = 'qhse-kpi-detail-dialog';
    document.body.append(kpiDetailDrawerSingleton.element);
  }
  const kpiGrid = document.createElement('section');
  kpiGrid.className = 'kpi-grid dashboard-kpi-grid';
  KPI_SPECS.forEach((spec) => {
    const card = document.createElement('article');
    card.className =
      'metric-card card-soft dashboard-kpi-card dashboard-kpi-card--interactive';
    card.setAttribute('role', 'button');
    card.setAttribute('tabindex', '0');
    card.setAttribute(
      'aria-label',
      `${spec.label} — ouvrir le détail (recherche et filtres)`
    );
    card.title = 'Cliquer : liste détaillée, filtres, tri — Entrée ou Espace au clavier';
    const label = document.createElement('div');
    label.className = 'metric-label';
    label.textContent = spec.label;
    const value = document.createElement('div');
    value.className = `metric-value ${spec.tone}`;
    value.textContent = '—';
    kpiValues[spec.key] = value;
    const note = document.createElement('div');
    note.className = 'metric-note';
    note.textContent = spec.note;
    if (spec.key === 'ncOpen') {
      kpiNotes.ncOpen = note;
    }
    card.append(label, value, note);
    card.addEventListener('click', () => renderKpiFilteredModal(spec.key));
    card.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter' || ev.key === ' ') {
        ev.preventDefault();
        renderKpiFilteredModal(spec.key);
      }
    });
    kpiGrid.append(card);
  });

  const kpiStickyWrap = document.createElement('div');
  kpiStickyWrap.className = 'dashboard-kpi-sticky';
  kpiStickyWrap.append(kpiGrid);

  const kpiPriorityLine = document.createElement('p');
  kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--ok';
  kpiPriorityLine.textContent = '';

  const kpiSection = document.createElement('section');
  kpiSection.className = 'dashboard-section dashboard-section--kpi-pilotage';
  const kpiQuick = createDashboardBlockActions(
    [
      { label: 'Détail incidents', pageId: 'incidents' },
      { label: 'Détail actions', pageId: 'actions' }
    ],
    { className: 'dashboard-block-actions dashboard-block-actions--tight' }
  );
  const kpiFoot = document.createElement('div');
  kpiFoot.className = 'dashboard-kpi-foot';
  if (kpiQuick) kpiFoot.append(kpiQuick);

  kpiSection.append(
    makeSectionHeader('Vue d’ensemble', 'Indicateurs clés', null),
    kpiStickyWrap,
    kpiPriorityLine,
    ...(kpiQuick ? [kpiFoot] : [])
  );

  const chartsSection = document.createElement('section');
  chartsSection.className = 'dashboard-section dashboard-section--charts';

  const disclaimer = document.createElement('p');
  disclaimer.className = 'dashboard-charts-disclaimer';
  disclaimer.innerHTML = '';

  const chartsGrid = document.createElement('div');
  chartsGrid.className = 'dashboard-charts-grid';

  const lineCard = makeChartCard('Tendance', 'Incidents (6 mois)', '', 'dashboard-chart-card--dash-trend');
  lineCard.body.append(
    createDashboardLineChart(buildIncidentMonthlySeries([]), { lineTheme: 'incidents' })
  );

  const mixCard = makeChartCard('Actions', 'Statuts', '', 'dashboard-chart-card--dash-mix');
  mixCard.body.append(createActionsMixChart({ overdue: 0, done: 0, other: 0 }));

  const typeCard = makeChartCard('Incidents', 'Types', '', 'dashboard-chart-card--dash-types');
  typeCard.body.append(createIncidentTypeBreakdown([]));

  const auditScoreCard = makeChartCard('Audits', 'Scores', '', 'dashboard-chart-card--dash-audit');
  const auditCharts = createDashboardAuditChartBlock();
  auditScoreCard.body.append(auditCharts.root);

  const pilotLoadCard = makeChartCard('Charge', 'Critique · retards · NC', '', 'dashboard-chart-card--dash-load');
  pilotLoadCard.body.append(
    createPilotageLoadMixChart({
      criticalIncidents: Array.isArray(lastStats.criticalIncidents)
        ? lastStats.criticalIncidents.length
        : 0,
      overdueActions: asDashboardCount(lastStats.overdueActions),
      ncOpen: 0
    })
  );

  chartsGrid.append(lineCard.card, typeCard.card, mixCard.card, auditScoreCard.card, pilotLoadCard.card);

  const chartsGlobalActs = document.createElement('div');
  chartsGlobalActs.className = 'dashboard-charts-global-actions';
  const chartsQuickRow = createDashboardBlockActions(
    [
      { label: 'Voir les incidents', pageId: 'incidents' },
      { label: 'Ouvrir le plan d’actions', pageId: 'actions' }
    ],
    { className: 'dashboard-block-actions dashboard-block-actions--tight' }
  );
  if (chartsQuickRow) chartsGlobalActs.append(chartsQuickRow);

  chartsSection.append(
    makeSectionHeader('Analyses', 'Graphiques', null),
    disclaimer,
    chartsGrid,
    ...(chartsQuickRow ? [chartsGlobalActs] : [])
  );

  const decisionSection = document.createElement('section');
  decisionSection.className = 'dashboard-section';
  const decisionGrid = document.createElement('div');
  decisionGrid.className = 'dashboard-decision-grid';
  const decisionChartCard = document.createElement('article');
  decisionChartCard.className = 'content-card card-soft dashboard-decision-chart-card';
  decisionChartCard.innerHTML = `
    <div class="content-card-head"><div><div class="section-kicker">Chart.js</div><h3>Vue décisionnelle</h3></div></div>
    <div class="dashboard-decision-chart-card"><canvas data-dc-inc></canvas></div>
    <div class="dashboard-decision-chart-card"><canvas data-dc-risk></canvas></div>
    <div class="dashboard-decision-chart-card"><canvas data-dc-score></canvas></div>
  `;
  const side = document.createElement('div');
  side.className = 'dashboard-decision-side';
  const iaBlock = document.createElement('article');
  iaBlock.className = 'dashboard-decision-ia';
  iaBlock.innerHTML = `<div class="section-kicker">IA</div><h3 style="margin:4px 0 8px">Détection dérives & recommandations</h3><ul data-dc-ia></ul>`;
  const priorityBlock = document.createElement('article');
  priorityBlock.className = 'dashboard-decision-priority';
  priorityBlock.innerHTML = `<div class="section-kicker">Priorités</div><h3 style="margin:4px 0 8px">Actions prioritaires</h3><ul data-dc-prio></ul>`;
  side.append(iaBlock, priorityBlock);
  decisionGrid.append(decisionChartCard, side);
  decisionSection.append(decisionGrid);

  const bandSituation = document.createElement('div');
  bandSituation.className = 'dashboard-band dashboard-band--situation';
  bandSituation.append(systemSection, kpiSection);

  const bandTrends = document.createElement('div');
  bandTrends.className = 'dashboard-band dashboard-band--analysis';
  bandTrends.append(chartsSection);

  const activitySection = document.createElement('section');
  activitySection.className = 'dashboard-section';
  const activityWrap = document.createElement('div');
  activityWrap.className = 'dashboard-activity-wrap';
  activityWrap.append(
    createDashboardActivitySection(
      {
        incidents: [],
        actions: [],
        audits: []
      },
      { showHeader: false }
    )
  );
  activitySection.append(makeSectionHeader('Suivi', 'Activité récente', 'Flux récents — lecture secondaire.'), activityWrap);

  const bandActivity = document.createElement('div');
  bandActivity.className = 'dashboard-band dashboard-band--activity-foot';
  bandActivity.append(activitySection);

  const kpiFilterModal = upsertKpiFilterModal();
  /** @type {{ inc: Chart|null; risk: Chart|null; score: Chart|null }} */
  const decisionCharts = { inc: null, risk: null, score: null };
  const iaList = iaBlock.querySelector('[data-dc-ia]');
  const prioList = priorityBlock.querySelector('[data-dc-prio]');

  function renderKpiFilteredModal(specKey) {
    const rowsByKey = {
      incidents: kpiDashboardLists.incidents,
      actions: kpiDashboardLists.actions,
      actionsLate: kpiDashboardLists.actions.filter((r) => isActionOverdueDashboardRow(r)),
      ncOpen: kpiDashboardLists.ncs.filter((r) => isNcOpen(r)),
      auditsN: kpiDashboardLists.audits,
      auditScore: kpiDashboardLists.audits
    };
    const rows = rowsByKey[specKey] || [];
    const title = KPI_SPECS.find((x) => x.key === specKey)?.label || 'KPI';
    const first = rows.slice(0, 12);
    kpiFilterModal.innerHTML = `
      <form method="dialog" class="kpi-detail-drawer__body">
        <div class="kpi-detail-drawer__head"><h3>${escapeHtml(title)} — vue filtrée</h3><button class="btn btn-ghost">Fermer</button></div>
        <div style="display:grid;gap:8px;max-height:62vh;overflow:auto">
          ${first
            .map(
              (r) => `<div class="content-card card-soft" style="padding:10px">
                <div style="font-weight:600">${escapeHtml(String(r?.title || r?.type || r?.point || 'Élément'))}</div>
                <div style="opacity:.8">${escapeHtml(String(r?.status || r?.severity || r?.date || ''))}</div>
              </div>`
            )
            .join('')}
          ${rows.length > first.length ? `<p style="opacity:.7">+${rows.length - first.length} autres éléments</p>` : ''}
        </div>
      </form>
    `;
    if (!kpiFilterModal.open) kpiFilterModal.showModal();
  }

  function updateDecisionAlerts(stats, incidents, actions, ncs, audits) {
    const crit = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents.length : 0;
    const late = asDashboardCount(stats?.overdueActions);
    const ncOpen = ncs.filter(isNcOpen).length;
    const cards = [
      { k: 'Incidents critiques', v: crit, tone: toneByValue(crit, 1, 2) },
      { k: 'Actions en retard', v: late, tone: toneByValue(late, 1, 3) },
      { k: 'NC ouvertes', v: ncOpen, tone: toneByValue(ncOpen, 1, 3) }
    ];
    decisionAlerts.innerHTML = cards
      .map(
        (c) => `<article class="dashboard-decision-alert dashboard-decision-alert--${c.tone}">
          <div class="dashboard-decision-alert__k">${escapeHtml(c.k)}</div>
          <div class="dashboard-decision-alert__v">${escapeHtml(String(c.v))}</div>
        </article>`
      )
      .join('');

    const incCtx = decisionChartCard.querySelector('[data-dc-inc]');
    const riskCtx = decisionChartCard.querySelector('[data-dc-risk]');
    const scoreCtx = decisionChartCard.querySelector('[data-dc-score]');
    const monthly = buildIncidentMonthlySeries(incidents).slice(-6);
    const riskTypes = buildTopIncidentTypes(incidents).slice(0, 5);
    const auditScores = buildAuditScoreSeriesFromAudits(audits).slice(-6);
    if (decisionCharts.inc) decisionCharts.inc.destroy();
    if (decisionCharts.risk) decisionCharts.risk.destroy();
    if (decisionCharts.score) decisionCharts.score.destroy();
    if (incCtx instanceof HTMLCanvasElement) {
      decisionCharts.inc = new Chart(incCtx, {
        type: 'line',
        data: { labels: monthly.map((m) => m.label), datasets: [{ label: 'Incidents', data: monthly.map((m) => m.value), borderColor: '#fb923c', backgroundColor: 'rgba(251,146,60,.15)', tension: 0.35, fill: true }] },
        options: { responsive: true, plugins: { legend: { display: false } } }
      });
    }
    if (riskCtx instanceof HTMLCanvasElement) {
      decisionCharts.risk = new Chart(riskCtx, {
        type: 'doughnut',
        data: { labels: riskTypes.map((r) => r.type), datasets: [{ data: riskTypes.map((r) => r.count), backgroundColor: ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#38bdf8'] }] },
        options: { responsive: true, plugins: { legend: { labels: { color: '#cbd5e1' } } } }
      });
    }
    if (scoreCtx instanceof HTMLCanvasElement) {
      decisionCharts.score = new Chart(scoreCtx, {
        type: 'bar',
        data: { labels: auditScores.map((a) => a.label), datasets: [{ label: 'Score QHSE', data: auditScores.map((a) => a.value), backgroundColor: auditScores.map((a) => (a.value >= 80 ? '#22c55e' : a.value >= 60 ? '#f59e0b' : '#ef4444')) }] },
        options: { scales: { y: { min: 0, max: 100 } }, plugins: { legend: { display: false } } }
      });
    }

    const trendDelta =
      monthly.length >= 2 ? monthly[monthly.length - 1].value - monthly[0].value : 0;
    const iaMsgs = [
      trendDelta > 1
        ? `Dérive incidents en hausse (${trendDelta > 0 ? '+' : ''}${trendDelta})`
        : 'Incidents stables sur la période',
      late > 0 ? `Recommandation: traiter ${late} action(s) en retard sous 48h.` : 'Aucun retard critique détecté.',
      ncOpen > 2 ? `Recommandation: lancer revue NC ciblée (top ${Math.min(3, ncOpen)}).` : 'Niveau NC sous contrôle.'
    ];
    if (iaList) iaList.innerHTML = iaMsgs.map((m) => `<li>${escapeHtml(m)}</li>`).join('');

    const priorities = [
      ...actions.filter((a) => isActionOverdueDashboardRow(a)).slice(0, 3).map((a) => `Action: ${a.title || 'Sans titre'}`),
      ...incidents.filter((i) => String(i?.severity || '').toLowerCase().includes('critique')).slice(0, 2).map((i) => `Incident critique: ${i.title || i.type || 'Sans titre'}`)
    ].slice(0, 5);
    if (prioList) {
      prioList.innerHTML = priorities.length
        ? priorities.map((p) => `<li>${escapeHtml(p)}</li>`).join('')
        : '<li>Aucune action prioritaire immédiate.</li>';
    }
  }

  extendedSection.append(bandSituation, bandTrends);

  page.append(
    connectivitySlot,
    decisionAlertsBand,
    bandCriticalAlerts,
    bandCeo,
    cockpitPremium.root,
    bandAssistant,
    bandPriority,
    bandToday,
    bandShortcuts,
    bandAnalysisLecture,
    bandSecondary,
    decisionSection,
    toggleRow,
    extendedSection,
    bandCockpit,
    bandActivity
  );

  ceoHero.update({
    stats: lastStats,
    ncs: [],
    audits: [],
    incidents: [],
    siteLabel: siteName
  });
  cockpit.update({
    stats: lastStats,
    incidents: [],
    actions: [],
    audits: [],
    ncs: []
  });
  cockpitPremium.update({
    data: lastStats,
    incidents: [],
    actions: [],
    audits: [],
    ncs: [],
    sessionUser: getSessionUser()
  });
  priorityNow.update({ stats: lastStats, ncs: [], audits: [] });

  function updateKpiPriorityLine() {
    const stats = lastStats || {};
    const crit = Array.isArray(stats.criticalIncidents) ? stats.criticalIncidents.length : 0;
    const od = asDashboardCount(stats.overdueActions);
    const ncOpen = dashboardNcListForKpi.filter(isNcOpen).length;
    const n = crit + od + ncOpen;
    if (n === 0) {
      kpiPriorityLine.textContent = 'Aucun élément critique à traiter en priorité aujourd’hui.';
      kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--ok';
    } else {
      kpiPriorityLine.textContent = `${n} élément${n > 1 ? 's' : ''} critique${n > 1 ? 's' : ''} à traiter aujourd’hui`;
      kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--attention';
    }
  }

  function applyStatsToKpis(data) {
    kpiValues.incidents.textContent = formatDashboardCount(data.incidents);
    kpiValues.actionsLate.textContent = formatDashboardCount(data.overdueActions);
    kpiValues.actions.textContent = formatDashboardCount(data.actions);
    const lateTone = toneByValue(data.overdueActions, 1, 3);
    const incTone = toneByValue(data.incidents, 3, 8);
    [kpiValues.actionsLate?.parentElement, kpiValues.incidents?.parentElement].forEach((el) => {
      if (!el) return;
      el.classList.remove('dashboard-kpi-card--crit');
    });
    if (lateTone === 'red') kpiValues.actionsLate?.parentElement?.classList.add('dashboard-kpi-card--crit');
    if (incTone === 'red') kpiValues.incidents?.parentElement?.classList.add('dashboard-kpi-card--crit');
    updateKpiPriorityLine();
  }

  function applyEnrichmentKpis(ncList, auditList, ncTotalAggregate) {
    if (Array.isArray(ncList)) {
      const n = ncList.filter(isNcOpen).length;
      kpiValues.ncOpen.textContent = String(n);
      if (kpiNotes.ncOpen) {
        const agg =
          ncTotalAggregate != null && Number.isFinite(Number(ncTotalAggregate))
            ? `${formatDashboardCount(Number(ncTotalAggregate))} NC au total (API)`
            : 'total API indisponible';
        kpiNotes.ncOpen.textContent = `${n} ouvertes · ${agg}`;
      }
    }
    if (auditList && auditList.length) {
      const scores = auditList
        .map((a) => Number(a.score))
        .filter((n) => Number.isFinite(n));
      if (scores.length) {
        const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
        kpiValues.auditScore.textContent = `${avg}%`;
      } else {
        kpiValues.auditScore.textContent = '—';
      }
      kpiValues.auditsN.textContent = String(auditList.length);
    } else {
      kpiValues.auditScore.textContent = '—';
      kpiValues.auditsN.textContent = '—';
    }
  }

  function refreshCharts(incidents, actions, audits, ncs) {
    const inc = incidents || [];
    const act = actions || [];
    const aud = audits || [];
    const ncList = ncs || [];
    lineCard.body.replaceChildren(
      createDashboardLineChart(buildIncidentMonthlySeries(inc), { lineTheme: 'incidents' })
    );
    mixCard.body.replaceChildren(createActionsMixChart(classifyActionsForMix(act)));
    typeCard.body.replaceChildren(createIncidentTypeBreakdown(buildTopIncidentTypes(inc)));

    auditCharts.update({ audits: aud, ncs: ncList });

    const stats = lastStats || {};
    const ncOpen = ncList.filter(isNcOpen).length;
    dashboardNcListForKpi = ncList;
    updateKpiPriorityLine();
    pilotLoadCard.body.replaceChildren(
      createPilotageLoadMixChart({
        criticalIncidents: Array.isArray(stats.criticalIncidents)
          ? stats.criticalIncidents.length
          : 0,
        overdueActions: asDashboardCount(stats.overdueActions),
        ncOpen
      })
    );
  }

  function refreshActivity(incidents, actions, audits) {
    activityWrap.replaceChildren(
      createDashboardActivitySection(
        {
          incidents: incidents || [],
          actions: actions || [],
          audits: audits || []
        },
        { showHeader: false }
      )
    );
  }

  updateKpiPriorityLine();

  /**
   * Charge les listes (avec retry), graphes, activité récente et blocs dépendants.
   * Si `fillStatsFromLists` : stats API absentes → KPIs / pastilles dérivés des listes.
   */
  async function loadListsAndRefreshDashboard(fillStatsFromLists) {
    const listResults = await Promise.allSettled([
      fetchJsonListWithRetry('/api/incidents?limit=500'),
      fetchJsonListWithRetry('/api/actions?limit=500'),
      fetchJsonListWithRetry('/api/audits?limit=80'),
      fetchJsonListWithRetry('/api/nonconformities?limit=150')
    ]);
    const listVal = (i) => {
      const r = listResults[i];
      if (r.status === 'fulfilled') return r.value;
      console.error(`[dashboard] liste ${i}`, r.reason);
      return null;
    };
    const incR = listVal(0);
    const actR = listVal(1);
    const audR = listVal(2);
    const ncR = listVal(3);
    if (listResults.some((r) => r.status === 'rejected')) {
      showToast('Certaines listes n’ont pas pu être chargées — affichage partiel.', 'warning');
    }

    const incidents = incR || [];
    const actions = actR || [];
    const audits = audR || [];
    const ncs = ncR || [];

    if (fillStatsFromLists) {
      const derived = deriveDashboardStatsFromLists(incidents, actions, ncs);
      lastStats = derived;
      shortcutsBundle.updateShortcutBadges({
        overdueCount: derived.overdueActions ?? 0,
        ncCount: derived.nonConformities ?? 0
      });
      todayBlock.update({
        sessionUser: getSessionUser(),
        incidents: derived.incidents,
        overdueActionItems: derived.overdueActionItems,
        criticalIncidents: derived.criticalIncidents
      });
      applyStatsToKpis(lastStats);
    }

    kpiDashboardLists.incidents = incidents;
    kpiDashboardLists.actions = actions;
    kpiDashboardLists.audits = audits;
    kpiDashboardLists.ncs = ncs;

    refreshCharts(incidents, actions, audits, ncs);
    updateDecisionAlerts(lastStats, incidents, actions, ncs, audits);
    applyEnrichmentKpis(ncs, audits, lastStats.nonConformities);
    alertsPrio.update({ stats: lastStats, ncs, audits });
    systemStatus.update({
      stats: lastStats,
      incidents,
      actions,
      audits,
      ncs
    });
    refreshActivity(incidents, actions, audits);

    ceoHero.update({
      stats: lastStats,
      ncs,
      audits,
      incidents,
      siteLabel: siteName
    });
    cockpit.update({
      stats: lastStats,
      incidents,
      actions,
      audits,
      ncs
    });
    cockpitPremium.update({
      data: lastStats,
      incidents,
      actions,
      audits,
      ncs,
      sessionUser: getSessionUser()
    });
    priorityNow.update({ stats: lastStats, ncs, audits });
    vigilance.update({
      stats: lastStats,
      incidents,
      actions,
      audits,
      ncs
    });
    autoAnalysis.update({
      stats: lastStats,
      incidents,
      ncs
    });

    try {
      const snap = await buildAssistantSnapshot({
        stats: lastStats,
        incidents,
        actions,
        audits,
        ncs,
        siteLabel: siteName
      });
      pilotageAssistant.update(snap);
    } catch (asstErr) {
      console.warn('[dashboard] assistant snapshot', asstErr);
    }
  }

  (async function loadDashboard() {
    /** Échec réseau uniquement ici → bandeau « connexion impossible ». */
    let res;
    try {
      res = await qhseFetchWithNetworkRetry(withSiteQuery('/api/dashboard/stats'));
    } catch (err) {
      console.error('[dashboard] réseau GET /api/dashboard/stats', err);
      showToast(
        'Impossible de joindre l’API (tableau de bord). Vérifiez que le serveur backend tourne (ex. port 3001).',
        'warning'
      );
      showDashboardConnectivityError(connectivitySlot);
      await loadListsAndRefreshDashboard(true);
      return;
    }

    let statsFromApiReady = false;
    try {
      if (res.status === 401) {
        showToast('Session expirée — reconnectez-vous.', 'warning');
        return;
      }
      if (res.status === 403) {
        showToast('Accès au tableau de bord refusé pour ce profil.', 'warning');
        await loadListsAndRefreshDashboard(true);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg =
          typeof j.error === 'string' && j.error.trim()
            ? j.error.trim()
            : `Données dashboard indisponibles (${res.status}).`;
        showToast(msg, 'warning');
        showDashboardConnectivityError(connectivitySlot);
        await loadListsAndRefreshDashboard(true);
        return;
      }
      const raw = await res.json().catch(() => null);
      const normalized = normalizeDashboardPayload(raw);
      if (!normalized) {
        console.error('[dashboard] GET /api/dashboard/stats — corps invalide', raw);
        showToast('Réponse tableau de bord illisible.', 'warning');
        showDashboardConnectivityError(connectivitySlot);
        await loadListsAndRefreshDashboard(true);
        return;
      }

      connectivitySlot.hidden = true;
      connectivitySlot.replaceChildren();

      lastStats = normalized;
      statsFromApiReady = true;
      shortcutsBundle.updateShortcutBadges({
        overdueCount: normalized.overdueActions ?? 0,
        ncCount: normalized.nonConformities ?? 0
      });
      todayBlock.update({
        sessionUser: getSessionUser(),
        incidents: normalized.incidents,
        overdueActionItems: normalized.overdueActionItems,
        criticalIncidents: normalized.criticalIncidents
      });
      applyStatsToKpis(normalized);
      alertsPrio.update({ stats: lastStats, ncs: [], audits: [] });
      systemStatus.update({
        stats: lastStats,
        incidents: [],
        actions: [],
        audits: [],
        ncs: []
      });
      vigilance.update({
        stats: lastStats,
        incidents: [],
        actions: [],
        audits: [],
        ncs: []
      });
      autoAnalysis.update({
        stats: lastStats,
        incidents: [],
        ncs: []
      });
      ceoHero.update({
        stats: lastStats,
        ncs: [],
        audits: [],
        incidents: [],
        siteLabel: siteName
      });
      cockpit.update({
        stats: lastStats,
        incidents: [],
        actions: [],
        audits: [],
        ncs: []
      });
      cockpitPremium.update({
        data: lastStats,
        incidents: [],
        actions: [],
        audits: [],
        ncs: [],
        sessionUser: getSessionUser()
      });
      priorityNow.update({ stats: lastStats, ncs: [], audits: [] });
      updateDecisionAlerts(lastStats, [], [], [], []);

      await loadListsAndRefreshDashboard(false);
    } catch (err) {
      console.error('[dashboard] traitement après stats', err?.message || err, err);
      showToast(
        `Erreur tableau de bord : ${err instanceof Error ? err.message : String(err)} — voir la console (F12).`,
        'warning'
      );
      try {
        await loadListsAndRefreshDashboard(!statsFromApiReady);
      } catch (e2) {
        console.warn('[dashboard] reprise listes après erreur', e2);
      }
    }
  })();

  return page;
}
