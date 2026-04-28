/**
 * État runtime mode exploration (session) · patches sur incidents / actions sans API.
 */

const KEY = 'qhse-demo-runtime-v1';

/**
 * @returns {{ actionPatches: Record<string, object>; incidentPatches: Record<string, object>; createdIncidents: object[]; createdActions: object[] }}
 */
export function loadDemoRuntime() {
  try {
    const raw = sessionStorage.getItem(KEY);
    const j = raw ? JSON.parse(raw) : {};
    return {
      actionPatches:
        j.actionPatches && typeof j.actionPatches === 'object' ? j.actionPatches : {},
      incidentPatches:
        j.incidentPatches && typeof j.incidentPatches === 'object'
          ? j.incidentPatches
          : {},
      createdIncidents: Array.isArray(j.createdIncidents) ? j.createdIncidents : [],
      createdActions: Array.isArray(j.createdActions) ? j.createdActions : []
    };
  } catch {
    return { actionPatches: {}, incidentPatches: {}, createdIncidents: [], createdActions: [] };
  }
}

/** @param {{ actionPatches: object; incidentPatches: object; createdIncidents?: object[] }} state */
export function saveDemoRuntime(state) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

export function resetDemoRuntime() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}

/** @param {string} id @param {object} partial */
export function patchDemoActionRuntime(id, partial) {
  const s = loadDemoRuntime();
  s.actionPatches[id] = { ...s.actionPatches[id], ...partial };
  saveDemoRuntime(s);
}

/** @param {string} ref @param {object} partial */
export function patchDemoIncidentRuntime(ref, partial) {
  const s = loadDemoRuntime();
  s.incidentPatches[ref] = { ...s.incidentPatches[ref], ...partial };
  saveDemoRuntime(s);
}

/** @param {object} row · ligne incident complète (POST /api/incidents) */
export function appendDemoCreatedIncident(row) {
  const s = loadDemoRuntime();
  if (!Array.isArray(s.createdIncidents)) s.createdIncidents = [];
  s.createdIncidents.unshift(row);
  saveDemoRuntime(s);
}

/** @param {object} row · ligne action (POST /api/actions) */
export function appendDemoCreatedAction(row) {
  const s = loadDemoRuntime();
  if (!Array.isArray(s.createdActions)) s.createdActions = [];
  s.createdActions.unshift(row);
  saveDemoRuntime(s);
}

/**
 * @param {object[]} baseList
 * @param {(row: object) => string} getId
 */
export function mergeDemoRows(baseList, getId, patchMap) {
  return baseList.map((row) => {
    const id = getId(row);
    const p = patchMap[id];
    return p ? { ...row, ...p } : row;
  });
}
