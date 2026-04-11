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
  buildNcMajorMinorMonthlySeries,
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
import { mountPageViewModeSwitch } from '../utils/pageViewMode.js';
import { createKpiDetailDrawer } from '../components/kpiDetailDrawer.js';
import { isActionOverdueDashboardRow } from '../utils/actionOverdueDashboard.js';
import {
  asDashboardCount,
  isNcOpen,
  reconcileDashboardStatsWithLists,
  deriveDashboardStatsFromLists
} from '../utils/reconcileDashboardStats.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { Chart, registerables } from 'chart.js';
import { initDashboardCharts } from '../components/dashboardCharts.js';
import { listPermits } from '../services/ptw.service.js';
import { renderKpiCards } from '../components/dashboardKpiCards.js';
import { createDashboardTfTgMiniRow } from '../components/tfTgKpi.js';
import {
  HABILITATIONS_DEMO_ROWS,
  computeHabilitationsBySite,
  computeHabilitationsKpis
} from '../data/habilitationsDemo.js';

/* Extraction : navigation depuis KPI, fetch listes avec retry, métriques / normalisation stats — voir utils/dashboard*.js */
import { pushDashboardIntent } from '../utils/dashboardNavigationIntent.js';
import { fetchJsonList, fetchJsonListWithRetry, qhseFetchWithNetworkRetry } from '../utils/dashboardFetchHelpers.js';
import {
  toneByValue,
  safeNum,
  trimTrailingZeroAuditScores,
  computeDeltaLabel,
  guessImpactedSite,
  buildOperationalTiles,
  normalizeDashboardPayload,
  buildMistralDashboardStatsPayload,
  formatDashboardCount
} from '../utils/dashboardMetrics.js';

const DC_CHART_FONT = 'Inter, system-ui, sans-serif';

function getCssVar(name, fallback = '') {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback;
}

