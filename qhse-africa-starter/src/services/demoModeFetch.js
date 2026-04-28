/**
 * Interception qhseFetch en mode exploration · réponses JSON locales + mutations légères (sans backend).
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
  demoPtwBase,
  demoHabilitationsBase,
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

/** @type {null | Array<Record<string, unknown>>} */
let demoPtwRuntime = null;

function getDemoPtwRows() {
  if (!Array.isArray(demoPtwRuntime)) {
    demoPtwRuntime = demoPtwBase.map((row) => ({ ...row }));
  }
  return demoPtwRuntime;
}

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
 * @param {string} path · URL absolue ou relative /api/…
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

/**
 * CSV démo aligné sur l’API (UTF-8 BOM, séparateur ;).
 * @param {string[][]} rows
 */
function demoSemicolonCsv(rows) {
  const esc = (v) => {
    const s = String(v ?? '');
    if (/[";\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const body = rows.map((cols) => cols.map(esc).join(';')).join('\n');
  return `\uFEFF${body}`;
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
 * @returns {Promise<Response | null>} null uniquement si hors périmètre (ne plus utiliser en prod démo · voir qhseFetch)
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
        : demoSites.find((s) => s.id === siteId)?.name || 'Katiola Mining · Site Yakouro';
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
    const dc = body.dashboardContext;
    if (dc && typeof dc === 'object' && !Array.isArray(dc) && Object.keys(dc).length > 0 && !incidentId) {
      const overdue = Number(dc.actionsOverdue ?? 0) || 0;
      const crit = Array.isArray(dc.criticalIncidentsPreview) ? dc.criticalIncidentsPreview.length : 0;
      return jsonResponse({
        mode: 'dashboard',
        provider: 'demo',
        error: null,
        narrative: [
          'Mode démo : lecture pilotage à partir des indicateurs transmis.',
          overdue ? `${overdue} action(s) en retard · prioriser l’arbitrage et les relances.` : null,
          crit ? `${crit} incident(s) critique(s) dans les extraits · sécuriser la réponse et la traçabilité.` : null,
          'Maintenir la cohérence entre tableau de bord et retours terrain.'
        ]
          .filter(Boolean)
          .join(' '),
        actions: [
          {
            title: 'Point retards & charge',
            description: 'Réunion courte pour réaffecter ou replanifier les actions signalées en retard.',
            delayDays: 3,
            ownerRole: 'Direction site',
            confidence: 0.7
          },
          {
            title: 'Revue incidents sensibles',
            description: 'Contrôler statuts, mesures immédiates et liens avec le registre risques.',
            delayDays: 5,
            ownerRole: 'Responsable QHSE',
            confidence: 0.64
          }
        ]
      });
    }
    if (!incidentId) {
      return jsonResponse({ error: 'incidentId ou dashboardContext requis' }, 400);
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
      'Analyse exploration (mine / SST) : causes probables.',
      '• Organisation : coordination engins / piétons, permis de travail, consignes de circulation.',
      '• Matériel : intégrité garde-corps, signalisation dynamique, état des engins blindés.',
      '• Humain : formation SST actualisée, fatigue poste nuit, respect des EPI (casque, chaussures, visibilité).',
      '• Environnement : pluie / boue, poussière silice, éclairage insuffisant en fin de quart.',
      '',
      `Réf. dossier : ${ref} · valider sur le terrain avant clôture.`
    ].join('\n');
    return jsonResponse({ suggestion });
  }

  if (pathname === '/api/ptw' && method === 'POST') {
    const body = await readJsonBody(init.body);
    const now = new Date().toISOString();
    const id = `ptw-demo-${Date.now()}`;
    const row = {
      id,
      ref: `PTW-DEMO-${new Date().getFullYear()}-${String(getDemoPtwRows().length + 1).padStart(3, '0')}`,
      type: String(body.type || 'travail en hauteur'),
      description: String(body.description || ''),
      zone: String(body.zone || 'Fosse Nord'),
      date: String(body.date || now.slice(0, 10)),
      team: String(body.team || 'Equipe terrain'),
      checklist: Array.isArray(body.checklist) ? body.checklist : [],
      epi: Array.isArray(body.epi) ? body.epi : [],
      safetyConditions: Array.isArray(body.safetyConditions) ? body.safetyConditions : [],
      status: String(body.status || 'pending'),
      riskAnalysis: String(body.riskAnalysis || ''),
      validationMode: String(body.validationMode || 'double'),
      signatures: [],
      synced: true,
      syncState: 'synced',
      syncPendingCount: 0,
      createdAt: now,
      updatedAt: now
    };
    getDemoPtwRows().unshift(row);
    return jsonResponse(row, 201);
  }

  const mPtwPatch = /^\/api\/ptw\/([^/]+)$/.exec(pathname);
  if (mPtwPatch && method === 'PATCH') {
    const id = decodeURIComponent(mPtwPatch[1]);
    const patch = await readJsonBody(init.body);
    const row = getDemoPtwRows().find((r) => r.id === id);
    if (!row) return jsonResponse({ error: 'Permis introuvable' }, 404);
    Object.assign(row, patch || {}, { updatedAt: new Date().toISOString() });
    return jsonResponse(row);
  }

  const mPtwSign = /^\/api\/ptw\/([^/]+)\/sign$/.exec(pathname);
  if (mPtwSign && method === 'PATCH') {
    const id = decodeURIComponent(mPtwSign[1]);
    const body = await readJsonBody(init.body);
    const row = getDemoPtwRows().find((r) => r.id === id);
    if (!row) return jsonResponse({ error: 'Permis introuvable' }, 404);
    const sig = {
      id: `ptw-sig-${Date.now()}`,
      role: String(body.role || 'supervisor'),
      name: String(body.name || 'Signataire'),
      signedAt: new Date().toISOString(),
      signatureDataUrl: String(body.signatureDataUrl || ''),
      userId: String(body.userId || ''),
      userLabel: String(body.userLabel || ''),
      syncStatus: 'synced'
    };
    row.signatures = Array.isArray(row.signatures) ? row.signatures : [];
    row.signatures.push(sig);
    row.updatedAt = new Date().toISOString();
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

  if (pathname === '/api/ptw') {
    let rows = [...getDemoPtwRows()];
    const siteId = sp.get('siteId');
    if (siteId) rows = rows.filter((r) => !r.siteId || r.siteId === siteId);
    return jsonResponse(rows);
  }

  if (pathname === '/api/habilitations') {
    return jsonResponse(demoHabilitationsBase);
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
      periode: `Année ${yLabel} · Katiola (démo)`,
      objectifTF: 2,
      objectifTG: 0.5,
      tfPrev: 2.31,
      tgPrev: 0.55,
      prevPeriode: 'Période précédente (jeu d’illustration)'
    });
  }

  if (pathname === '/api/export/incidents') {
    const rows = filterIncidentsForList(sp);
    const data = [
      ['Ref', 'Type', 'Site', 'Gravite', 'Statut', 'Description', 'Responsable', 'Date'],
      ...rows.map((r) => [
        r.ref,
        r.type,
        r.site,
        r.severity,
        r.status,
        r.description || '',
        r.responsible || '',
        r.createdAt ? new Date(r.createdAt).toLocaleDateString('fr-FR') : ''
      ])
    ];
    return new Response(demoSemicolonCsv(data), {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8' }
    });
  }

  if (pathname === '/api/export/risks') {
    const rows = filterDemoRisks(sp);
    const data = [
      ['Ref', 'Titre', 'Categorie', 'Probabilite', 'Gravite', 'GP', 'Statut', 'Proprietaire', 'Site'],
      ...rows.map((r) => [
        r.ref ?? '',
        r.title,
        r.category || '',
        r.probability,
        r.severity,
        r.gp ?? r.gravity ?? '',
        r.status,
        r.owner || '',
        r.siteId || ''
      ])
    ];
    return new Response(demoSemicolonCsv(data), {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8' }
    });
  }

  if (pathname === '/api/export/actions') {
    let rows = getMergedActions();
    const siteId = sp.get('siteId');
    if (siteId) rows = rows.filter((r) => r.siteId === siteId);
    const data = [
      ['Titre', 'Responsable', 'Echeance', 'Priorite', 'Statut'],
      ...rows.map((r) => [
        r.title,
        r.owner || '',
        r.dueDate ? new Date(r.dueDate).toLocaleDateString('fr-FR') : '',
        '',
        r.status
      ])
    ];
    return new Response(demoSemicolonCsv(data), {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8' }
    });
  }

  if (pathname === '/api/export/audits') {
    let rows = [...demoAudits];
    const siteId = sp.get('siteId');
    if (siteId) rows = rows.filter((r) => r.siteId === siteId);
    const data = [
      ['Ref', 'Site', 'Date', 'Score', 'Statut'],
      ...rows.map((r) => [
        r.ref,
        r.site || '',
        new Date(r.createdAt).toLocaleDateString('fr-FR'),
        r.score ?? '',
        r.status
      ])
    ];
    return new Response(demoSemicolonCsv(data), {
      status: 200,
      headers: { 'Content-Type': 'text/csv; charset=utf-8' }
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
