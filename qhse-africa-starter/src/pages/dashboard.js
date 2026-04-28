import { getSessionUser } from '../data/sessionUser.js';
import { createDashboardTodayBlock } from '../components/dashboardTodayBlock.js';
import { appState } from '../utils/state.js';
import { consumeDashboardIntent } from '../utils/dashboardNavigationIntent.js';
import { scheduleScrollIntoView } from '../utils/navScrollAnchor.js';
import { qhseNavigate } from '../utils/qhseNavigate.js';
import { showToast } from '../components/toast.js';
import { ensureDashboardStyles } from '../components/dashboardStyles.js';
import { createDashboardCeoHero } from '../components/dashboardCeoHero.js';
import { createDashboardAlertsPriorites } from '../components/dashboardAlertsPriorites.js';
import { qhseFetch } from '../utils/qhseFetch.js';
import { getApiBase } from '../config.js';
import { withSiteQuery } from '../utils/siteFilter.js';
import {
  buildIncidentMonthlySeries,
  createActionsMixChart,
  createDashboardLineChart,
  createIncidentTypeBreakdown,
  createPilotageLoadMixChart
} from '../components/dashboardCharts.js';
import { createDashboardAuditChartBlock } from '../components/dashboardAuditChartBlock.js';
import { createDashboardActivitySection } from '../components/dashboardActivity.js';
import { createDashboardCockpit } from '../components/dashboardCockpit.js';
import { createDashboardCockpitPremium } from '../components/dashboardCockpitPremium.js';
import { createDashboardExecutivePanel } from '../components/dashboardExecutivePanel.js';
import { createDashboardShortcutsSection } from '../components/dashboardShortcuts.js';
import { createDashboardSystemStatus } from '../components/dashboardSystemStatus.js';
import { createDashboardVigilancePoints } from '../components/dashboardVigilancePoints.js';
import { createDashboardAutoAnalysis } from '../components/dashboardAutoAnalysis.js';
import { createDashboardPriorityNow } from '../components/dashboardPriorityNow.js';
import { createDashboardPilotageAssistant } from '../components/dashboardPilotageAssistant.js';
import {
  buildAssistantSnapshot,
  buildDashboardPilotageAiContext,
  fetchPilotageAiSuggestActions
} from '../services/qhsePilotageIntelligence.service.js';
import { createDashboardBlockActions } from '../utils/dashboardBlockActions.js';
import { mountPageViewModeSwitch } from '../utils/pageViewMode.js';
import { createKpiDetailDrawer } from '../components/kpiDetailDrawer.js';
import {
  asDashboardCount,
  reconcileDashboardStatsWithLists,
  deriveDashboardStatsFromLists
} from '../utils/reconcileDashboardStats.js';
import { escapeHtml } from '../utils/escapeHtml.js';
import { initDashboardCharts } from '../components/dashboardCharts.js';
import { refreshPermitsFromApi } from '../services/ptw.service.js';
import { renderKpiCards } from '../components/dashboardKpiCards.js';
import { createDashboardTfTgMiniRow } from '../components/tfTgKpi.js';
import { refreshCharts as refreshChartsModule } from './dashboard/chartsSection.js';
import { refreshActivity as refreshActivityModule } from './dashboard/actionsWidget.js';
import { updateDecisionAlerts as updateDecisionAlertsModule } from './dashboard/decisionPanel.js';
import {
  updateKpiPriorityLine as updateKpiPriorityLineModule,
  applyStatsToKpis as applyStatsToKpisModule,
  applyEnrichmentKpis as applyEnrichmentKpisModule,
  dismissKpiSkeleton as dismissKpiSkeletonModule,
  renderKpiFilteredModal as renderKpiFilteredModalModule
} from './dashboard/kpiCards.js';

/* Extraction : navigation depuis KPI, fetch listes avec retry, métriques / normalisation stats (voir utils/dashboard*.js) */
import { fetchJsonListWithRetry, qhseFetchWithNetworkRetry } from '../utils/dashboardFetchHelpers.js';
import {
  normalizeDashboardPayload,
  buildMistralDashboardStatsPayload,
  isDashboardSignalsTotallyEmpty
} from '../utils/dashboardMetrics.js';
import { isDemoMode } from '../services/demoMode.service.js';

const DASH_DECISION_STYLE_ID = 'qhse-dashboard-decision-styles';
const DASH_INTELLIGENCE_STYLE_ID = 'qhse-dashboard-intelligence-styles';
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
/* État critique : lisible sans halo « démo », renforce bordure gauche + léger fond. */
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
/* Blocs pilot : surface plus « papier » que « vitrine », hiérarchie portée par le titre, pas par triple ombre. */
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