const DASH_DECISION_STYLE_ID = 'qhse-dashboard-decision-styles';
const DASHBOARD_DEMO_LISTS = {
  incidents: [
    { ref: 'INC-224', type: 'Chute de plain-pied', severity: 'Critique', status: 'Ouvert', site: 'Mine Nord', service: 'Production', createdAt: '2026-04-01' },
    { ref: 'INC-225', type: 'Fuite huile hydraulique', severity: 'Moyen', status: 'En investigation', site: 'Raffinerie Ouest', service: 'Maintenance', createdAt: '2026-04-03' }
  ],
  actions: [
    { title: 'Corriger balisage zone concasseur', status: 'Retard', owner: 'Supervision Mine Nord', service: 'HSE', dueDate: '2026-04-02', createdAt: '2026-03-24' },
    { title: 'Former équipe sous-traitante EPI', status: 'À lancer', owner: 'QHSE site', service: 'Formation', dueDate: '2026-04-18', createdAt: '2026-04-05' }
  ],
  audits: [
    { ref: 'AUD-92', score: 78, status: 'Plan action ouvert', site: 'Base Portuaire', service: 'Opérations', createdAt: '2026-03-30' }
  ],
  ncs: [
    { title: 'Permis feu incomplet', status: 'Ouverte', auditRef: 'AUD-92', site: 'Base Portuaire', service: 'Maintenance', createdAt: '2026-04-02' }
  ]
};

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
.dashboard-decision-grid{display:grid;grid-template-columns:1.22fr .88fr;gap:clamp(14px,2vw,22px);align-items:start}
.dashboard-decision-side{display:grid;gap:clamp(12px,1.5vw,16px)}
.dashboard-decision-charts-host{
  position:relative;
  overflow:hidden;
  border-radius:16px;
  border:1px solid color-mix(in srgb, var(--palette-accent, #14b8a6) 12%, var(--color-border-tertiary));
  background:linear-gradient(
    165deg,
    color-mix(in srgb, var(--color-background-secondary) 96%, var(--palette-accent, #14b8a6) 2%) 0%,
    color-mix(in srgb, var(--color-background-primary) 98%, #0f172a) 55%,
    var(--color-background-secondary) 100%
  );
  box-shadow:
    0 0 0 1px color-mix(in srgb, white 4%, transparent) inset,
    0 20px 50px -34px rgba(0,0,0,.55);
}
.dashboard-decision-charts-host::before{
  content:'';
  position:absolute;left:0;right:0;top:0;height:2px;
  background:linear-gradient(90deg,
    color-mix(in srgb, var(--palette-accent, #14b8a6) 75%, transparent),
    color-mix(in srgb, #38bdf8 45%, transparent),
    transparent 70%);
  pointer-events:none;
}
.dashboard-decision-charts-head{
  padding:clamp(16px,2vw,22px) clamp(16px,2vw,22px) 0;
}
.dashboard-decision-charts-head .section-kicker{
  letter-spacing:.1em;
}
.dashboard-decision-charts-head h3{
  margin:6px 0 0;
  font-size:clamp(17px,1.35vw,20px);
  font-weight:800;
  letter-spacing:-.02em;
  color:var(--text);
}
.dashboard-decision-charts-lead{
  margin:8px 0 0;
  max-width:52ch;
  font-size:12px;
  line-height:1.45;
  color:var(--text2);
}
.dashboard-decision-charts-grid{
  display:grid;
  gap:0;
  padding:clamp(12px,1.5vw,18px);
}
.dashboard-decision-chart-panel{
  padding:14px clamp(12px,1.5vw,18px) 10px;
  border-top:1px solid color-mix(in srgb, var(--color-border-tertiary) 85%, transparent);
}
.dashboard-decision-chart-panel:first-of-type{border-top:none;padding-top:6px}
.dashboard-decision-chart-panel__meta{
  display:flex;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:10px;
}
.dashboard-decision-chart-panel__tag{
  font-size:10px;font-weight:800;letter-spacing:.09em;text-transform:uppercase;
  color:var(--text3);
  padding:3px 8px;border-radius:999px;
  border:1px solid color-mix(in srgb, var(--color-border-tertiary) 90%, transparent);
  background:color-mix(in srgb, var(--color-subtle) 65%, transparent);
}
.dashboard-decision-chart-panel__title{font-size:13px;font-weight:700;color:var(--text);letter-spacing:-.01em}
.dashboard-decision-chart-panel__canvas{
  position:relative;
  height:clamp(168px,22vw,210px);
  max-height:220px;
}
.dashboard-decision-chart-panel__canvas canvas{max-height:100%!important}
.dashboard-decision-insight{
  position:relative;
  border-radius:14px;
  border:1px solid color-mix(in srgb, var(--color-border-tertiary) 92%, transparent);
  background:linear-gradient(
    180deg,
    color-mix(in srgb, var(--color-background-secondary) 99%, transparent) 0%,
    color-mix(in srgb, var(--color-background-primary) 94%, #0f172a 4%) 100%
  );
  padding:clamp(14px,1.8vw,18px);
  box-shadow:0 12px 28px -22px rgba(0,0,0,.45);
}
.dashboard-decision-insight--prio{
  border-color:color-mix(in srgb, #f97316 22%, var(--color-border-tertiary));
}
.dashboard-decision-insight-head{display:flex;flex-direction:column;gap:6px;margin-bottom:12px}
.dashboard-decision-insight-head h3{
  margin:0;
  font-size:15px;
  font-weight:800;
  letter-spacing:-.02em;
  line-height:1.25;
  color:var(--text);
}
.dashboard-decision-insight-badge{
  align-self:flex-start;
  font-size:9px;font-weight:800;letter-spacing:.12em;
  padding:4px 9px;border-radius:8px;
  border:1px solid var(--color-border-secondary);
  color:var(--text2);
  background:var(--color-background-primary);
}
.dashboard-decision-insight-badge--ia{
  border-color:color-mix(in srgb, #38bdf8 40%, var(--color-border-secondary));
  color:color-mix(in srgb, #7dd3fc 88%, var(--text));
  background:color-mix(in srgb, #0ea5e9 12%, var(--color-background-primary));
}
.dashboard-decision-insight-badge--prio{
  border-color:color-mix(in srgb, #fb923c 45%, var(--color-border-secondary));
  color:color-mix(in srgb, #fdba74 90%, var(--text));
  background:color-mix(in srgb, #f97316 10%, var(--color-background-primary));
}
.dashboard-decision-insight-list{
  margin:0;padding:0;list-style:none;display:grid;gap:10px;
}
.dashboard-decision-insight-list li{
  position:relative;
  padding:10px 12px 10px 14px;
  font-size:13px;line-height:1.45;color:var(--text2);
  border-radius:10px;
  background:color-mix(in srgb, var(--color-background-primary) 92%, transparent);
  border:1px solid color-mix(in srgb, var(--color-border-tertiary) 80%, transparent);
}
.dashboard-decision-insight-list li::before{
  content:'';
  position:absolute;left:0;top:10px;bottom:10px;width:3px;border-radius:999px;
  background:linear-gradient(180deg,var(--palette-accent, #14b8a6),#0ea5e9);
  opacity:.85;
}
.dashboard-decision-insight--prio .dashboard-decision-insight-list li::before{
  background:linear-gradient(180deg,#fb923c,#f97316);
}
/* État critique : lisible sans halo « démo » — renforce bordure gauche + léger fond. */
.dashboard-kpi-card--crit.metric-card{
  border-left-color:var(--color-text-danger,#ef4444)!important;
  background:color-mix(in srgb,var(--color-danger-bg,rgba(239,68,68,.12)) 18%,var(--color-background-primary))!important;
  box-shadow:none!important;
}
.dashboard-ops-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.dashboard-ops-card{padding:12px;border-radius:12px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary);display:grid;gap:6px;cursor:pointer}
.dashboard-ops-card__k{font-size:11px;color:var(--text3);text-transform:uppercase;letter-spacing:.04em}
.dashboard-ops-card__v{font-size:22px;font-weight:800;line-height:1}
.dashboard-ops-card__d{font-size:12px;color:var(--text2)}
.dashboard-ops-card--green{border-color:rgba(34,197,94,.35)}
.dashboard-ops-card--orange{border-color:rgba(251,146,60,.42)}
.dashboard-ops-card--red{border-color:rgba(239,68,68,.48)}
.dashboard-hab-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:12px}
.dashboard-hab-card{padding:12px;border-radius:12px;border:1px solid var(--color-border-tertiary);background:var(--color-background-secondary)}
.dashboard-hab-list{display:grid;gap:8px}
.dashboard-hab-item{padding:8px;border-radius:10px;border:1px solid var(--color-border-tertiary);background:var(--color-background-primary)}
.dashboard-hab-sitebar{display:grid;gap:7px}
.dashboard-hab-sitebar-row{display:grid;gap:4px}
.dashboard-hab-sitebar-top{display:flex;justify-content:space-between;font-size:12px}
.dashboard-hab-sitebar-track{height:8px;border-radius:999px;border:1px solid var(--color-border-tertiary);overflow:hidden;background:var(--color-background-primary)}
.dashboard-hab-sitebar-fill{height:100%;background:linear-gradient(90deg,#14b8a6,#0ea5e9)}
.dashboard-hab-actions{display:flex;gap:8px;flex-wrap:wrap;margin-top:8px}
.dashboard-kpi-subline{display:flex;justify-content:space-between;gap:8px;font-size:11px;color:var(--text3);padding-top:3px}
.dashboard-kpi-subline__delta{font-weight:700}
.dashboard-kpi-empty-hint,.dashboard-ops-card__empty-hint,.dashboard-decision-alert__empty-hint{font-size:11px;color:var(--text3);margin:4px 0 0;line-height:1.35}
.dashboard-kpi-zero-success__msg,.dashboard-ops-card__success-msg,.dashboard-decision-alert__success-msg{font-size:15px;font-weight:700;margin:6px 0 0;color:var(--color-success-text, #15803d)}
.metric-card.dashboard-kpi-card--tone-success{border-color:var(--color-success-border, rgba(34,197,94,.42));background:var(--color-success-bg, color-mix(in srgb, var(--color-success, #22c55e) 12%, var(--color-background-secondary)))}
.dashboard-ops-card--zero-success{border-color:var(--color-success-border, rgba(34,197,94,.42));background:var(--color-success-bg, color-mix(in srgb, var(--color-success, #22c55e) 12%, var(--color-background-secondary)))}
.dashboard-decision-alert--zero-success{border-color:var(--color-success-border, rgba(34,197,94,.42));background:var(--color-success-bg, color-mix(in srgb, var(--color-success, #22c55e) 12%, var(--color-background-secondary)))}
/* Blocs pilot : surface plus « papier » que « vitrine » — hiérarchie portée par le titre, pas par triple ombre. */
.dashboard-pilot-block{
  position:relative;
  display:grid;
  gap:clamp(12px,1.5vw,16px);
  padding:clamp(14px,2vw,20px);
  border-radius:14px;
  border:1px solid color-mix(in srgb, var(--palette-accent, #14b8a6) 8%, var(--color-border-tertiary));
  background:color-mix(in srgb, var(--color-background-secondary) 94%, var(--color-background-primary));
  box-shadow:
    0 0 0 1px color-mix(in srgb, white 3%, transparent) inset,
    0 16px 40px -32px rgba(0,0,0,.48);
}
.dashboard-pilot-block::before{
  content:'';
  position:absolute;
  left:0;right:0;top:0;height:2px;
  background:linear-gradient(90deg,
    color-mix(in srgb, var(--palette-accent, #14b8a6) 50%, transparent),
    transparent 68%);
  opacity:.62;
  pointer-events:none;
}
.dashboard-pilot-block > .dashboard-section-head:first-child{
  margin:-2px -4px 4px -4px;
  padding:0 4px 12px 16px;
  border-bottom:1px solid color-mix(in srgb, var(--color-border-tertiary) 62%, transparent);
  background:transparent;
  border-radius:10px 10px 0 0;
}
.dashboard-pilot-block > .dashboard-section-head:first-child::before{
  opacity:.72;
  height:62%;
  width:2px;
}
@media (max-width:1200px){.dashboard-ops-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (max-width:980px){.dashboard-decision-alerts{grid-template-columns:1fr}.dashboard-decision-grid{grid-template-columns:1fr}}
@media (max-width:640px){.dashboard-ops-grid{grid-template-columns:1fr}.dashboard-hab-grid{grid-template-columns:1fr}}
`;
  document.head.append(el);
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
 * @type {{ incidents: unknown[]; actions: unknown[]; audits: unknown[]; ncs: unknown[]; docs: unknown[] }}
 */
const kpiDashboardLists = { incidents: [], actions: [], audits: [], ncs: [], docs: [] };
/** @type {{ open: (k: string) => void; element: HTMLDialogElement } | null} */
let kpiDetailDrawerSingleton = null;

async function loadDashboardInsight(stats) {
  const zone = document.getElementById('dashboard-ai-insight');
  if (!zone) return;
  try {
    const res = await qhseFetch('/api/ai/dashboard-insight', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stats)
    });
    if (!res.ok) throw new Error('api');
    const { insight } = await res.json();
    zone.innerHTML = `
      <article class="content-card card-soft dashboard-ai-insight__card" aria-label="Analyse IA de la semaine">
        <div class="dashboard-ai-insight__shell">
          <div class="dashboard-ai-insight__rail" aria-hidden="true"></div>
          <div class="dashboard-ai-insight__content">
            <p class="section-kicker dashboard-ai-insight__kicker">Analyse IA de la semaine</p>
            <div class="dashboard-ai-insight__body">${escapeHtml(String(insight ?? ''))}</div>
          </div>
        </div>
      </article>`;
  } catch {
    zone.innerHTML = '';
  }
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
  initDashboardCharts();
  ensureDashboardStyles();
  ensureDashboardDecisionStyles();

  const siteName = appState.currentSite || 'Tous sites';

  const kpiToneClasses = [
    'dashboard-kpi-card--tone-blue',
    'dashboard-kpi-card--tone-red',
    'dashboard-kpi-card--tone-amber',
    'dashboard-kpi-card--tone-green',
    'dashboard-kpi-card--tone-success'
  ];

  function dashboardKpiScopeEmptyLabel() {
    return appState.activeSiteId ? 'Aucun sur ce site' : 'Aucune donnée';
  }

  function exportDirectionToast() {
    showToast(
      'Export direction (PDF / Excel) : connecteur prêt à être relié à votre système documentaire.',
      'info'
    );
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

  const { bar: pageViewBar } = mountPageViewModeSwitch({
    pageId: 'dashboard',
    pageRoot: page,
    hintEssential:
      'Vue direction : en-tête, signaux, indicateurs et priorités du jour — analyses étendues et graphiques complémentaires masqués.',
    hintAdvanced:
      'Pilotage complet : volet « Analyses & modules détaillés », graphiques, cockpit, habilitations, activité et assistant.'
  });

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
  /* Même métrique que les cartes KPI + sous-lignes « variation » non métier : réservé à la vue avancée. */
  decisionAlertsBand.className = 'dashboard-section qhse-page-advanced-only';
  const decisionAlerts = document.createElement('div');
  decisionAlerts.className = 'dashboard-decision-alerts';
  decisionAlertsBand.append(
    makeSectionHeader('Signaux', 'Trois priorités à surveiller', 'Cliquez pour ouvrir le détail filtré.'),
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

  const opsCockpitSection = document.createElement('section');
  opsCockpitSection.className = 'dashboard-section';
  const opsGrid = document.createElement('div');
  opsGrid.className = 'dashboard-ops-grid';
  opsCockpitSection.append(
    makeSectionHeader(
      'Tuiles',
      'Pilotage opérationnel étendu',
      'Neuf indicateurs — même logique qu’avant ; replacés ici pour alléger l’écran principal.'
    ),
    opsGrid
  );

  const habilitationsSection = document.createElement('section');
  habilitationsSection.className = 'dashboard-section';
  const habGrid = document.createElement('div');
  habGrid.className = 'dashboard-hab-grid';
  const habSummaryCard = document.createElement('article');
  habSummaryCard.className = 'dashboard-hab-card';
  const habSiteCard = document.createElement('article');
  habSiteCard.className = 'dashboard-hab-card';
  habGrid.append(habSummaryCard, habSiteCard);
  habilitationsSection.append(
    makeSectionHeader(
      'Habilitations',
      'Conformité collaborateurs & sous-traitants',
      'Lecture ciblée DG/QHSE/site: expirations, postes critiques et vigilance prestataires.'
    ),
    habGrid
  );

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
  /* Reste sur la surface exécutive : modes simple/terrain s’appuient sur ce bandeau (displayModes.css). */
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
  extendedSection.className = 'dashboard-extended qhse-page-advanced-only';
  /* Première visite : replié pour réduire la charge cognitive ; si l’utilisateur a déjà choisi, on respecte localStorage. */
  const savedExtended = localStorage.getItem('dashboard-extended');
  const isInitiallyExpanded = savedExtended === 'true';
  extendedSection.dataset.expanded = isInitiallyExpanded ? 'true' : 'false';

  const toggleRow = document.createElement('div');
  toggleRow.className = 'dashboard-toggle-row qhse-page-advanced-only';
  const toggleBtn = document.createElement('button');
  toggleBtn.type = 'button';
  toggleBtn.className = 'dashboard-toggle-btn';
  toggleBtn.innerHTML = `
  <span class="dashboard-toggle-inner">
    <span class="dashboard-toggle-label">Analyses & modules détaillés</span>
    <span class="dashboard-toggle-hint">Graphiques, vue décisionnelle, cockpit, tuiles, habilitations, activité…</span>
  </span>
  <span class="dashboard-toggle-icon" aria-hidden="true">▾</span>
`;
  toggleRow.append(toggleBtn);

  const toggleIcon = toggleBtn.querySelector('.dashboard-toggle-icon');
  if (toggleIcon) toggleIcon.textContent = isInitiallyExpanded ? '▾' : '▸';

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

  if (!kpiDetailDrawerSingleton) {
    kpiDetailDrawerSingleton = createKpiDetailDrawer({
      getData: () => kpiDashboardLists
    });
    kpiDetailDrawerSingleton.element.id = 'qhse-kpi-detail-dialog';
    document.body.append(kpiDetailDrawerSingleton.element);
  }
  const { kpiGrid, kpiStickyWrap, kpiValues, kpiNotes, kpiEmptyHints, dismissKpiSkeleton } = renderKpiCards({
    onOpenDetail: (key) => kpiDetailDrawerSingleton?.open(key)
  });
  kpiGrid.classList.add('dashboard-kpi-grid--executive');

  const kpiPriorityLine = document.createElement('p');
  kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--ok';
  kpiPriorityLine.textContent = '';

  const tfTgMini = createDashboardTfTgMiniRow();

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
    makeSectionHeader('Priorités', 'Cinq indicateurs clés', 'Le détail et les listes complètes : volet « Analyses & modules » ou clic sur une carte.'),
    kpiStickyWrap,
    tfTgMini.root,
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

  /* Graphe principal au premier niveau : tendance incidents (complément dans le volet). */
  const primaryChartSection = document.createElement('section');
  primaryChartSection.className = 'dashboard-section dashboard-section--primary-chart';
  primaryChartSection.append(lineCard.card);

  chartsGrid.append(typeCard.card, mixCard.card, auditScoreCard.card, pilotLoadCard.card);

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
    makeSectionHeader('Complément', 'Autres graphiques', 'Répartition, audits et charge — la tendance principale est au-dessus du volet.'),
    disclaimer,
    chartsGrid,
    ...(chartsQuickRow ? [chartsGlobalActs] : [])
  );

  const decisionSection = document.createElement('section');
  decisionSection.className = 'dashboard-section';
  const decisionGrid = document.createElement('div');
  decisionGrid.className = 'dashboard-decision-grid';
  const decisionChartCard = document.createElement('article');
  decisionChartCard.className = 'content-card card-soft dashboard-decision-charts-host';
  decisionChartCard.innerHTML = `
    <header class="dashboard-decision-charts-head">
      <div class="section-kicker">Synthèse exécutive</div>
      <h3>Vue décisionnelle</h3>
      <p class="dashboard-decision-charts-lead">Volume des non-conformités (prioritaires vs autres), typologie des signalements et scores d’audit — cliquez sur un graphique pour ouvrir le module lié.</p>
    </header>
    <div class="dashboard-decision-charts-grid">
      <div class="dashboard-decision-chart-panel">
        <div class="dashboard-decision-chart-panel__meta">
          <span class="dashboard-decision-chart-panel__tag">Conformité</span>
          <span class="dashboard-decision-chart-panel__title">Non-conformités créées — prioritaires vs autres (6 mois)</span>
        </div>
        <div class="dashboard-decision-chart-panel__canvas"><canvas data-dc-nc-stack></canvas></div>
      </div>
      <div class="dashboard-decision-chart-panel">
        <div class="dashboard-decision-chart-panel__meta">
          <span class="dashboard-decision-chart-panel__tag">Répartition</span>
          <span class="dashboard-decision-chart-panel__title">Typologie des signalements</span>
        </div>
        <div class="dashboard-decision-chart-panel__canvas"><canvas data-dc-risk></canvas></div>
      </div>
      <div class="dashboard-decision-chart-panel">
        <div class="dashboard-decision-chart-panel__meta">
          <span class="dashboard-decision-chart-panel__tag">Audit</span>
          <span class="dashboard-decision-chart-panel__title">Scores QHSE par période</span>
        </div>
        <div class="dashboard-decision-chart-panel__canvas"><canvas data-dc-score></canvas></div>
      </div>
    </div>
  `;
  const side = document.createElement('div');
  side.className = 'dashboard-decision-side';
  const iaBlock = document.createElement('article');
  iaBlock.className = 'dashboard-decision-insight';
  iaBlock.innerHTML = `
    <div class="dashboard-decision-insight-head">
      <span class="dashboard-decision-insight-badge dashboard-decision-insight-badge--ia">Assistant</span>
      <h3>Dérives & recommandations</h3>
    </div>
    <ul class="dashboard-decision-insight-list" data-dc-ia></ul>`;
  const priorityBlock = document.createElement('article');
  priorityBlock.className = 'dashboard-decision-insight dashboard-decision-insight--prio';
  priorityBlock.innerHTML = `
    <div class="dashboard-decision-insight-head">
      <span class="dashboard-decision-insight-badge dashboard-decision-insight-badge--prio">Priorités</span>
      <h3>Actions & signaux critiques</h3>
    </div>
    <ul class="dashboard-decision-insight-list" data-dc-prio></ul>`;
  side.append(iaBlock, priorityBlock);
  decisionGrid.append(decisionChartCard, side);
  decisionSection.append(decisionGrid);

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

  /** @type {{ ncStack: Chart|null; risk: Chart|null; score: Chart|null }} */
  const decisionCharts = { ncStack: null, risk: null, score: null };
  const iaList = iaBlock.querySelector('[data-dc-ia]');
  const prioList = priorityBlock.querySelector('[data-dc-prio]');

  function renderKpiFilteredModal(specKey) {
    kpiDetailDrawerSingleton?.open(specKey);
  }

  function updateDecisionAlerts(stats, incidents, actions, ncs, audits) {
    const monthly = buildIncidentMonthlySeries(incidents);
    const crit = Array.isArray(stats?.criticalIncidents) ? stats.criticalIncidents.length : 0;
    const late = asDashboardCount(stats?.overdueActions);
    const ncOpen = ncs.filter(isNcOpen).length;
    const scopeEmpty = dashboardKpiScopeEmptyLabel();
    const cards = [
      { k: 'Incidents critiques', v: crit, tone: toneByValue(crit, 1, 2), kpi: 'incidents', impact: guessImpactedSite(incidents) },
      { k: 'Actions en retard', v: late, tone: toneByValue(late, 1, 3), kpi: 'actionsLate', impact: guessImpactedSite(actions) },
      { k: 'NC ouvertes', v: ncOpen, tone: toneByValue(ncOpen, 1, 3), kpi: 'ncOpen', impact: guessImpactedSite(ncs) }
    ];
    decisionAlerts.innerHTML = cards
      .map((c) => {
        if (c.kpi === 'actionsLate' && c.v === 0) {
          return `<article class="dashboard-decision-alert dashboard-decision-alert--zero-success" data-kpi-open="${escapeHtml(
            c.kpi
          )}" role="button" tabindex="0">
          <div class="dashboard-decision-alert__k">${escapeHtml(c.k)}</div>
          <div class="dashboard-decision-alert__success-msg">Aucune action en retard</div>
        </article>`;
        }
        const zeroHint =
          c.v === 0
            ? `<div class="dashboard-decision-alert__empty-hint">${escapeHtml(scopeEmpty)}</div>`
            : '';
        return `<article class="dashboard-decision-alert dashboard-decision-alert--${c.tone}" data-kpi-open="${escapeHtml(
          c.kpi
        )}" role="button" tabindex="0">
          <div class="dashboard-decision-alert__k">${escapeHtml(c.k)}</div>
          <div class="dashboard-decision-alert__v">${escapeHtml(String(c.v))}</div>
          ${zeroHint}
          <div class="dashboard-kpi-subline"><span>${escapeHtml(computeDeltaLabel(c.v))}</span><span>${escapeHtml(c.impact)}</span></div>
        </article>`;
      })
      .join('');
    decisionAlerts.querySelectorAll('[data-kpi-open]').forEach((el) => {
      const open = () => renderKpiFilteredModal(el.getAttribute('data-kpi-open') || 'incidents');
      el.addEventListener('click', open);
      el.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          open();
        }
      });
    });

    const ncStackCtx = decisionChartCard.querySelector('[data-dc-nc-stack]');
    const riskCtx = decisionChartCard.querySelector('[data-dc-risk]');
    const scoreCtx = decisionChartCard.querySelector('[data-dc-score]');
    const ncSeries = buildNcMajorMinorMonthlySeries(ncs, 6);
    const riskTypes = buildTopIncidentTypes(incidents).slice(0, 5);
    const auditScores = trimTrailingZeroAuditScores(buildAuditScoreSeriesFromAudits(audits).slice(-6));
    const dcTick = getCssVar('--text-secondary', '#64748b');
    const dcGrid = `color-mix(in srgb, ${getCssVar('--border-color', '#e2e8f0')} 50%, transparent)`;
    const sliceBorder = getCssVar('--border-color', '#e2e8f0');
    if (decisionCharts.ncStack) decisionCharts.ncStack.destroy();
    if (decisionCharts.risk) decisionCharts.risk.destroy();
    if (decisionCharts.score) decisionCharts.score.destroy();
    if (ncStackCtx instanceof HTMLCanvasElement) {
      const ncLabels = ncSeries.labels;
      const ncMajor = ncSeries.major;
      const ncMinor = ncSeries.minor;
      decisionCharts.ncStack = new Chart(ncStackCtx, {
        type: 'bar',
        data: {
          labels: ncLabels,
          datasets: [
            {
              label: 'Autres NC',
              data: ncMinor,
              stack: 'nc',
              backgroundColor: (ctx) => {
                const c = ctx.chart.ctx;
                const h = ctx.chart.height || 160;
                const g = c.createLinearGradient(0, 0, 0, h);
                g.addColorStop(0, 'rgba(99, 102, 241, 0.55)');
                g.addColorStop(1, 'rgba(129, 140, 248, 0.88)');
                return g;
              },
              borderColor: getCssVar('--border-color', '#e2e8f0'),
              borderWidth: 0,
              borderRadius: { topLeft: 0, topRight: 0, bottomLeft: 10, bottomRight: 10 },
              borderSkipped: false,
              maxBarThickness: 36
            },
            {
              label: 'NC prioritaires',
              data: ncMajor,
              stack: 'nc',
              backgroundColor: (ctx) => {
                const c = ctx.chart.ctx;
                const h = ctx.chart.height || 160;
                const g = c.createLinearGradient(0, 0, 0, h);
                g.addColorStop(0, 'rgba(252, 165, 165, 0.95)');
                g.addColorStop(1, 'rgba(220, 38, 38, 0.92)');
                return g;
              },
              borderColor: getCssVar('--border-color', '#e2e8f0'),
              borderWidth: 0,
              borderRadius: { topLeft: 10, topRight: 10, bottomLeft: 0, bottomRight: 0 },
              borderSkipped: false,
              maxBarThickness: 36
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { mode: 'index', intersect: false },
          animation: { duration: 620, easing: 'easeOutQuart' },
          layout: { padding: { top: 8, bottom: 4 } },
          font: DC_CHART_FONT,
          plugins: {
            legend: {
              display: true,
              position: 'top',
              align: 'end',
              labels: {
                color: dcTick,
                boxWidth: 10,
                boxHeight: 10,
                padding: 12,
                usePointStyle: true,
                pointStyle: 'rectRounded',
                font: DC_CHART_FONT
              }
            },
            tooltip: {
              backgroundColor: getCssVar('--surface-2', '#f1f5f9'),
              titleColor: getCssVar('--text-primary', '#1e293b'),
              bodyColor: getCssVar('--text-muted', '#64748b'),
              borderColor: getCssVar('--border-color', '#e2e8f0'),
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                title: (ctx) => `Période : ${ctx?.[0]?.label || 'N/A'}`,
                footer: (items) => {
                  if (!items?.length) return '';
                  let sum = 0;
                  items.forEach((it) => {
                    sum += Number(it.parsed.y) || 0;
                  });
                  return `Total NC : ${sum}`;
                },
                label: (ctx) => {
                  const v = ctx.parsed.y ?? 0;
                  return `${ctx.dataset.label} : ${v}`;
                }
              }
            }
          },
          scales: {
            x: {
              stacked: true,
              grid: { display: false },
              ticks: { color: dcTick, font: DC_CHART_FONT, maxRotation: 0, autoSkipPadding: 8 }
            },
            y: {
              stacked: true,
              beginAtZero: true,
              grid: { color: dcGrid, drawBorder: false },
              ticks: { color: dcTick, font: DC_CHART_FONT, precision: 0 }
            }
          },
          onHover: (e, elements) => {
            if (e?.native?.target) e.native.target.style.cursor = elements?.length ? 'pointer' : 'default';
          },
          onClick: (_evt, elements) => {
            const el = elements?.[0];
            const idx = el?.index;
            const period = idx != null ? ncLabels[idx] : null;
            const tier =
              el?.datasetIndex === 1 ? 'prioritaire' : el?.datasetIndex === 0 ? 'autre' : null;
            pushDashboardIntent({
              source: 'dashboard',
              chart: 'nc_major_minor_trend',
              period,
              tier
            });
            window.location.hash = 'audits';
          }
        }
      });
    }
    if (riskCtx instanceof HTMLCanvasElement) {
      decisionCharts.risk = new Chart(riskCtx, {
        type: 'doughnut',
        data: {
          labels: riskTypes.map((r) => r.type),
          datasets: [
            {
              data: riskTypes.map((r) => r.count),
              backgroundColor: ['#ef4444', '#f97316', '#fbbf24', '#34d399', '#38bdf8'],
              borderColor: sliceBorder,
              borderWidth: 2,
              hoverOffset: 7
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '62%',
          animation: { duration: 520, easing: 'easeOutQuart' },
          layout: { padding: { bottom: 4 } },
          plugins: {
            legend: {
              position: 'bottom',
              labels: {
                color: dcTick,
                boxWidth: 10,
                boxHeight: 10,
                padding: 14,
                usePointStyle: true,
                pointStyle: 'rectRounded',
                font: DC_CHART_FONT
              }
            },
            tooltip: {
              backgroundColor: getCssVar('--surface-2', '#f1f5f9'),
              titleColor: getCssVar('--text-primary', '#1e293b'),
              bodyColor: getCssVar('--text-muted', '#64748b'),
              borderColor: getCssVar('--border-color', '#e2e8f0'),
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (ctx) => `${ctx.label} : ${ctx.parsed} cas`
              }
            }
          },
          onHover: (e, elements) => {
            if (e?.native?.target) e.native.target.style.cursor = elements?.length ? 'pointer' : 'default';
          },
          onClick: (_evt, elements) => {
            const idx = elements?.[0]?.index;
            const riskType = idx != null ? riskTypes[idx]?.type : null;
            pushDashboardIntent({ source: 'dashboard', chart: 'risk_distribution', riskType });
            window.location.hash = 'risks';
          }
        }
      });
    }
    if (scoreCtx instanceof HTMLCanvasElement) {
      decisionCharts.score = new Chart(scoreCtx, {
        type: 'bar',
        data: {
          labels: auditScores.map((a) => a.label),
          datasets: [
            {
              label: 'Score QHSE',
              data: auditScores.map((a) => a.value),
              backgroundColor: auditScores.map((a) =>
                a.value >= 80 ? 'rgba(34, 197, 94, 0.88)' : a.value >= 60 ? 'rgba(245, 158, 11, 0.9)' : 'rgba(239, 68, 68, 0.88)'
              ),
              borderRadius: 8,
              borderSkipped: false
            }
          ]
        },
        options: {
          maintainAspectRatio: false,
          animation: { duration: 520, easing: 'easeOutQuart' },
          layout: { padding: { top: 6 } },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: getCssVar('--surface-2', '#f1f5f9'),
              titleColor: getCssVar('--text-primary', '#1e293b'),
              bodyColor: getCssVar('--text-muted', '#64748b'),
              borderColor: getCssVar('--border-color', '#e2e8f0'),
              borderWidth: 1,
              padding: 12,
              cornerRadius: 10,
              callbacks: {
                label: (ctx) => `Score QHSE : ${ctx.parsed.y}%`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: dcTick, font: DC_CHART_FONT, maxRotation: 0, autoSkipPadding: 10 }
            },
            y: {
              min: 0,
              max: 100,
              grid: { color: dcGrid, drawBorder: false },
              ticks: { color: dcTick, font: DC_CHART_FONT, callback: (v) => `${v}%` }
            }
          },
          onHover: (e, elements) => {
            if (e?.native?.target) e.native.target.style.cursor = elements?.length ? 'pointer' : 'default';
          },
          onClick: (_evt, elements) => {
            const idx = elements?.[0]?.index;
            const period = idx != null ? auditScores[idx]?.label : null;
            pushDashboardIntent({ source: 'dashboard', chart: 'qhse_score', period });
            window.location.hash = 'audits';
          }
        }
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

    const permits = listPermits().slice(0, 400);
    const tiles = buildOperationalTiles({
      stats,
      incidents,
      actions,
      audits,
      ncs,
      permits,
      docs: kpiDashboardLists.docs || []
    });
    const opsScopeEmpty = dashboardKpiScopeEmptyLabel();
    opsGrid.innerHTML = tiles
      .map((t) => {
        const kpiOpen =
          t.page === 'incidents'
            ? 'incidents'
            : t.page === 'actions'
              ? 'actionsLate'
              : t.page === 'audits'
                ? 'auditsN'
                : t.page === 'risks'
                  ? 'incidentsCritical'
                  : 'actions';
        const impact = guessImpactedSite([...(incidents || []), ...(actions || []), ...(audits || [])]);
        if (t.k === 'Actions en retard' && t.v === 0) {
          return `<article class="dashboard-ops-card dashboard-ops-card--zero-success" data-ops-go="${escapeHtml(
            t.page
          )}" data-kpi-open="${escapeHtml(kpiOpen)}" role="button" tabindex="0" aria-label="Ouvrir ${escapeHtml(t.k)}">
          <div class="dashboard-ops-card__k">${escapeHtml(t.k)}</div>
          <div class="dashboard-ops-card__success-msg">Aucune action en retard</div>
        </article>`;
        }
        if (t.k === 'Risques critiques' && t.v === 0) {
          return `<article class="dashboard-ops-card dashboard-ops-card--zero-success" data-ops-go="${escapeHtml(
            t.page
          )}" data-kpi-open="${escapeHtml(kpiOpen)}" role="button" tabindex="0" aria-label="Ouvrir ${escapeHtml(t.k)}">
          <div class="dashboard-ops-card__k">${escapeHtml(t.k)}</div>
          <div class="dashboard-ops-card__success-msg">Aucun risque critique</div>
        </article>`;
        }
        const opsZeroHint =
          t.v === 0 ? `<div class="dashboard-ops-card__empty-hint">${escapeHtml(opsScopeEmpty)}</div>` : '';
        return `<article class="dashboard-ops-card dashboard-ops-card--${escapeHtml(t.tone)}" data-ops-go="${escapeHtml(
          t.page
        )}" data-kpi-open="${escapeHtml(kpiOpen)}" role="button" tabindex="0" aria-label="Ouvrir ${escapeHtml(t.k)}">
          <div class="dashboard-ops-card__k">${escapeHtml(t.k)}</div>
          <div class="dashboard-ops-card__v">${escapeHtml(String(t.v))}</div>
          ${opsZeroHint}
          <div class="dashboard-ops-card__d">${escapeHtml(t.d)}</div>
          <div class="dashboard-kpi-subline"><span>${escapeHtml(computeDeltaLabel(t.v))}</span><span>${escapeHtml(
            impact
          )}</span></div>
        </article>`;
      })
      .join('');
    opsGrid.querySelectorAll('[data-ops-go]').forEach((el) => {
      const go = () => {
        const key = el.getAttribute('data-kpi-open');
        if (key) {
          renderKpiFilteredModal(key);
          return;
        }
        const target = el.getAttribute('data-ops-go');
        if (target) window.location.hash = target;
      };
      el.addEventListener('click', go);
      el.addEventListener('keydown', (ev) => {
        if (ev.key === 'Enter' || ev.key === ' ') {
          ev.preventDefault();
          go();
        }
      });
    });

    const habRows = HABILITATIONS_DEMO_ROWS;
    const habKpi = computeHabilitationsKpis(habRows);
    habSummaryCard.innerHTML = `
      <div class="section-kicker">Alertes habilitations</div>
      <h3 style="margin:4px 0 8px">Postes critiques & conformité</h3>
      <div class="dashboard-hab-list">
        <article class="dashboard-hab-item"><strong>Habilitations expirées:</strong> ${habKpi.expirees}</article>
        <article class="dashboard-hab-item"><strong>Expirations sous 30 jours:</strong> ${habKpi.exp30}</article>
        <article class="dashboard-hab-item"><strong>Taux de conformité:</strong> ${habKpi.taux}%</article>
        <article class="dashboard-hab-item"><strong>Postes critiques non conformes:</strong> ${habKpi.blocCrit}</article>
        <article class="dashboard-hab-item"><strong>Sous-traitants incomplets:</strong> ${habKpi.sousTraitantsIncomplets}</article>
      </div>
      <div class="dashboard-hab-actions">
        <button type="button" class="btn btn-secondary" data-hab-intent="expired">Voir expirées</button>
        <button type="button" class="btn btn-secondary" data-hab-intent="expiring_30">Voir < 30 jours</button>
        <button type="button" class="btn btn-secondary" data-hab-intent="subcontractors_incomplete">Voir sous-traitants</button>
      </div>
    `;

    const bySite = computeHabilitationsBySite(habRows);
    habSiteCard.innerHTML = `
      <div class="section-kicker">Vue multi-sites</div>
      <h3 style="margin:4px 0 8px">Conformité par site</h3>
      <div class="dashboard-hab-sitebar">
        ${bySite
          .map(
            (s) => `
              <div class="dashboard-hab-sitebar-row">
                <div class="dashboard-hab-sitebar-top"><span>${escapeHtml(s.site)}</span><strong>${s.score}%</strong></div>
                <div class="dashboard-hab-sitebar-track"><div class="dashboard-hab-sitebar-fill" style="width:${Math.max(
                  0,
                  Math.min(100, Number(s.score) || 0)
                )}%"></div></div>
              </div>`
          )
          .join('')}
      </div>
      <div class="dashboard-hab-actions">
        <button type="button" class="btn btn-primary" data-hab-intent="open_module">Ouvrir Habilitations</button>
      </div>
    `;

    const openHab = (filter) => {
      pushDashboardIntent({ module: 'habilitations', filter });
      window.location.hash = 'habilitations';
    };
    [...habSummaryCard.querySelectorAll('[data-hab-intent]'), ...habSiteCard.querySelectorAll('[data-hab-intent]')].forEach((btn) => {
      btn.addEventListener('click', () => {
        const intent = btn.getAttribute('data-hab-intent') || 'open_module';
        openHab(intent);
      });
    });
  }

  /* Profondeur métier : tout le reste derrière le volet (données & updateDecisionAlerts inchangés). */
  extendedSection.append(
    opsCockpitSection,
    bandShortcuts,
    habilitationsSection,
    bandCriticalAlerts,
    systemSection,
    chartsSection,
    decisionSection,
    bandAnalysisLecture,
    bandCockpit,
    cockpitPremium.root,
    bandActivity,
    bandSecondary,
    bandAssistant
  );

  const executiveBand = document.createElement('div');
  executiveBand.className = 'dashboard-executive-surface';
  executiveBand.append(
    bandCeo,
    decisionAlertsBand,
    kpiSection,
    primaryChartSection,
    bandPriority,
    bandToday
  );

  const dashboardAiInsight = document.createElement('div');
  dashboardAiInsight.id = 'dashboard-ai-insight';
  dashboardAiInsight.className = 'dashboard-ai-insight qhse-page-advanced-only';

  page.append(connectivitySlot, pageViewBar, executiveBand, toggleRow, extendedSection, dashboardAiInsight);

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
    const scalarsQuiet =
      asDashboardCount(stats.incidents) === 0 &&
      asDashboardCount(stats.actions) === 0 &&
      asDashboardCount(stats.overdueActions) === 0 &&
      asDashboardCount(stats.nonConformities) === 0;
    if (n === 0 && scalarsQuiet) {
      kpiPriorityLine.textContent =
        'Aucune donnée sur ce périmètre — vérifiez le filtre site ou élargissez la vue.';
      kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--ok';
    } else if (n === 0) {
      kpiPriorityLine.textContent = 'Aucun élément critique à traiter en priorité aujourd’hui.';
      kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--ok';
    } else {
      kpiPriorityLine.textContent = `${n} élément${n > 1 ? 's' : ''} critique${n > 1 ? 's' : ''} à traiter aujourd’hui`;
      kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--attention';
    }
  }

  function applyStatsToKpis(data) {
    const scopeHint = dashboardKpiScopeEmptyLabel();

    const incN = asDashboardCount(data.incidents);
    kpiValues.incidents.textContent = formatDashboardCount(data.incidents);
    const incHint = kpiEmptyHints.incidents;
    if (incHint) {
      incHint.hidden = incN !== 0;
      incHint.textContent = incN === 0 ? scopeHint : '';
    }

    const lateN = asDashboardCount(data.overdueActions);
    const lateCard = kpiValues.actionsLate?.closest('.dashboard-kpi-card');
    const lateDefault = lateCard?.querySelector('.dashboard-kpi-default');
    const lateSuccess = lateCard?.querySelector('.dashboard-kpi-zero-success');
    const lateNote = lateCard?.querySelector('.metric-note');
    if (lateSuccess && lateDefault && lateCard && kpiValues.actionsLate) {
      if (lateN === 0) {
        lateDefault.hidden = true;
        if (lateNote) lateNote.hidden = true;
        lateSuccess.hidden = false;
        kpiToneClasses.forEach((c) => lateCard.classList.remove(c));
        lateCard.classList.add('dashboard-kpi-card--tone-success');
      } else {
        lateDefault.hidden = false;
        if (lateNote) lateNote.hidden = false;
        lateSuccess.hidden = true;
        kpiToneClasses.forEach((c) => lateCard.classList.remove(c));
        lateCard.classList.add('dashboard-kpi-card--tone-red');
        kpiValues.actionsLate.textContent = formatDashboardCount(data.overdueActions);
      }
    } else if (kpiValues.actionsLate) {
      kpiValues.actionsLate.textContent = formatDashboardCount(data.overdueActions);
    }

    const lateTone = toneByValue(data.overdueActions, 1, 3);
    const incTone = toneByValue(data.incidents, 3, 8);
    [kpiValues.actionsLate?.parentElement, kpiValues.incidents?.parentElement].forEach((el) => {
      if (!el) return;
      el.classList.remove('dashboard-kpi-card--crit');
    });
    if (lateN > 0 && lateTone === 'red') kpiValues.actionsLate?.parentElement?.classList.add('dashboard-kpi-card--crit');
    if (incTone === 'red') kpiValues.incidents?.parentElement?.classList.add('dashboard-kpi-card--crit');

    updateKpiPriorityLine();
  }

  function applyEnrichmentKpis(ncList, auditList, ncTotalAggregate) {
    const scopeHint = dashboardKpiScopeEmptyLabel();
    if (Array.isArray(ncList)) {
      const n = ncList.filter(isNcOpen).length;
      kpiValues.ncOpen.textContent = String(n);
      const ncHint = kpiEmptyHints.ncOpen;
      if (ncHint) {
        ncHint.hidden = n !== 0;
        ncHint.textContent = n === 0 ? scopeHint : '';
      }
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
      const audHint = kpiEmptyHints.auditsN;
      if (audHint) {
        audHint.hidden = true;
        audHint.textContent = '';
      }
    } else {
      kpiValues.auditScore.textContent = '—';
      kpiValues.auditsN.textContent = '0';
      const audHint = kpiEmptyHints.auditsN;
      if (audHint) {
        audHint.hidden = false;
        audHint.textContent = scopeHint;
      }
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
      fetchJsonListWithRetry('/api/nonconformities?limit=150'),
      fetchJsonListWithRetry('/api/controlled-documents?type=fds&limit=300'),
      fetchJsonListWithRetry('/api/risks?limit=300')
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
    const docsR = listVal(4);
    const risksR = listVal(5);
    if (listResults.some((r) => r.status === 'rejected')) {
      showToast('Certaines listes n’ont pas pu être chargées — affichage partiel.', 'warning');
    }

    const incidents = incR || DASHBOARD_DEMO_LISTS.incidents;
    const actions = actR || DASHBOARD_DEMO_LISTS.actions;
    const audits = audR || DASHBOARD_DEMO_LISTS.audits;
    const ncs = ncR || DASHBOARD_DEMO_LISTS.ncs;
    const docs = docsR || [];

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
    } else {
      lastStats = reconcileDashboardStatsWithLists(lastStats, incidents, actions, ncs);
      applyStatsToKpis(lastStats);
      shortcutsBundle.updateShortcutBadges({
        overdueCount: lastStats.overdueActions ?? 0,
        ncCount: lastStats.nonConformities ?? 0
      });
      todayBlock.update({
        sessionUser: getSessionUser(),
        incidents: lastStats.incidents,
        overdueActionItems: lastStats.overdueActionItems,
        criticalIncidents: lastStats.criticalIncidents
      });
    }

    kpiDashboardLists.incidents = incidents;
    kpiDashboardLists.actions = actions;
    kpiDashboardLists.audits = audits;
    kpiDashboardLists.ncs = ncs;
    kpiDashboardLists.docs = docs;

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
        risks: Array.isArray(risksR) ? risksR : null,
        siteLabel: siteName
      });
      pilotageAssistant.update(snap);
    } catch (asstErr) {
      console.warn('[dashboard] assistant snapshot', asstErr);
    }
    void loadDashboardInsight(
      buildMistralDashboardStatsPayload(lastStats, audits, risksR || [])
    );
    await tfTgMini.refresh();
    dismissKpiSkeleton();
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
        dismissKpiSkeleton();
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
      dismissKpiSkeleton();
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
