/**
 * Interception qhseFetch en mode exploration — réponses JSON locales + mutations légères (sans backend).
 */

import {
  DEMO_SITE_ID,
  demoSites,
  demoUsers,
  demoIncidentsBase,
  demoActionsBase,
  demoAudits,
  demoNonConformities,
  demoNotifications,
  demoControlledDocuments,
  demoRisks,
  buildDemoDashboardStats,
  buildDemoReportingSummary,
  buildDemoAiRootCausesPayload,
  buildDemoAiCorrectiveActionsPayload
} from '../data/demoModeFixtures.js';
import {
  loadDemoRuntime,
  patchDemoActionRuntime,
  patchDemoIncidentRuntime,
  appendDemoCreatedIncident,
  appendDemoCreatedAction
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
  const { incidentPatches, createdIncidents } = loadDemoRuntime();
  const created = Array.isArray(createdIncidents) ? createdIncidents : [];
  const patchedCreated = created.map((r) => ({
    ...r,
    ...(incidentPatches[r.ref] || {})
  }));
  const patchedBase = demoIncidentsBase.map((r) => ({
    ...r,
    ...(incidentPatches[r.ref] || {})
  }));
  return [...patchedCreated, ...patchedBase];
}

function filterIncidentsForList(sp) {
  let list = getMergedIncidents();
  const siteId = sp.get('siteId');
  if (siteId) {
    list = list.filter((r) => r.siteId === siteId);
  }
  const lim = Math.min(500, Math.max(1, parseInt(String(sp.get('limit') || '500'), 10) || 500));
  return list.slice(0, lim);
}

function filterDemoRisks(sp) {
  let out = [...demoRisks];
  const siteId = sp.get('siteId');
  if (siteId) {
    out = out.filter((r) => r.siteId === siteId);
  }
  const lim = Math.min(500, Math.max(1, parseInt(String(sp.get('limit') || '300'), 10) || 300));
  return out.slice(0, lim);
}

