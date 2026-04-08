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
 * Aligne les compteurs API avec les listes chargées (même filtre site).
 */
export function reconcileDashboardStatsWithLists(apiStats, incidents, actions, ncs) {
  const base = apiStats && typeof apiStats === 'object' ? { ...apiStats } : {};
  const d = deriveDashboardStatsFromLists(incidents, actions, ncs);
  const out = {
    incidents: asDashboardCount(base.incidents),
    actions: asDashboardCount(base.actions),
    overdueActions: asDashboardCount(base.overdueActions),
    nonConformities: asDashboardCount(base.nonConformities),
    criticalIncidents: Array.isArray(base.criticalIncidents) ? base.criticalIncidents : [],
    overdueActionItems: Array.isArray(base.overdueActionItems) ? base.overdueActionItems : []
  };

  const apiScalarsDead =
    out.incidents === 0 &&
    out.actions === 0 &&
    out.overdueActions === 0 &&
    out.nonConformities === 0;
  const listsSignal =
    d.incidents > 0 ||
    d.actions > 0 ||
    d.overdueActions > 0 ||
    d.nonConformities > 0 ||
    d.criticalIncidents.length > 0;

  if (apiScalarsDead && listsSignal) {
    return {
      incidents: d.incidents,
      actions: d.actions,
      overdueActions: d.overdueActions,
      nonConformities: d.nonConformities,
      criticalIncidents: d.criticalIncidents,
      overdueActionItems: d.overdueActionItems
    };
  }

  out.incidents = Math.max(out.incidents, d.incidents);
  out.actions = Math.max(out.actions, d.actions);
  out.overdueActions = Math.max(out.overdueActions, d.overdueActions);
  out.nonConformities = Math.max(out.nonConformities, d.nonConformities);
  if (!out.criticalIncidents.length && d.criticalIncidents.length) {
    out.criticalIncidents = d.criticalIncidents;
  }
  if (!out.overdueActionItems.length && d.overdueActionItems.length) {
    out.overdueActionItems = d.overdueActionItems;
  }
  return out;
}
