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
  buildAuditScoreSeriesFromAudits,
  buildIncidentMonthlySeries,
  buildTopIncidentTypes,
  classifyActionsForMix,
  createActionsMixChart,
  createDashboardLineChart,
  createIncidentTypeBreakdown,
  createPilotageLoadMixChart,
  interpretAuditScoreSeries
} from '../components/dashboardCharts.js';
import { createDashboardActivitySection } from '../components/dashboardActivity.js';
import { createDashboardCockpit } from '../components/dashboardCockpit.js';
import { createDashboardCockpitPremium } from '../components/dashboardCockpitPremium.js';
import { createDashboardShortcutsSection } from '../components/dashboardShortcuts.js';
import { createDashboardSystemStatus } from '../components/dashboardSystemStatus.js';
import { createDashboardVigilancePoints } from '../components/dashboardVigilancePoints.js';
import { createDashboardAutoAnalysis } from '../components/dashboardAutoAnalysis.js';
import { createDashboardPriorityNow } from '../components/dashboardPriorityNow.js';
import { createDashboardBlockActions } from '../utils/dashboardBlockActions.js';
import { createSimpleModeGuide } from '../utils/simpleModeGuide.js';

const KPI_SPECS = [
  { key: 'incidents', label: 'Incidents', note: 'Total déclarés (périmètre)', tone: 'amber' },
  { key: 'ncOpen', label: 'NC ouvertes', note: 'Non clos — détail après chargement', tone: 'amber' },
  { key: 'actionsLate', label: 'Actions en retard', note: 'Total serveur', tone: 'red' },
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
      ? `<p class="dashboard-muted-lead dashboard-chart-lead">${lead}</p>`
      : '';
  head.innerHTML = `
    <div>
      <div class="section-kicker">${kicker}</div>
      <h3 class="dashboard-chart-h">${title}</h3>
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

  const siteName = appState.currentSite || 'Tous sites';

  function exportDirectionToast() {
    showToast('Export direction (PDF / Excel) : à brancher sur le SI — démo.', 'info');
  }

  const ceoHero = createDashboardCeoHero(siteName, { onExport: exportDirectionToast });

  const page = document.createElement('section');
  page.className = 'page-stack dashboard-page';

  const shellIntro = createDashboardShellIntro();

  const simpleGuide = createSimpleModeGuide({
    title: 'Vue du jour — l’essentiel en premier',
    hint: 'Les urgences et retards sont regroupés sous « À faire maintenant », puis les raccourcis vers les modules.',
    nextStep: 'Ensuite : ouvrez une ligne prioritaire ou passez en mode Expert pour les graphiques et l’activité détaillée.'
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
  let lastStats = {
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

  const bandCockpit = document.createElement('div');
  bandCockpit.className = 'dashboard-band dashboard-band--cockpit';
  bandCockpit.append(cockpit.root, alertsSection);

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
  <span class="dashboard-toggle-label">Analyses & activité</span>
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
  const kpiGrid = document.createElement('section');
  kpiGrid.className = 'kpi-grid dashboard-kpi-grid';
  KPI_SPECS.forEach((spec) => {
    const card = document.createElement('article');
    card.className = 'metric-card card-soft dashboard-kpi-card';
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
    kpiGrid.append(card);
  });

  const kpiStickyWrap = document.createElement('div');
  kpiStickyWrap.className = 'dashboard-kpi-sticky';
  kpiStickyWrap.append(kpiGrid);

  const kpiPriorityLine = document.createElement('p');
  kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--ok';
  kpiPriorityLine.textContent = '';

  const kpiSection = document.createElement('section');
  kpiSection.className = 'dashboard-section';
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
  const auditSeries0 = buildAuditScoreSeriesFromAudits([]);
  auditScoreCard.body.append(
    createDashboardLineChart(auditSeries0, {
      lineTheme: 'audits',
      ariaLabel: 'Évolution des scores d’audit sur les derniers enregistrements chargés.',
      interpretText: interpretAuditScoreSeries(auditSeries0),
      valueTitle: (p) => `${p.value} %`,
      footText: ''
    })
  );

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
  activitySection.append(makeSectionHeader('Suivi', 'Activité récente', ''), activityWrap);

  const bandTertiary = document.createElement('div');
  bandTertiary.className = 'dashboard-band dashboard-band--tertiary';
  bandTertiary.append(activitySection);

  extendedSection.append(bandSituation, bandTrends, bandTertiary);

  page.append(
    todayBlock,
    bandCeo,
    connectivitySlot,
    cockpitPremium.root,
    bandShortcuts,
    bandAnalysisLecture,
    bandSecondary,
    toggleRow,
    extendedSection,
    bandPriority,
    bandCockpit
  );

  ceoHero.update({
    stats: lastStats,
    ncs: [],
    audits: [],
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

    const auditSeries = buildAuditScoreSeriesFromAudits(aud);
    auditScoreCard.body.replaceChildren(
      createDashboardLineChart(auditSeries, {
        lineTheme: 'audits',
        ariaLabel: 'Évolution des scores d’audit sur les derniers enregistrements chargés.',
        interpretText: interpretAuditScoreSeries(auditSeries),
        valueTitle: (p) => `${p.value} %`,
        footText: ''
      })
    );

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
      return;
    }

    try {
      if (res.status === 401) {
        showToast('Session expirée — reconnectez-vous.', 'warning');
        return;
      }
      if (res.status === 403) {
        showToast('Accès au tableau de bord refusé pour ce profil.', 'warning');
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg =
          typeof j.error === 'string' && j.error.trim()
            ? j.error.trim()
            : `Données dashboard indisponibles (${res.status}).`;
        showToast(msg, 'warning');
        return;
      }
      const raw = await res.json().catch(() => null);
      const normalized = normalizeDashboardPayload(raw);
      if (!normalized) {
        console.error('[dashboard] GET /api/dashboard/stats — corps invalide', raw);
        showToast('Réponse tableau de bord illisible.', 'warning');
        return;
      }

      connectivitySlot.hidden = true;
      connectivitySlot.replaceChildren();

      lastStats = normalized;
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

      const listResults = await Promise.allSettled([
        fetchJsonList('/api/incidents?limit=500'),
        fetchJsonList('/api/actions?limit=320'),
        fetchJsonList('/api/audits?limit=80'),
        fetchJsonList('/api/nonconformities?limit=150')
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

      refreshCharts(incidents, actions, audits, ncs);
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
    } catch (err) {
      console.error('[dashboard] traitement après stats', err?.message || err, err);
      showToast(
        `Erreur tableau de bord : ${err instanceof Error ? err.message : String(err)} — voir la console (F12).`,
        'warning'
      );
    }
  })();

  return page;
}