function getMergedActions() {
  const { actionPatches, createdActions } = loadDemoRuntime();
  const created = Array.isArray(createdActions) ? createdActions : [];
  const patchedCreated = created.map((r) => {
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
  const patchedBase = demoActionsBase.map((r) => {
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
  return [...patchedCreated, ...patchedBase];
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

function mapSeverityForDemoApi(raw) {
  const t = String(raw || '').toLowerCase();
  if (t === 'critique') return 'Critique';
  if (t === 'faible') return 'Faible';
  if (t === 'élevée' || t === 'elevee' || t === 'elevée') return 'Élevée';
  return 'Moyenne';
}

function findDemoIncidentById(id) {
  const sid = String(id || '').trim();
  if (!sid) return null;
  return getMergedIncidents().find((i) => i.id === sid) || null;
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 * @returns {Promise<Response | null>} null uniquement si hors périmètre (ne plus utiliser en prod démo — voir qhseFetch)
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

  if (pathname === '/api/incidents' && method === 'POST') {
    const body = await readJsonBody(init.body);
    const ref = typeof body.ref === 'string' ? body.ref.trim() : '';
    if (!ref) {
      return jsonResponse({ error: 'Référence incident requise' }, 400);
    }
    const id = `cldemo-inc-${Date.now()}`;
    const now = new Date().toISOString();
    const siteId =
      typeof body.siteId === 'string' && body.siteId.trim() ? body.siteId.trim() : DEMO_SITE_ID;
    const siteLabel =
      typeof body.site === 'string' && body.site.trim()
        ? body.site.trim()
        : demoSites.find((s) => s.id === siteId)?.name || 'Katiola Mining — Site Yakouro';
    const row = {
      id,
      ref,
      type: typeof body.type === 'string' ? body.type.trim() : 'Événement',
      site: siteLabel,
      siteId,
      severity: mapSeverityForDemoApi(body.severity),
      description: typeof body.description === 'string' ? body.description : '',
      status: typeof body.status === 'string' ? body.status.trim() : 'Nouveau',
      createdAt: now,
      location: body.location != null ? String(body.location) : null,
      causes: body.causes != null ? String(body.causes) : null,
      causeCategory: body.causeCategory != null ? String(body.causeCategory).trim() || null : null,
      photosJson: typeof body.photosJson === 'string' ? body.photosJson : null,
      responsible: body.responsible != null ? String(body.responsible).trim() || null : null
    };
    appendDemoCreatedIncident(row);
    return jsonResponse(row, 201);
  }

  if (pathname === '/api/actions' && method === 'POST') {
    const body = await readJsonBody(init.body);
    const title = typeof body.title === 'string' ? body.title.trim() : '';
    const status = typeof body.status === 'string' ? body.status.trim() : '';
    if (!title || !status) {
      return jsonResponse({ error: 'Champs requis : title, status' }, 400);
    }
    const ownerRaw = typeof body.owner === 'string' ? body.owner.trim() : '';
    const aid =
      body.assigneeId != null && String(body.assigneeId).trim() !== ''
        ? String(body.assigneeId).trim()
        : null;
    const payload = findAssigneePayload(aid);
    const siteId =
      typeof body.siteId === 'string' && body.siteId.trim() !== ''
        ? body.siteId.trim()
        : DEMO_SITE_ID;
    const detail =
      body.detail != null && body.detail !== '' ? String(body.detail).slice(0, 8000) : '';
    const id = `cldemo-act-${Date.now()}`;
    const now = new Date().toISOString();
    const row = {
      id,
      title,
      detail,
      status,
      owner: payload.assignee ? ownerRaw || payload.assignee.name : ownerRaw || 'À assigner',
      dueDate: null,
      siteId,
      assigneeId: payload.assigneeId,
      assignee: payload.assignee,
      incidentId: null,
      createdAt: now
    };
    appendDemoCreatedAction(row);
    return jsonResponse(row, 201);
  }

  if (pathname === '/api/ai-suggestions/suggest/root-causes' && method === 'POST') {
    const body = await readJsonBody(init.body);
    const incidentId = String(body.incidentId ?? '').trim();
    if (!incidentId) {
      return jsonResponse({ error: 'incidentId requis' }, 400);
    }
    const inc = findDemoIncidentById(incidentId);
    if (!inc) {
      return jsonResponse({ error: 'Incident introuvable' }, 404);
    }
    return jsonResponse(buildDemoAiRootCausesPayload(inc));
  }

  if (pathname === '/api/ai-suggestions/suggest/actions' && method === 'POST') {
    const body = await readJsonBody(init.body);
    const incidentId = String(body.incidentId ?? '').trim();
    if (!incidentId) {
      return jsonResponse({ error: 'incidentId requis' }, 400);
    }
    const inc = findDemoIncidentById(incidentId);
    if (!inc) {
      return jsonResponse({ error: 'Incident introuvable' }, 404);
    }
    return jsonResponse(buildDemoAiCorrectiveActionsPayload(inc));
  }

  if (pathname === '/api/ai/incident-causes' && method === 'POST') {
    const body = await readJsonBody(init.body);
    const ref = String(body?.ref || '').trim() || 'INC';
    const suggestion = [
      'Analyse exploration (mine / SST) — causes probables :',
      '• Organisation : coordination engins / piétons, permis de travail, consignes de circulation.',
      '• Matériel : intégrité garde-corps, signalisation dynamique, état des engins blindés.',
      '• Humain : formation SST actualisée, fatigue poste nuit, respect des EPI (casque, chaussures, visibilité).',
      '• Environnement : pluie / boue, poussière silice, éclairage insuffisant en fin de quart.',
      '',
      `Réf. dossier : ${ref} — valider sur le terrain avant clôture.`
    ].join('\n');
    return jsonResponse({ suggestion });
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
    return jsonResponse(filterIncidentsForList(sp));
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

  if (pathname === '/api/risks') {
    return jsonResponse(filterDemoRisks(sp));
  }

  if (pathname === '/api/incidents/kpi/tf-tg') {
    const y = sp.get('year');
    const year =
      y !== undefined && y !== null && String(y).trim() !== ''
        ? Math.floor(Number(y))
        : new Date().getFullYear();
    const yLabel = Number.isFinite(year) ? String(year) : String(new Date().getFullYear());
    return jsonResponse({
      tf: 1.85,
      tg: 0.42,
      accidentsAvecArret: 2,
      joursPerdus: 12,
      heuresTravaillees: 1080000,
      periode: `Année ${yLabel} — Katiola (démo)`,
      objectifTF: 2,
      objectifTG: 0.5,
      tfPrev: 2.31,
      tgPrev: 0.55,
      prevPeriode: 'Période précédente (jeu d’illustration)'
    });
  }

  if (pathname === '/api/export/incidents') {
    const rows = filterIncidentsForList(sp);
    const esc = (v) => {
      const s = String(v ?? '');
      if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
      return s;
    };
    const header = 'ref,type,site,severity,status,createdAt,location,description';
    const lines = rows.map((r) =>
      [
        esc(r.ref),
        esc(r.type),
        esc(r.site),
        esc(r.severity),
        esc(r.status),
        esc(r.createdAt),
        esc(r.location),
        esc(r.description)
      ].join(',')
    );
    const csv = `\uFEFF${header}\n${lines.join('\n')}`;
    return new Response(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8'
      }
    });
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
