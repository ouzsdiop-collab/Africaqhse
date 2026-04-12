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
 * @param {object} data
 * @param {object} [data.stats] — stats courantes (équivalent de `lastStats` dans la page)
 * @param {unknown[]} [data.incidents]
 * @param {unknown[]} [data.actions]
 * @param {unknown[]} [data.audits] — requis pour le même rendu qu’avant (3ᵉ argument historique)
 * @param {unknown[]} [data.ncs] — requis pour le même rendu qu’avant (4ᵉ argument historique)
 * @returns {{ ncList: unknown[] }} — le parent doit affecter `dashboardNcListForKpi = ncList` puis appeler `updateKpiPriorityLine()` (effets non déplaçables ici sans callback)
 */
export function refreshCharts(refs, data) {
  const { lineCard, mixCard, typeCard, auditCharts, pilotLoadCard } = refs;
  const {
    stats = {},
    incidents = [],
    actions = [],
    audits = [],
    ncs = []
  } = data || {};

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

  const ncOpen = ncList.filter(isNcOpen).length;
  pilotLoadCard.body.replaceChildren(
    createPilotageLoadMixChart({
      criticalIncidents: Array.isArray(stats.criticalIncidents)
        ? stats.criticalIncidents.length
        : 0,
      overdueActions: asDashboardCount(stats.overdueActions),
      ncOpen
    })
  );

  return { ncList };
}
