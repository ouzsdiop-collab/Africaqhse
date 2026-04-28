import {
  buildIncidentMonthlySeries,
  buildTopIncidentTypes,
  classifyActionsForMix,
  createActionsMixChart,
  createDashboardLineChart,
  createDashboardTrendEmptyState,
  createIncidentTypeBreakdown,
  createPilotageLoadMixChart,
  DASHBOARD_TREND_EMPTY_MSG
} from '../../components/dashboardCharts.js';
import { isDemoMode } from '../../services/demoMode.service.js';
import { asDashboardCount } from '../../utils/reconcileDashboardStats.js';

/**
 * Met à jour les graphiques « Complément » du tableau de bord.
 *
 * @param {object} refs
 * @param {{ body: HTMLElement }} refs.lineCard
 * @param {{ body: HTMLElement }} refs.mixCard
 * @param {{ body: HTMLElement }} refs.typeCard
 * @param {{ update: (p: { audits: unknown[], ncs: unknown[] }) => void }} refs.auditCharts
 * @param {{ body: HTMLElement }} refs.pilotLoadCard
 * @param {object} stats — stats courantes (ex. `lastStats` ; peut inclure `timeseries` API)
 * @param {object} data
 * @param {unknown[]} [data.incidents]
 * @param {unknown[]} [data.actions]
 * @param {unknown[]} [data.audits]
 * @param {unknown[]} [data.ncs]
 * @returns {{ ncList: unknown[] }}
 */
function destroyIncidentsChartIfMounted(host) {
  const el = host?.querySelector?.('[data-qhse-chartjs="1"]');
  if (el && typeof el.__qhseChartDestroy === 'function') el.__qhseChartDestroy();
}

export function refreshCharts(refs, stats, data) {
  const { lineCard, mixCard, typeCard, auditCharts, pilotLoadCard } = refs;
  const s = stats || {};
  const ts =
    s.timeseries != null && typeof s.timeseries === 'object' && !Array.isArray(s.timeseries)
      ? s.timeseries
      : null;
  const {
    incidents = [],
    actions = [],
    audits = [],
    ncs = []
  } = data || {};

  const inc = incidents || [];
  const act = actions || [];
  const aud = audits || [];
  const ncList = ncs || [];
  const allowDemo = isDemoMode();
  const hasTs = ts != null;

  /** @type {{ label: string; value: number }[] | null} */
  let incidentSeries = null;
  if (
    ts &&
    Array.isArray(ts.incidentsByMonth) &&
    ts.incidentsByMonth.length > 0 &&
    ts.incidentsByMonth.every((x) => x && typeof x === 'object')
  ) {
    incidentSeries = ts.incidentsByMonth.map((x) => ({
      label: String(/** @type {{ label?: unknown }} */ (x).label ?? '—'),
      value: Math.max(0, Number(/** @type {{ value?: unknown }} */ (x).value) || 0)
    }));
  } else if (allowDemo) {
    incidentSeries = buildIncidentMonthlySeries(inc);
  }

  destroyIncidentsChartIfMounted(lineCard.body);
  if (incidentSeries) {
    lineCard.body.replaceChildren(
      createDashboardLineChart(incidentSeries, { lineTheme: 'incidents' })
    );
  } else {
    lineCard.body.replaceChildren(createDashboardTrendEmptyState());
  }

  const listSourceNote = hasTs
    ? 'Indicateur : listes API (plafond 500) — pas d’agrégat unique issu de la série temporelle pour cette répartition.'
    : 'Indicateur : listes API (plafond 500) — en l’absence de tendance mensuelle serveur.';

  if (hasTs || allowDemo) {
    const mix = createActionsMixChart(classifyActionsForMix(act));
    const mixNote = document.createElement('p');
    mixNote.className = 'dashboard-chart-foot dashboard-chart-foot--tight';
    mixNote.style.fontSize = '11px';
    mixNote.style.color = 'var(--text3, #94a3b8)';
    mixNote.textContent = allowDemo && !hasTs ? 'Mode démonstration : données d’illustration.' : listSourceNote;
    mix.append(mixNote);
    mixCard.body.replaceChildren(mix);

    const type = createIncidentTypeBreakdown(buildTopIncidentTypes(inc));
    const typeNote = document.createElement('p');
    typeNote.className = 'dashboard-chart-foot dashboard-chart-foot--tight';
    typeNote.style.fontSize = '11px';
    typeNote.style.color = 'var(--text3, #94a3b8)';
    typeNote.textContent = allowDemo && !hasTs ? 'Mode démonstration : données d’illustration.' : listSourceNote;
    type.append(typeNote);
    typeCard.body.replaceChildren(type);
  } else {
    mixCard.body.replaceChildren(createDashboardTrendEmptyState(DASHBOARD_TREND_EMPTY_MSG));
    typeCard.body.replaceChildren(createDashboardTrendEmptyState(DASHBOARD_TREND_EMPTY_MSG));
  }

  auditCharts.update({
    audits: aud,
    ncs: ncList,
    timeseries: ts,
    allowDemoChartFallback: allowDemo
  });

  const nested = s.stats && typeof s.stats === 'object' ? s.stats : null;
  const critKpi =
    nested?.incidents != null &&
    typeof nested.incidents === 'object' &&
    nested.incidents.critical != null &&
    Number.isFinite(Number(/** @type {{ critical?: unknown }} */ (nested.incidents).critical))
      ? Math.max(0, Number(/** @type {{ critical?: unknown }} */ (nested.incidents).critical))
      : Array.isArray(s.criticalIncidents)
        ? s.criticalIncidents.length
        : 0;

  pilotLoadCard.body.replaceChildren(
    createPilotageLoadMixChart({
      criticalIncidents: critKpi,
      overdueActions: asDashboardCount(s.overdueActions),
      ncOpen: asDashboardCount(s.nonConformities)
    })
  );

  return { ncList };
}