function ensureDashboardIntelligenceStyles() {
  if (document.getElementById(DASH_INTELLIGENCE_STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = DASH_INTELLIGENCE_STYLE_ID;
  el.textContent = `
.dashboard-intel{border-radius:16px;border:1px solid color-mix(in srgb, #38bdf8 18%, var(--color-border-tertiary));background:linear-gradient(180deg,color-mix(in srgb,var(--color-background-secondary) 96%, rgba(56,189,248,.06)) 0%,var(--color-background-primary) 100%);box-shadow:0 18px 40px -34px rgba(0,0,0,.55);overflow:hidden}
.dashboard-intel__head{display:flex;justify-content:space-between;gap:14px;align-items:flex-start;padding:16px 16px 12px}
.dashboard-intel__kicker{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3)}
.dashboard-intel__title{margin:6px 0 0;font-size:16px;font-weight:900;letter-spacing:-.02em;color:var(--text)}
.dashboard-intel__sub{margin:6px 0 0;font-size:12px;line-height:1.45;color:var(--text2);max-width:62ch}
.dashboard-intel__score{display:grid;gap:4px;align-content:start;padding:10px 12px;border-radius:14px;border:1px solid color-mix(in srgb, var(--color-border-tertiary) 84%, transparent);background:color-mix(in srgb,var(--color-background-secondary) 94%, transparent);min-width:132px}
.dashboard-intel__scorev{font-size:22px;font-weight:950;line-height:1;color:var(--text)}
.dashboard-intel__scorelbl{font-size:10px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;color:var(--text3)}
.dashboard-intel__scoremeta{font-size:11px;color:var(--text2)}
.dashboard-intel__body{display:grid;gap:12px;padding:0 16px 16px}
.dashboard-intel__grid{display:grid;grid-template-columns:1.2fr .8fr;gap:12px}
.dashboard-intel__panel{border-radius:14px;border:1px solid color-mix(in srgb, var(--color-border-tertiary) 86%, transparent);background:color-mix(in srgb,var(--color-background-secondary) 95%, transparent);padding:12px}
.dashboard-intel__h{margin:0 0 8px;font-size:12px;font-weight:900;letter-spacing:-.01em;color:var(--text)}
.dashboard-intel__list{margin:0;padding:0;list-style:none;display:grid;gap:8px}
.dashboard-intel__empty{margin:0;font-size:12px;color:var(--text2);opacity:.92}
.dashboard-intel__cta-row{display:flex;justify-content:flex-end;gap:10px;padding:0 16px 16px}
.dashboard-intel__cta{font-size:12px;padding:8px 10px;border-radius:10px;border:1px solid color-mix(in srgb,#38bdf8 36%, var(--color-border-tertiary));background:color-mix(in srgb,#0ea5e9 14%, var(--color-background-primary));color:var(--text);cursor:pointer}
.dashboard-intel__cta:hover{transform:translateY(-1px)}
.intel-alert{display:grid;gap:4px;padding:10px 10px 10px 12px;border-radius:12px;border:1px solid color-mix(in srgb, var(--color-border-tertiary) 82%, transparent);background:color-mix(in srgb,var(--color-background-primary) 92%, transparent)}
.intel-alert__top{display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.intel-alert__sev{font-size:9px;font-weight:900;letter-spacing:.12em;text-transform:uppercase;padding:3px 8px;border-radius:999px;border:1px solid var(--color-border-secondary);color:var(--text2);background:var(--color-background-primary)}
.intel-alert__sev--critical,.intel-alert__sev--high{border-color:color-mix(in srgb,#ef4444 42%, var(--color-border-secondary));color:color-mix(in srgb,#fecaca 88%, var(--text));background:color-mix(in srgb,#ef4444 10%, var(--color-background-primary))}
.intel-alert__sev--medium{border-color:color-mix(in srgb,#fb923c 45%, var(--color-border-secondary));color:color-mix(in srgb,#fdba74 92%, var(--text));background:color-mix(in srgb,#f97316 10%, var(--color-background-primary))}
.intel-alert__sev--low{border-color:color-mix(in srgb,#22c55e 40%, var(--color-border-secondary));color:color-mix(in srgb,#bbf7d0 90%, var(--text));background:color-mix(in srgb,#22c55e 10%, var(--color-background-primary))}
.intel-alert__src{font-size:11px;color:var(--text3)}
.intel-alert__ttl{font-size:13px;font-weight:850;color:var(--text);letter-spacing:-.01em}
.intel-alert__desc{font-size:12px;line-height:1.45;color:var(--text2)}
.intel-alert__meta{display:flex;gap:10px;flex-wrap:wrap;font-size:11px;color:var(--text3)}
.intel-alert__acts{display:flex;justify-content:flex-end;gap:8px;margin-top:6px}
.intel-alert__btn{font-size:12px;padding:7px 10px;border-radius:10px;border:1px solid color-mix(in srgb,var(--color-border-tertiary) 82%, transparent);background:color-mix(in srgb,var(--color-background-secondary) 92%, transparent);color:var(--text);cursor:pointer}
.intel-alert__btn:hover{transform:translateY(-1px)}
.intel-alert__btn--primary{border-color:color-mix(in srgb,#38bdf8 40%, var(--color-border-tertiary));background:color-mix(in srgb,#0ea5e9 14%, var(--color-background-primary));}
.intel-alert__btn--secondary{border-color:color-mix(in srgb,var(--color-border-tertiary) 88%, transparent);background:transparent}
.intel-anom{font-size:12px;line-height:1.45;color:var(--text2);padding:10px 12px;border-radius:12px;border:1px solid color-mix(in srgb, var(--color-border-tertiary) 86%, transparent);background:color-mix(in srgb,var(--color-background-primary) 92%, transparent)}
.intel-anom strong{color:var(--text);font-weight:900}
@media (max-width: 980px){.dashboard-intel__grid{grid-template-columns:1fr}}

.intel-modal{width:min(980px,calc(100vw - 22px));border-radius:16px;border:1px solid color-mix(in srgb, #38bdf8 18%, var(--color-border-tertiary));background:color-mix(in srgb,var(--color-background-primary) 92%, #0b1220 8%);color:var(--text);padding:0;box-shadow:0 22px 80px -40px rgba(0,0,0,.75)}
.intel-modal::backdrop{background:rgba(2,6,23,.68)}
.intel-modal__head{display:flex;justify-content:space-between;gap:12px;align-items:flex-start;padding:16px 16px 12px;border-bottom:1px solid color-mix(in srgb,var(--color-border-tertiary) 85%, transparent)}
.intel-modal__title{margin:0;font-size:16px;font-weight:950;letter-spacing:-.02em}
.intel-modal__sub{margin:6px 0 0;font-size:12px;line-height:1.45;color:var(--text2)}
.intel-modal__close{border:1px solid color-mix(in srgb,var(--color-border-tertiary) 82%, transparent);background:color-mix(in srgb,var(--color-background-secondary) 92%, transparent);color:var(--text);border-radius:10px;padding:7px 10px;cursor:pointer}
.intel-modal__body{padding:12px 16px 16px;display:grid;gap:12px}
.intel-modal__filters{display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end}
.intel-modal__filters label{display:grid;gap:4px;font-size:11px;color:var(--text3)}
.intel-modal__filters select{min-width:180px;border-radius:10px;border:1px solid color-mix(in srgb,var(--color-border-tertiary) 86%, transparent);background:color-mix(in srgb,var(--color-background-secondary) 92%, transparent);color:var(--text);padding:8px 10px}
.intel-modal__cols{display:grid;grid-template-columns:1.3fr .7fr;gap:12px}
.intel-modal__panel{border-radius:14px;border:1px solid color-mix(in srgb, var(--color-border-tertiary) 86%, transparent);background:color-mix(in srgb,var(--color-background-secondary) 95%, transparent);padding:12px}
.intel-modal__h{margin:0 0 8px;font-size:12px;font-weight:900;color:var(--text)}
.intel-modal__empty{margin:0;font-size:12px;line-height:1.45;color:var(--text2)}
@media (max-width: 980px){.intel-modal__cols{grid-template-columns:1fr}.intel-modal{width:calc(100vw - 12px)}}
`;
  document.head.append(el);
}

function safeText(x, max = 240) {
  const s = String(x ?? '').trim();
  if (!s) return '';
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

function formatGeneratedAt(iso) {
  if (!iso) return '';
  const d = new Date(String(iso));
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('fr-FR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function scoreTone(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) return 'low';
  if (n < 40) return 'critical';
  if (n < 60) return 'high';
  if (n < 80) return 'medium';
  return 'low';
}

function addDaysToYmd(days) {
  const n = Math.max(0, Math.round(Number(days) || 0));
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + n);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${dd}`;
}

function priorityFromSeverity(sev) {
  const s = String(sev || '').toLowerCase();
  if (s.includes('crit')) return 'critique';
  if (s.includes('high')) return 'haute';
  if (s.includes('med')) return 'normale';
  if (s.includes('low')) return 'basse';
  // fallback: accepte déjà "haute/critique" etc.
  if (s.includes('haut')) return 'haute';
  if (s.includes('bas')) return 'basse';
  return 'normale';
}

function originFromSourceModule(sourceModule) {
  const s = String(sourceModule || '').toLowerCase();
  if (s.includes('risk')) return 'risk';
  if (s.includes('audit')) return 'audit';
  if (s.includes('incident')) return 'incident';
  return 'other';
}

function severityRank(sev) {
  const s = String(sev || '').toLowerCase();
  if (s === 'critical' || s.includes('crit')) return 4;
  if (s === 'high') return 3;
  if (s === 'medium') return 2;
  if (s === 'low') return 1;
  return 0;
}

function normalizeSourceKey(sourceModule) {
  const s = String(sourceModule || '').toLowerCase();
  if (!s) return '';
  if (s.includes('risk')) return 'risks';
  if (s.includes('action')) return 'actions';
  if (s.includes('incident')) return 'incidents';
  if (s.includes('audit')) return 'audits';
  if (s.includes('controlled')) return 'controlled_documents';
  if (s.includes('product')) return 'products';
  return s.replace(/[^a-z_]+/g, '_').slice(0, 40);
}

function labelSeverityFr(sevKey) {
  const s = String(sevKey || '').toLowerCase();
  if (s === 'critical' || s.includes('crit')) return 'Critique';
  if (s === 'high') return 'Élevée';
  if (s === 'medium') return 'Moyenne';
  if (s === 'low') return 'Faible';
  return 'Non disponible';
}

function labelSourceModuleFr(sourceModule) {
  const k = normalizeSourceKey(sourceModule);
  switch (k) {
    case 'risks':
      return 'Risques';
    case 'actions':
      return 'Actions';
    case 'incidents':
      return 'Incidents';
    case 'audits':
      return 'Audits';
    case 'controlled_documents':
      return 'Documents';
    case 'products':
      return 'Produits';
    default:
      return k ? k.replace(/_/g, ' ').slice(0, 60) : 'Non renseigné';
  }
}

function createDashboardIntelligenceWidget() {
  ensureDashboardStyles();
  ensureDashboardIntelligenceStyles();
  const root = document.createElement('article');
  root.className = 'dashboard-intel';
  root.innerHTML = `
    <div class="dashboard-intel__head">
      <div>
        <div class="dashboard-intel__kicker">Signaux intelligents</div>
        <h3 class="dashboard-intel__title">Cockpit QHSE intelligent</h3>
        <p class="dashboard-intel__sub">
          Lecture automatique des risques, actions, audits et documents, sans action automatique.
        </p>
      </div>
      <div class="dashboard-intel__score" aria-label="Score QHSE">
        <div class="dashboard-intel__scorev">Non disponible</div>
        <div class="dashboard-intel__scorelbl">Score QHSE</div>
        <div class="dashboard-intel__scoremeta">Non disponible</div>
      </div>
    </div>
    <div class="dashboard-intel__body">
      <div class="dashboard-intel__grid">
        <section class="dashboard-intel__panel" aria-label="Alertes intelligentes">
          <h4 class="dashboard-intel__h">Alertes</h4>
          <ul class="dashboard-intel__list" data-intel-alerts></ul>
          <p class="dashboard-intel__empty" data-intel-empty hidden>Aucune alerte intelligente détectée.</p>
        </section>
        <section class="dashboard-intel__panel" aria-label="Anomalies" data-intel-anoms-panel hidden>
          <h4 class="dashboard-intel__h">Anomalies</h4>
          <div class="dashboard-intel__list" data-intel-anoms></div>
        </section>
      </div>
    </div>
  `;

  const scoreV = root.querySelector('.dashboard-intel__scorev');
  const scoreMeta = root.querySelector('.dashboard-intel__scoremeta');
  const alertsList = root.querySelector('[data-intel-alerts]');
  const empty = root.querySelector('[data-intel-empty]');
  const anomsPanel = root.querySelector('[data-intel-anoms-panel]');
  const anomsHost = root.querySelector('[data-intel-anoms]');
  /** @type {HTMLDialogElement | null} */
  let modal = null;
  /** @type {any} */
  let lastIntel = null;

  function resolveSourceNavigation(alert) {
    const srcModule = safeText(alert?.sourceModule || '', 80) || '';
    const k = normalizeSourceKey(srcModule);
    const srcId = alert?.sourceId != null && String(alert.sourceId).trim() ? String(alert.sourceId).trim() : '';
    const srcRef =
      alert?.sourceRef != null && String(alert.sourceRef).trim() ? String(alert.sourceRef).trim() : '';
    const srcTitle =
      safeText(alert?.sourceTitle || alert?.title || '', 240) ||
      safeText(alert?.suggestedActionTitle || '', 240) ||
      '';

    if (k === 'risks') {
      return {
        pageId: 'risks',
        intent: {
          ...(srcId ? { focusRiskId: srcId } : {}),
          ...(srcTitle ? { focusRiskTitle: srcTitle } : {}),
          source: 'dashboard_intelligence_open_source'
        }
      };
    }
    if (k === 'actions') {
      return {
        pageId: 'actions',
        intent: {
          skipDefaults: true,
          ...(srcId ? { focusActionId: srcId } : {}),
          ...(srcTitle ? { focusActionTitle: srcTitle } : {}),
          source: 'dashboard_intelligence_open_source'
        }
      };
    }
    if (k === 'incidents') {
      return {
        pageId: 'incidents',
        intent: {
          ...(srcRef ? { focusIncidentRef: srcRef } : {}),
          ...(srcId ? { focusIncidentId: srcId } : {}),
          ...(srcTitle ? { focusIncidentHintTitle: srcTitle.slice(0, 160) } : {}),
          source: 'dashboard_intelligence_open_source'
        }
      };
    }
    if (k === 'audits') {
      return {
        pageId: 'audits',
        intent: {
          ...(srcId ? { focusAuditId: srcId } : {}),
          ...(srcRef ? { focusAuditRef: srcRef } : {}),
          ...(srcTitle ? { focusAuditTitle: srcTitle.slice(0, 200) } : {}),
          source: 'dashboard_intelligence_open_source'
        }
      };
    }
    if (k === 'controlled_documents' || k === 'products') {
      return {
        pageId: 'products',
        intent: {
          productsFdsValidity: 'review',
          ...(alert?.linkedRiskId ? { linkedRiskId: String(alert.linkedRiskId) } : {}),
          ...(alert?.linkedRiskTitle ? { linkedRiskTitle: String(alert.linkedRiskTitle) } : {}),
          source: 'dashboard_intelligence_open_source'
        }
      };
    }
    return null;
  }

  function openAlertSource(alert) {
    const nav = resolveSourceNavigation(alert);
    const srcLabel = labelSourceModuleFr(alert?.sourceModule);
    if (!nav) {
      showToast(`Source indisponible. Ouvrez le module : ${srcLabel}.`, 'info');
      const fallback = normalizeSourceKey(alert?.sourceModule);
      if (fallback) qhseNavigate(fallback, { source: 'dashboard_intelligence_open_source_fallback' });
      return;
    }
    qhseNavigate(nav.pageId, nav.intent || {});
  }

  async function openCorrectiveActionFromAlert(alert) {
    const ttl = safeText(alert?.suggestedActionTitle || '', 240);
    if (!ttl) return;

    const srcModule = safeText(alert?.sourceModule || '', 80) || 'Non renseigné';
    const srcId = alert?.sourceId != null && String(alert.sourceId).trim() ? String(alert.sourceId).trim() : '';
    const dueIn = alert?.suggestedDueInDays;
    const dueDate = dueIn != null && Number.isFinite(Number(dueIn)) ? addDaysToYmd(Number(dueIn)) : '';
    const sev = String(alert?.severity || '').toLowerCase() || 'low';
    const priority = priorityFromSeverity(sev);
    const origin = originFromSourceModule(srcModule);

    const ctxLines = [
      safeText(alert?.description || '', 600) || 'Non disponible',
      '',
      `Contexte : alerte intelligence QHSE (lecture seule).`,
      `Source : ${srcModule}${srcId ? ` · ${srcId}` : ''}.`,
      `Validation humaine requise avant application terrain.`
    ];
    const description = ctxLines.join('\n');

    try {
      const [{ openActionCreateDialog }, { fetchUsers }] = await Promise.all([
        import('../components/actionCreateDialog.js'),
        import('../services/users.service.js')
      ]);
      const users = await fetchUsers().catch(() => []);
      openActionCreateDialog({
        users,
        builtInSuccessToast: false,
        defaults: {
          title: ttl,
          origin,
          actionType: 'corrective',
          priority,
          description,
          ...(dueDate ? { dueDate } : {}),
          ...(srcModule === 'risks' && srcId ? { linkedRiskId: srcId } : {})
        },
        onCreated: (payload) => {
          const t = payload?.title ? String(payload.title).trim() : ttl;
          const r = payload?.ref != null ? String(payload.ref).trim() : '';
          showToast(
            r ? `Action créée (${r})${t ? ` : ${t}` : ''}` : t ? `Action créée : ${t}` : 'Action créée.',
            'success',
            {
              label: 'Ouvrir',
              action: () => {
                qhseNavigate('actions', {
                  skipDefaults: true,
                  ...(payload?.id ? { focusActionId: payload.id } : {}),
                  focusActionTitle: t || '',
                  source: 'dashboard_intelligence_postcreate'
                });
              }
            }
          );
        }
      });
    } catch (err) {
      console.error('[dashboard][intelligence] openActionCreateDialog', err);
      showToast('Action à créer manuellement (dialog indisponible).', 'warning');
    }
  }

  function ensureModal() {
    if (modal && modal.isConnected) return modal;
    const d = document.createElement('dialog');
    d.className = 'intel-modal';
    d.innerHTML = `
      <div class="intel-modal__head">
        <div>
          <h3 class="intel-modal__title">Alertes et anomalies : intelligence QHSE</h3>
          <p class="intel-modal__sub">Filtrez par sévérité et source. Les actions restent sous validation humaine.</p>
        </div>
        <button type="button" class="intel-modal__close" data-close>Fermer</button>
      </div>
      <div class="intel-modal__body">
        <div class="intel-modal__filters">
          <label>Sévérité
            <select data-f-sev>
              <option value="all">Toutes</option>
              <option value="critical">Critique</option>
              <option value="high">Élevée</option>
              <option value="medium">Moyenne</option>
              <option value="low">Faible</option>
            </select>
          </label>
          <label>Source
            <select data-f-src>
              <option value="all">Toutes</option>
              <option value="risks">Risques</option>
              <option value="actions">Actions</option>
              <option value="incidents">Incidents</option>
              <option value="audits">Audits</option>
              <option value="controlled_documents">Documents</option>
              <option value="products">Produits</option>
            </select>
          </label>
        </div>
        <div class="intel-modal__cols">
          <section class="intel-modal__panel" aria-label="Alertes opérationnelles">
            <h4 class="intel-modal__h">Alertes opérationnelles</h4>
            <ul class="dashboard-intel__list" data-m-alerts></ul>
            <p class="intel-modal__empty" data-m-alerts-empty hidden></p>
          </section>
          <section class="intel-modal__panel" aria-label="Anomalies qualité des données">
            <h4 class="intel-modal__h">Anomalies / qualité des données</h4>
            <div class="dashboard-intel__list" data-m-anoms></div>
            <p class="intel-modal__empty" data-m-anoms-empty hidden></p>
          </section>
        </div>
      </div>
    `;
    d.querySelector('[data-close]')?.addEventListener('click', () => d.close());
    d.addEventListener('click', (ev) => {
      if (ev.target === d) d.close();
    });
    document.body.append(d);
    modal = d;
    return d;
  }

  function renderModal() {
    const d = ensureModal();
    const intel = lastIntel;
    const sevSel = d.querySelector('[data-f-sev]');
    const srcSel = d.querySelector('[data-f-src]');
    const sev = sevSel && 'value' in sevSel ? String(sevSel.value) : 'all';
    const src = srcSel && 'value' in srcSel ? String(srcSel.value) : 'all';

    const alertsHost = d.querySelector('[data-m-alerts]');
    const alertsEmpty = d.querySelector('[data-m-alerts-empty]');
    const anomsHost2 = d.querySelector('[data-m-anoms]');
    const anomsEmpty = d.querySelector('[data-m-anoms-empty]');

    const allAlerts = Array.isArray(intel?.alerts) ? intel.alerts : [];
    const allAnoms = Array.isArray(intel?.anomalies) ? intel.anomalies : [];

    const filteredAlerts = allAlerts
      .filter((a) => {
        const aSev = String(a?.severity || '').toLowerCase() || 'low';
        const aSrc = normalizeSourceKey(a?.sourceModule);
        if (sev !== 'all' && aSev !== sev) return false;
        if (src !== 'all' && aSrc !== src) return false;
        return true;
      })
      .slice()
      .sort((a, b) => {
        const ra = severityRank(a?.severity);
        const rb = severityRank(b?.severity);
        if (rb !== ra) return rb - ra;
        const ca = Number(a?.confidence);
        const cb = Number(b?.confidence);
        const fa = Number.isFinite(ca) ? ca : -1;
        const fb = Number.isFinite(cb) ? cb : -1;
        return fb - fa;
      });

    if (alertsHost) alertsHost.replaceChildren();
    if (filteredAlerts.length === 0) {
      if (alertsEmpty) {
        alertsEmpty.hidden = false;
        alertsEmpty.textContent =
          'Aucune alerte intelligente détectée. Les signaux apparaîtront avec vos données QHSE.';
      }
    } else {
      if (alertsEmpty) alertsEmpty.hidden = true;
      filteredAlerts.forEach((a) => {
        const sevKey = String(a?.severity || '').toLowerCase() || 'low';
        const li = document.createElement('li');
        li.className = 'intel-alert';
        const conf =
          a?.confidence != null && Number.isFinite(Number(a.confidence))
            ? Math.round(Number(a.confidence) * 100)
            : null;
        const hasSuggested = a?.suggestedActionTitle != null && String(a.suggestedActionTitle).trim() !== '';
        const hasSource =
          a?.sourceModule != null &&
          String(a.sourceModule).trim() !== '' &&
          a?.sourceId != null &&
          String(a.sourceId).trim() !== '';
        li.innerHTML = `
          <div class="intel-alert__top">
            <span class="intel-alert__sev intel-alert__sev--${sevKey}">${escapeHtml(labelSeverityFr(sevKey))}</span>
            <span class="intel-alert__src">${escapeHtml(labelSourceModuleFr(a?.sourceModule))}</span>
          </div>
          <div class="intel-alert__ttl">${escapeHtml(safeText(a?.title || 'Alerte', 140) || 'Alerte')}</div>
          <div class="intel-alert__desc">${escapeHtml(safeText(a?.description || '', 320) || 'Non disponible')}</div>
          <div class="intel-alert__meta">
            ${conf != null ? `<span>Confiance : ${conf}%</span>` : ''}
          </div>
          ${
            hasSuggested
              ? `<div class="intel-alert__acts">
                  <button type="button" class="intel-alert__btn intel-alert__btn--primary" data-intel-act="1">Corriger</button>
                  ${hasSource ? `<button type="button" class="intel-alert__btn intel-alert__btn--secondary" data-intel-open="1">Ouvrir la source</button>` : ''}
                </div>`
              : hasSource
                ? `<div class="intel-alert__acts">
                    <button type="button" class="intel-alert__btn intel-alert__btn--secondary" data-intel-open="1">Ouvrir la source</button>
                  </div>`
                : ''
          }
        `;
        const actBtn = li.querySelector('[data-intel-act]');
        if (actBtn) {
          actBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            void openCorrectiveActionFromAlert(a);
          });
        }
        const openBtn = li.querySelector('[data-intel-open]');
        if (openBtn) {
          openBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            openAlertSource(a);
          });
        }
        alertsHost.append(li);
      });
    }

    const filteredAnoms = allAnoms
      .filter((x) => {
        // anomalies: filtre source via evidence.sourceModule si présent
        const evSrc = normalizeSourceKey(x?.evidence?.sourceModule || x?.sourceModule || '');
        if (src !== 'all' && evSrc && evSrc !== src) return false;
        return true;
      })
      .slice()
      .sort((a, b) => severityRank(b?.severity) - severityRank(a?.severity));

    if (anomsHost2) anomsHost2.replaceChildren();
    if (filteredAnoms.length === 0) {
      if (anomsEmpty) {
        anomsEmpty.hidden = false;
        anomsEmpty.textContent = 'Aucune anomalie détectée.';
      }
    } else {
      if (anomsEmpty) anomsEmpty.hidden = true;
      filteredAnoms.forEach((x) => {
        const div = document.createElement('div');
        div.className = 'intel-anom';
        div.innerHTML = `<strong>${escapeHtml(safeText(x?.title || 'Anomalie', 140) || 'Anomalie')}</strong><div>${escapeHtml(safeText(x?.detail || x?.description || '', 360) || 'Non disponible')}</div>`;
        anomsHost2.append(div);
      });
    }
  }

  function update(intelligence) {
    const intel =
      intelligence && typeof intelligence === 'object' && !Array.isArray(intelligence)
        ? intelligence
        : null;
    lastIntel = intel;
    const score = intel ? Number(intel.score) : NaN;
    const tone = scoreTone(score);
    if (scoreV) {
      scoreV.textContent = Number.isFinite(score) ? `${Math.round(score)}/100` : 'Non disponible';
      scoreV.style.color =
        tone === 'critical' || tone === 'high'
          ? 'color-mix(in srgb, var(--color-text-danger, #ef4444) 92%, var(--text))'
          : tone === 'medium'
            ? 'color-mix(in srgb, #fb923c 90%, var(--text))'
            : 'color-mix(in srgb, #22c55e 80%, var(--text))';
    }
    if (scoreMeta) {
      const gen = intel?.generatedAt ? formatGeneratedAt(intel.generatedAt) : '';
      scoreMeta.textContent = gen ? `Généré : ${gen}` : 'Non disponible';
    }

    const alerts = Array.isArray(intel?.alerts) ? intel.alerts : [];
    const top = alerts.slice(0, 3);
    if (alertsList) alertsList.replaceChildren();
    if (top.length === 0) {
      if (empty) empty.hidden = false;
      if (empty) {
        empty.textContent =
          'Aucune alerte intelligente détectée. Les signaux apparaîtront avec vos données QHSE.';
      }
    } else {
      if (empty) empty.hidden = true;
      top.forEach((a) => {
        const sev = String(a?.severity || '').toLowerCase() || 'low';
        const li = document.createElement('li');
        li.className = 'intel-alert';
        const conf =
          a?.confidence != null && Number.isFinite(Number(a.confidence))
            ? Math.round(Number(a.confidence) * 100)
            : null;
        const hasSuggested = a?.suggestedActionTitle != null && String(a.suggestedActionTitle).trim() !== '';
        const hasSource =
          a?.sourceModule != null &&
          String(a.sourceModule).trim() !== '' &&
          a?.sourceId != null &&
          String(a.sourceId).trim() !== '';
        li.innerHTML = `
          <div class="intel-alert__top">
            <span class="intel-alert__sev intel-alert__sev--${sev}">${escapeHtml(labelSeverityFr(sev))}</span>
            <span class="intel-alert__src">${escapeHtml(labelSourceModuleFr(a?.sourceModule))}</span>
          </div>
          <div class="intel-alert__ttl">${escapeHtml(safeText(a?.title || 'Alerte', 120) || 'Alerte')}</div>
          <div class="intel-alert__desc">${escapeHtml(safeText(a?.description || '', 220) || 'Non disponible')}</div>
          <div class="intel-alert__meta">
            ${conf != null ? `<span>Confiance : ${conf}%</span>` : ''}
          </div>
          ${
            hasSuggested
              ? `<div class="intel-alert__acts">
                  <button type="button" class="intel-alert__btn intel-alert__btn--primary" data-intel-act="1">Corriger</button>
                  ${hasSource ? `<button type="button" class="intel-alert__btn intel-alert__btn--secondary" data-intel-open="1">Ouvrir la source</button>` : ''}
                </div>`
              : hasSource
                ? `<div class="intel-alert__acts">
                    <button type="button" class="intel-alert__btn intel-alert__btn--secondary" data-intel-open="1">Ouvrir la source</button>
                  </div>`
                : ''
          }
        `;
        const actBtn = li.querySelector('[data-intel-act]');
        if (actBtn) {
          actBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            void openCorrectiveActionFromAlert(a);
          });
        }
        const openBtn = li.querySelector('[data-intel-open]');
        if (openBtn) {
          openBtn.addEventListener('click', (ev) => {
            ev.preventDefault();
            ev.stopPropagation();
            openAlertSource(a);
          });
        }
        alertsList.append(li);
      });
    }

    const anoms = Array.isArray(intel?.anomalies) ? intel.anomalies : [];
    if (anomsPanel && anomsHost) {
      if (!anoms.length) {
        anomsPanel.hidden = true;
        anomsHost.replaceChildren();
      } else {
        anomsPanel.hidden = false;
        anomsHost.replaceChildren();
        anoms.slice(0, 3).forEach((x) => {
          const div = document.createElement('div');
          div.className = 'intel-anom';
          div.innerHTML = `<strong>${escapeHtml(safeText(x?.title || 'Anomalie', 120) || 'Anomalie')}</strong><div>${escapeHtml(safeText(x?.detail || x?.description || '', 240) || 'Non disponible')}</div>`;
          anomsHost.append(div);
        });
      }
    }
  }

  const ctaRow = document.createElement('div');
  ctaRow.className = 'dashboard-intel__cta-row';
  const viewAllBtn = document.createElement('button');
  viewAllBtn.type = 'button';
  viewAllBtn.className = 'dashboard-intel__cta';
  viewAllBtn.textContent = 'Voir toutes les alertes';
  viewAllBtn.addEventListener('click', () => {
    const d = ensureModal();
    renderModal();
    const sevSel = d.querySelector('[data-f-sev]');
    const srcSel = d.querySelector('[data-f-src]');
    if (sevSel) sevSel.addEventListener('change', renderModal);
    if (srcSel) srcSel.addEventListener('change', renderModal);
    if (typeof d.showModal === 'function') d.showModal();
    else showToast('Vue complète indisponible sur ce navigateur.', 'warning');
  });
  ctaRow.append(viewAllBtn);
  root.append(ctaRow);

  return { root, update };
}

/**
 * Listes chargées par le dashboard : référence stable pour le drawer KPI (pas de re-fetch).
 * @type {{ incidents: unknown[]; actions: unknown[]; audits: unknown[]; ncs: unknown[]; docs: unknown[]; risks: unknown[] }}
 */
const kpiDashboardLists = { incidents: [], actions: [], audits: [], ncs: [], docs: [], risks: [] };
/** @type {{ open: (k: string) => void; element: HTMLDialogElement } | null} */
let kpiDetailDrawerSingleton = null;

/**
 * Texte d’insight : échappement HTML + gras léger `**…**` + paragraphes sur doubles sauts de ligne.
 * @param {unknown} raw
 * @returns {string}
 */
function formatDashboardInsightBody(raw) {
  const text = String(raw ?? '').trim();
  if (!text) {
    return '<p class="dashboard-ai-insight__para dashboard-ai-insight__para--muted">Non disponible</p>';
  }
  const formatInline = (block) => {
    const parts = block.split('**');
    return parts
      .map((part, i) => {
        const escaped = escapeHtml(part);
        return i % 2 === 1 ? `<strong class="dashboard-ai-insight__strong">${escaped}</strong>` : escaped;
      })
      .join('');
  };
  return text
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean)
    .map((block) => `<p class="dashboard-ai-insight__para">${formatInline(block)}</p>`)
    .join('');
}

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
            <header class="dashboard-ai-insight__head">
              <div class="dashboard-ai-insight__head-text">
                <p class="section-kicker dashboard-ai-insight__kicker">Analyse IA de la semaine</p>
                <p class="dashboard-ai-insight__lede">Synthèse à partir des indicateurs et événements récents.</p>
              </div>
              <span class="dashboard-ai-insight__chip">Hebdo</span>
            </header>
            <div class="dashboard-ai-insight__body" role="region" aria-label="Texte de synthèse">${formatDashboardInsightBody(insight)}</div>
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
 * Bandeau visible (centré) quand l’API n’est pas joignable, complète le toast.
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
    "Dans ce navigateur, testez http://127.0.0.1:3001/api/health. Si rien ne s'affiche, un pare-feu ou l’aperçu intégré bloque l’accès. Ouvrez l’app dans Chrome ou Edge (http://localhost:5173).";
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

  const dashboardIntent = consumeDashboardIntent();

  const siteName = appState.currentSite || 'Tous sites';

  function dashboardKpiScopeEmptyLabel() {
    return appState.activeSiteId ? 'Aucun sur ce site' : 'Aucune donnée';
  }

  function exportDirectionToast() {
    showToast(
      'Export direction (PDF / CSV) : connecteur prêt à être relié à votre système documentaire.',
      'info'
    );
  }

  const ceoHero = createDashboardCeoHero(siteName, {
    onExport: exportDirectionToast,
    onOpenAuditTrendPoint: ({ label, value }) => {
      showToast(`Audits ${label} · ${value}%`, 'info');
      qhseNavigate('audits');
    }
  });

  const page = document.createElement('section');
  page.className = 'page-stack page-stack--premium-saas dashboard-page';

  const { bar: pageViewBar } = mountPageViewModeSwitch({
    pageId: 'dashboard',
    pageRoot: page,
    hintEssential:
      'Essentiel (cette page) : en-tête, signaux, indicateurs et priorités du jour. Les analyses étendues et les graphiques complémentaires sont masqués.',
    hintAdvanced:
      'Expert (cette page) : analyses détaillées, graphiques, cockpit, habilitations, activité et assistant.'
  });

  const bandCeo = document.createElement('div');
  bandCeo.className = 'dashboard-band dashboard-band--ceo';
  bandCeo.append(ceoHero.root);

  const connectivitySlot = document.createElement('div');
  connectivitySlot.className = 'dashboard-connectivity-slot';
  connectivitySlot.hidden = true;

  const cockpit = createDashboardCockpit();
  const executivePanel = createDashboardExecutivePanel(siteName);

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

  const bandExecutiveSummary = document.createElement('div');
  bandExecutiveSummary.className = 'dashboard-band dashboard-band--executive-summary';
  bandExecutiveSummary.append(executivePanel.root);

  const decisionAlertsBand = document.createElement('section');
  /* Même métrique que les cartes KPI + sous-lignes « variation » non métier : réservé à la vue Expert (page). */
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
      "Neuf indicateurs, même logique qu’avant. Ils sont replacés ici pour alléger l’écran principal."
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

  const intelligenceWidget = createDashboardIntelligenceWidget();
  intelligenceWidget.update(lastStats.intelligence);
  const bandIntelligence = document.createElement('div');
  bandIntelligence.className = 'dashboard-band dashboard-band--intelligence';
  bandIntelligence.append(intelligenceWidget.root);

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
        const ni = rec.navigateIntent && typeof rec.navigateIntent === 'object' ? rec.navigateIntent : {};
        qhseNavigate(rec.navigateHash, {
          ...ni,
          source: typeof ni.source === 'string' && ni.source ? ni.source : 'dashboard_assistant'
        });
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
            builtInSuccessToast: false,
            onCreated: (payload) => {
              const t = payload?.title ? String(payload.title).trim() : '';
              const r = payload?.ref != null ? String(payload.ref).trim() : '';
              showToast(
                r
                  ? `Action créée (${r})${t ? ` : ${t}` : ''}`
                  : t
                    ? `Action créée : ${t}`
                    : 'Action créée depuis l’assistant de pilotage.',
                'success',
                {
                  label: 'Ouvrir',
                  action: () => {
                    if (payload?.id) {
                      qhseNavigate('actions', {
                        focusActionId: payload.id,
                        focusActionTitle: payload.title || ''
                      });
                    } else {
                      qhseNavigate('actions', {
                        skipDefaults: true,
                        focusActionTitle: t || '',
                        source: 'dashboard_assistant_postcreate'
                      });
                    }
                  }
                }
              );
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
  bandCockpit.className = 'dashboard-band dashboard-band--cockpit qhse-page-advanced-only';
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
      'Lecture direction : maîtrise et vigilance.'
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
  const { kpiGrid, kpiStickyWrap, kpiValues, kpiNotes, kpiEmptyHints } = renderKpiCards({
    onOpenDetail: (key) => kpiDetailDrawerSingleton?.open(key)
  });
  kpiGrid.classList.add('dashboard-kpi-grid--executive');

  const kpiPriorityLine = document.createElement('p');
  kpiPriorityLine.className = 'dashboard-kpi-priority-line dashboard-kpi-priority-line--ok';
  kpiPriorityLine.textContent = '';

  /** Refs DOM KPI passées explicitement aux modules dashboard/kpiCards.js (évite toute ambiguïté de scope). */
  const kpiDomRefs = {
    kpiValues,
    kpiEmptyHints: kpiEmptyHints ?? {},
    kpiNotes,
    kpiPriorityLine
  };

  const tfTgMini = createDashboardTfTgMiniRow();

  const kpiSection = document.createElement('section');
  kpiSection.className = 'dashboard-section dashboard-section--kpi-pilotage';
  const kpiQuick = createDashboardBlockActions(
    [
      {
        label: 'Détail incidents',
        pageId: 'incidents',
        intent: { dashboardIncidentPeriodPreset: '30', source: 'dashboard_kpi_strip' }
      },
      {
        label: 'Détail actions',
        pageId: 'actions',
        intent: { actionsColumnFilter: 'overdue', source: 'dashboard_kpi_strip' }
      }
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
      {
        label: 'Voir les incidents',
        pageId: 'incidents',
        intent: { dashboardIncidentPeriodPreset: '30', source: 'dashboard_charts_strip' }
      },
      {
        label: 'Ouvrir le plan d’actions',
        pageId: 'actions',
        intent: { actionsColumnFilter: 'overdue', source: 'dashboard_charts_strip' }
      }
    ],
    { className: 'dashboard-block-actions dashboard-block-actions--tight' }
  );
  if (chartsQuickRow) chartsGlobalActs.append(chartsQuickRow);

  chartsSection.append(
    makeSectionHeader('Complément', 'Autres graphiques', 'Répartition, audits et charge. La tendance principale est au-dessus du volet.'),
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
      <p class="dashboard-decision-charts-lead">Volume des non-conformités (prioritaires vs autres), typologie des signalements et scores d’audit. Cliquez sur un graphique pour ouvrir le module lié.</p>
    </header>
    <div class="dashboard-decision-charts-grid">
      <div class="dashboard-decision-chart-panel">
        <div class="dashboard-decision-chart-panel__meta">
          <span class="dashboard-decision-chart-panel__tag">Conformité</span>
          <span class="dashboard-decision-chart-panel__title">Non-conformités créées : prioritaires vs autres (6 mois)</span>
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
  activitySection.append(makeSectionHeader('Suivi', 'Activité récente', 'Flux récents, lecture secondaire.'), activityWrap);

  const bandActivity = document.createElement('div');
  bandActivity.className = 'dashboard-band dashboard-band--activity-foot';
  bandActivity.append(activitySection);

  /** @type {{ ncStack: Chart|null; risk: Chart|null; score: Chart|null }} */
  const decisionCharts = { ncStack: null, risk: null, score: null };
  const iaList = iaBlock.querySelector('[data-dc-ia]');
  const prioList = priorityBlock.querySelector('[data-dc-prio]');

  function renderKpiFilteredModal(specKey) {
    return renderKpiFilteredModalModule(
      specKey,
      kpiDashboardLists,
      kpiDetailDrawerSingleton,
      getSessionUser
    );
  }

  function updateDecisionAlerts(stats, incidents, actions, ncs, audits) {
    return updateDecisionAlertsModule(
      {
        decisionAlerts,
        opsGrid,
        habSummaryCard,
        habSiteCard,
        iaList,
        prioList,
        decisionCharts,
        decisionChartCard,
        renderKpiFilteredModal
      },
      stats,
      {
        incidents,
        actions,
        ncs,
        audits,
        docs: kpiDashboardLists.docs || [],
        risks: kpiDashboardLists.risks || []
      }
    );
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
    bandSecondary,
    bandAssistant
  );

  const executiveBand = document.createElement('div');
  executiveBand.className = 'dashboard-executive-surface';
  executiveBand.append(
    bandCeo,
    bandExecutiveSummary,
    decisionAlertsBand,
    kpiSection,
    primaryChartSection,
    bandPriority,
    bandIntelligence,
    bandToday
  );

  const dashboardAiInsight = document.createElement('div');
  dashboardAiInsight.id = 'dashboard-ai-insight';
  dashboardAiInsight.className = 'dashboard-ai-insight qhse-page-advanced-only';

  const separator = document.createElement('div');
  separator.style.cssText = 'height: 1px; background: var(--color-border-tertiary); margin: 24px 0;';
  page.append(
    connectivitySlot,
    pageViewBar,
    executiveBand,
    toggleRow,
    extendedSection,
    dashboardAiInsight,
    separator,
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
  intelligenceWidget.update(lastStats.intelligence);
  priorityNow.update({ stats: lastStats, ncs: [], audits: [] });

  function updateKpiPriorityLine() {
    return updateKpiPriorityLineModule(kpiPriorityLine, kpiDashboardLists, lastStats);
  }

  function dismissKpiSkeleton() {
    return dismissKpiSkeletonModule(kpiStickyWrap);
  }

  function applyStatsToKpis(data) {
    return applyStatsToKpisModule(
      kpiDomRefs,
      dashboardKpiScopeEmptyLabel,
      () => dashboardNcListForKpi,
      data
    );
  }

  function applyEnrichmentKpis(ncList, auditList, ncTotalAggregate) {
    return applyEnrichmentKpisModule(
      kpiDomRefs,
      dashboardKpiScopeEmptyLabel,
      ncList,
      auditList,
      ncTotalAggregate
    );
  }

  function refreshCharts(_incidents, _actions, _audits, _ncs) {
    const { ncList } = refreshChartsModule(
      { lineCard, mixCard, typeCard, auditCharts, pilotLoadCard },
      lastStats,
      {
        incidents: kpiDashboardLists.incidents,
        actions: kpiDashboardLists.actions,
        audits: kpiDashboardLists.audits,
        ncs: kpiDashboardLists.ncs
      }
    );
    dashboardNcListForKpi = ncList;
    updateKpiPriorityLine();
  }

  function refreshActivity(incidents, actions, audits) {
    return refreshActivityModule(activityWrap, incidents, actions, audits);
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
    if (!page.isConnected) return;
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
    if (listResults.some((r) => r.status === 'rejected') && page.isConnected) {
      showToast("Certaines listes n’ont pas pu être chargées, affichage partiel.", 'warning');
    }

    const incidents = isDemoMode() ? incR || DASHBOARD_DEMO_LISTS.incidents : incR || [];
    const actions = isDemoMode() ? actR || DASHBOARD_DEMO_LISTS.actions : actR || [];
    const audits = isDemoMode() ? audR || DASHBOARD_DEMO_LISTS.audits : audR || [];
    const ncs = isDemoMode() ? ncR || DASHBOARD_DEMO_LISTS.ncs : ncR || [];
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
      intelligenceWidget.update(lastStats.intelligence);
    } else {
      lastStats = reconcileDashboardStatsWithLists(lastStats, incidents, actions, ncs);
      applyStatsToKpis(lastStats);
      intelligenceWidget.update(lastStats.intelligence);
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
    kpiDashboardLists.risks = Array.isArray(risksR) ? risksR : [];

    await refreshPermitsFromApi();
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
    intelligenceWidget.update(lastStats.intelligence);
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

    pilotageAssistant.setAiLoading(true);
    pilotageAssistant.setAiResult(null);
    void (async () => {
      try {
        const dashboardContext = buildDashboardPilotageAiContext({
          stats: lastStats,
          incidents,
          actions,
          siteLabel: siteName,
          risks: Array.isArray(risksR) ? risksR : null,
          // Sur tenant neuf (vraies données vides), on n’affiche pas de recommandations “mockées”.
          allowGenericPilotageMocks: isDemoMode(),
          isDemoContext: isDemoMode()
        });
        const ai = await fetchPilotageAiSuggestActions(dashboardContext);
        pilotageAssistant.setAiResult({
          narrative: typeof ai?.narrative === 'string' ? ai.narrative : '',
          actions: Array.isArray(ai?.actions) ? ai.actions : []
        });
      } catch (aiErr) {
        console.warn('[dashboard] pilotage IA /api/ai-suggestions/suggest/actions', aiErr);
        pilotageAssistant.setAiResult({
          narrative:
            'Analyse IA momentanément indisponible (réseau, droits ou configuration). Les recommandations ci-dessus restent basées sur les règles métier.',
          actions: []
        });
      } finally {
        pilotageAssistant.setAiLoading(false);
      }
    })();
    void loadDashboardInsight(
      buildMistralDashboardStatsPayload(lastStats, audits, risksR || [])
    );
    await tfTgMini.refresh();
    dismissKpiSkeleton();
  }

  (async function loadDashboard() {
    const stillOnDashboard = () => page.isConnected;

    /** Échec réseau uniquement ici → bandeau « connexion impossible ». */
    let res;
    try {
      res = await qhseFetchWithNetworkRetry(withSiteQuery('/api/dashboard/stats'));
    } catch (err) {
      console.error('[dashboard] réseau GET /api/dashboard/stats', err);
      if (!stillOnDashboard()) return;
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
      if (!stillOnDashboard()) return;
      if (res.status === 401) {
        if (stillOnDashboard()) {
          showToast('Session expirée, reconnectez-vous.', 'warning');
        }
        dismissKpiSkeleton();
        return;
      }
      if (res.status === 403) {
        const body = await res.json().catch(() => ({}));
        const errStr = typeof body.error === 'string' ? body.error : '';
        if (stillOnDashboard()) {
          showToast(
            errStr.includes('Contexte organisation')
              ? "Aucune organisation active pour cette session. Reconnectez-vous (e-mail, mot de passe, organisation si demandée)."
              : 'Accès au tableau de bord refusé pour ce profil.',
            'warning'
          );
        }
        await loadListsAndRefreshDashboard(true);
        return;
      }
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        const msg =
          typeof j.error === 'string' && j.error.trim()
            ? j.error.trim()
            : `Données dashboard indisponibles (${res.status}).`;
        if (stillOnDashboard()) {
          showToast(msg, 'warning');
          showDashboardConnectivityError(connectivitySlot);
        }
        await loadListsAndRefreshDashboard(true);
        return;
      }
      if (!stillOnDashboard()) return;
      const raw = await res.json().catch(() => null);
      const normalized = normalizeDashboardPayload(raw);
      if (!normalized) {
        console.error('[dashboard] GET /api/dashboard/stats : corps invalide', raw);
        if (stillOnDashboard()) {
          showToast('Réponse tableau de bord illisible.', 'warning');
          showDashboardConnectivityError(connectivitySlot);
        }
        await loadListsAndRefreshDashboard(true);
        return;
      }

      if (!stillOnDashboard()) return;
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
      intelligenceWidget.update(lastStats.intelligence);
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
      if (stillOnDashboard()) {
        showToast(
          `Erreur tableau de bord : ${err instanceof Error ? err.message : String(err)}. Voir la console (F12).`,
          'warning'
        );
      }
      try {
        await loadListsAndRefreshDashboard(!statsFromApiReady);
      } catch (e2) {
        console.warn('[dashboard] reprise listes après erreur', e2);
      }
    }
  })();

  if (dashboardIntent?.scrollToId) {
    scheduleScrollIntoView(String(dashboardIntent.scrollToId));
  }

  return page;
}
