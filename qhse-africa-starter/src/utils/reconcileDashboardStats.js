import { isActionOverdueDashboardRow } from './actionOverdueDashboard.js';

export function asDashboardCount(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

export function isNcOpen(row) {
  const s = String(row?.status || '').toLowerCase();
  if (!s) return true;
  if (/(clos|ferm|done|termin|clôtur|résolu|resolu|complete)/i.test(s)) return false;
  return true;
}

/**
 * @param {object[]} incidents
 * @param {object[]} actions
 * @param {object[]} ncs
 */
export function deriveDashboardStatsFromLists(incidents, actions, ncs) {
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
      id: row.id ?? row._id ?? null,
      ref: row.ref ?? row.reference ?? null,
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
 * Les compteurs `/api/dashboard/stats` sont désormais calculés côté serveur (count / groupBy).
 * On ne réécrit plus les scalaires à partir des listes paginées du client.
 *
 * @param {object | null | undefined} apiStats
 * @param {object[]} _incidents
 * @param {object[]} _actions
 * @param {object[]} _ncs
 */
export function reconcileDashboardStatsWithLists(apiStats, incidents, actions, ncs) {
  if (!apiStats || typeof apiStats !== 'object') {
    return {
      incidents: 0,
      actions: 0,
      overdueActions: 0,
      nonConformities: 0,
      criticalIncidents: [],
      overdueActionItems: []
    };
  }
  const s = apiStats.stats && typeof apiStats.stats === 'object' ? apiStats.stats : null;
  const fromApi = {
    ...apiStats,
    incidents: asDashboardCount(s?.incidents?.total ?? apiStats.incidents),
    actions: asDashboardCount(s?.actions?.total ?? apiStats.actions),
    overdueActions: asDashboardCount(s?.actions?.overdue ?? apiStats.overdueActions),
    nonConformities: asDashboardCount(apiStats.nonConformities),
    criticalIncidents: Array.isArray(apiStats.criticalIncidents) ? apiStats.criticalIncidents : [],
    overdueActionItems: Array.isArray(apiStats.overdueActionItems) ? apiStats.overdueActionItems : []
  };

  const serverLooksAuthoritative =
    Boolean(s) &&
    (asDashboardCount(s.incidents?.total) > 0 ||
      asDashboardCount(s.actions?.total) > 0 ||
      asDashboardCount(s.risks?.total) > 0 ||
      asDashboardCount(s.audits?.total) > 0);

  const apiScalarsDead =
    fromApi.incidents === 0 &&
    fromApi.actions === 0 &&
    fromApi.overdueActions === 0 &&
    fromApi.nonConformities === 0;
  const inc = Array.isArray(incidents) ? incidents : [];
  const act = Array.isArray(actions) ? actions : [];
  const ncList = Array.isArray(ncs) ? ncs : [];
  const listsSignal =
    inc.length > 0 || act.length > 0 || ncList.some((r) => isNcOpen(r));

  if (!serverLooksAuthoritative && apiScalarsDead && listsSignal) {
    const d = deriveDashboardStatsFromLists(incidents, actions, ncs);
    return { ...fromApi, ...d, stats: fromApi.stats };
  }

  return fromApi;
}
