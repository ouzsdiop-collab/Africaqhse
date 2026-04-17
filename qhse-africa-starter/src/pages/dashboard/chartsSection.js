import {
  buildIncidentMonthlySeries,
  buildTopIncidentTypes,
  classifyActionsForMix,
  createActionsMixChart,
  createDashboardLineChart,
  createIncidentTypeBreakdown,
  createPilotageLoadMixChart
} from '../../components/dashboardCharts.js';
import { asDashboardCount, isNcOpen } from '../../utils/reconcileDashboardStats.js';

/**
 * Met à jour les graphiques « Complément » du tableau de bord.
 *
 * @param {object} refs
 * @param {{ body: HTMLElement }} refs.lineCard
 * @param {{ body: HTMLElement }} refs.mixCard
 * @param {{ body: HTMLElement }} refs.typeCard
 * @param {{ update: (p: { audits: unknown[], ncs: unknown[] }) => void }} refs.auditCharts
 * @param {{ body: HTMLElement }} refs.pilotLoadCard
 * @param {object} stats — stats courantes (ex. `lastStats` dans la page)
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

  destroyIncidentsChartIfMounted(lineCard.body);
  lineCard.body.replaceChildren(
    createDashboardLineChart(buildIncidentMonthlySeries(inc), { lineTheme: 'incidents' })
  );
  mixCard.body.replaceChildren(createActionsMixChart(classifyActionsForMix(act)));
  typeCard.body.replaceChildren(createIncidentTypeBreakdown(buildTopIncidentTypes(inc)));

  auditCharts.update({ audits: aud, ncs: ncList });

  const ncOpen = ncList.filter(isNcOpen).length;
  pilotLoadCard.body.replaceChildren(
    createPilotageLoadMixChart({
      criticalIncidents: Array.isArray(s.criticalIncidents) ? s.criticalIncidents.length : 0,
      overdueActions: asDashboardCount(s.overdueActions),
      ncOpen
    })
  );

  return { ncList };
}
