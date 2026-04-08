/**
 * Interception qhseFetch en mode exploration — réponses JSON locales + PATCH légers (Kanban / incidents).
 */

import {
  demoSites,
  demoUsers,
  demoIncidentsBase,
  demoActionsBase,
  demoAudits,
  demoNonConformities,
  demoNotifications,
  demoControlledDocuments,
  buildDemoDashboardStats,
  buildDemoReportingSummary
} from '../data/demoModeFixtures.js';
import {
  loadDemoRuntime,
  patchDemoActionRuntime,
  patchDemoIncidentRuntime
} from './demoModeRuntime.service.js';

/**
 * @param {unknown} body
 */
async function readJsonBody(body) {
  if (body == null || body === '') return {};
  if (typeof body === 'string') {
    try {
      return JSON.parse(body);
    } catch {
      return {};
    }
  }
  return {};
}

/**
 * @param {unknown} data
 * @param {number} [status=200]
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8' }
  });
}

/**
 * @param {string} path — URL absolue ou relative /api/…
 */
function parseApiPath(path) {
  const href = path.startsWith('http')
    ? path
    : `http://qhse.local${path.startsWith('/') ? '' : '/'}${path}`;
  const u = new URL(href);
  return { pathname: u.pathname, sp: u.searchParams };
}

function getMergedIncidents() {
  const { incidentPatches } = loadDemoRuntime();
  return demoIncidentsBase.map((r) => ({ ...r, ...(incidentPatches[r.ref] || {}) }));
}

function getMergedActions() {
  const { actionPatches } = loadDemoRuntime();
  return demoActionsBase.map((r) => {
    const p = actionPatches[r.id] || {};
    const row = { ...r, ...p };
    if (Object.prototype.hasOwnProperty.call(p, 'assigneeId')) {
      const payload = findAssigneePayload(row.assigneeId);
      row.assigneeId = payload.assigneeId;
      row.assignee = payload.assignee;
      if (!row.assigneeId) row.owner = row.owner || 'À assigner';
    }
    return row;
  });
}

function filterDemoActions(list, sp) {
  let out = [...list];
  if (sp.get('unassigned') === '1') {
    out = out.filter((a) => !a.assigneeId);
  } else if (sp.get('assigneeId')) {
    const id = sp.get('assigneeId');
    out = out.filter((a) => a.assigneeId === id);
  }
  const lim = Math.min(500, Math.max(1, parseInt(String(sp.get('limit') || '500'), 10) || 500));
  return out.slice(0, lim);
}

function findAssigneePayload(assigneeId) {
  if (!assigneeId) return { assigneeId: null, assignee: null };
  const u = demoUsers.find((x) => x.id === assigneeId);
  return {
    assigneeId,
    assignee: u ? { id: u.id, name: u.name, email: u.email } : null
  };
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 * @returns {Promise<Response | null>} null = laisser le fetch réseau
 */
export async function tryDemoFetchResponse(path, init = {}) {
  const method = String(init.method || 'GET').toUpperCase();
  const { pathname, sp } = parseApiPath(path);

  const mActPatch = /^\/api\/actions\/([^/]+)$/.exec(pathname);
  if (mActPatch && method === 'PATCH') {
    const id = decodeURIComponent(mActPatch[1]);
    const body = await readJsonBody(init.body);
    patchDemoActionRuntime(id, body);
    const row = getMergedActions().find((a) => a.id === id);
    if (!row) return jsonResponse({ error: 'Action introuvable en mode exploration' }, 404);
    return jsonResponse(row);
  }

  const mActAssign = /^\/api\/actions\/([^/]+)\/assign$/.exec(pathname);
  if (mActAssign && method === 'PATCH') {
    const id = decodeURIComponent(mActAssign[1]);
    const body = await readJsonBody(init.body);
    const aid = body.assigneeId != null ? String(body.assigneeId).trim() : '';
    const payload = findAssigneePayload(aid || null);
    patchDemoActionRuntime(id, payload);
    const row = getMergedActions().find((a) => a.id === id);
    if (!row) return jsonResponse({ error: 'Action introuvable en mode exploration' }, 404);
    return jsonResponse(row);
  }

  const mIncPatch = /^\/api\/incidents\/([^/]+)$/.exec(pathname);
  if (mIncPatch && method === 'PATCH') {
    const ref = decodeURIComponent(mIncPatch[1]);
    const body = await readJsonBody(init.body);
    patchDemoIncidentRuntime(ref, body);
    const row = getMergedIncidents().find((i) => i.ref === ref);
    if (!row) return jsonResponse({ error: 'Incident introuvable en mode exploration' }, 404);
    return jsonResponse(row);
  }

  if (method !== 'GET') {
    return null;
  }

  if (pathname === '/api/dashboard/stats') {
    const inc = getMergedIncidents();
    const act = getMergedActions();
    return jsonResponse(buildDemoDashboardStats(inc, act, demoNonConformities));
  }

  if (pathname === '/api/incidents') {
    return jsonResponse(getMergedIncidents());
  }

  const mIncGet = /^\/api\/incidents\/([^/]+)$/.exec(pathname);
  if (mIncGet) {
    const ref = decodeURIComponent(mIncGet[1]);
    const row = getMergedIncidents().find((i) => i.ref === ref);
    if (!row) return jsonResponse({ error: 'Incident introuvable' }, 404);
    return jsonResponse(row);
  }

  if (pathname === '/api/actions') {
    return jsonResponse(filterDemoActions(getMergedActions(), sp));
  }

  const mActGet = /^\/api\/actions\/([^/]+)$/.exec(pathname);
  if (mActGet) {
    const id = decodeURIComponent(mActGet[1]);
    const row = getMergedActions().find((a) => a.id === id);
    if (!row) return jsonResponse({ error: 'Action introuvable' }, 404);
    return jsonResponse(row);
  }

  if (pathname === '/api/audits') {
    return jsonResponse(demoAudits);
  }

  if (pathname === '/api/nonconformities') {
    return jsonResponse(demoNonConformities);
  }

  if (pathname === '/api/notifications') {
    return jsonResponse(demoNotifications);
  }

  if (pathname === '/api/sites') {
    return jsonResponse(demoSites);
  }

  if (pathname === '/api/users') {
    return jsonResponse(demoUsers);
  }

  if (pathname === '/api/controlled-documents') {
    return jsonResponse(demoControlledDocuments);
  }

  if (pathname === '/api/reports/summary') {
    return jsonResponse(
      buildDemoReportingSummary(
        getMergedIncidents(),
        getMergedActions(),
        demoAudits,
        demoNonConformities
      )
    );
  }

  return null;
}
