import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';
import { isCriticalRisk, isActionOverdueDashboardRow, isNcOpen } from './kpiCore.service.js';

const PROCESS_TYPES = new Set(['management', 'realisation', 'support']);
const PROCESS_STATUSES = new Set(['conforme', 'a_surveiller', 'critique', 'a_revoir']);
export const LINK_TYPES = new Set([
  'risk',
  'action',
  'audit',
  'document',
  'indicator',
  'incident',
  'isoRequirement',
  'evidence',
  'conformityStatus'
]);
const LINK_ROLES = new Set(['main', 'secondary', 'evidence', 'kpi', 'correctiveAction']);

function asJsonArray(value) {
  if (Array.isArray(value)) return value.map((v) => String(v ?? '').trim()).filter(Boolean);
  return [];
}

export function sanitizeProcessInput(body = {}, { partial = false } = {}) {
  const out = {};
  if (!partial || body.name !== undefined) {
    const name = String(body.name || '').trim();
    if (!name) {
      const err = new Error('Le nom du processus est requis');
      err.statusCode = 400;
      throw err;
    }
    out.name = name.slice(0, 200);
  }
  if (body.type !== undefined) {
    const t = String(body.type || '').trim();
    if (!PROCESS_TYPES.has(t)) {
      const err = new Error('Type de processus invalide (management, realisation ou support)');
      err.statusCode = 400;
      throw err;
    }
    out.type = t;
  }
  if (body.purpose !== undefined) out.purpose = body.purpose == null ? null : String(body.purpose).trim().slice(0, 2000);
  if (body.ownerUserId !== undefined) out.ownerUserId = body.ownerUserId ? String(body.ownerUserId).trim() : null;
  if (body.deputyUserId !== undefined) out.deputyUserId = body.deputyUserId ? String(body.deputyUserId).trim() : null;
  if (body.siteId !== undefined) out.siteId = body.siteId ? String(body.siteId).trim() : null;
  if (body.inputs !== undefined) out.inputs = asJsonArray(body.inputs);
  if (body.outputs !== undefined) out.outputs = asJsonArray(body.outputs);
  if (body.interestedParties !== undefined) out.interestedParties = asJsonArray(body.interestedParties);
  if (body.status !== undefined) {
    const s = String(body.status || '').trim();
    if (!PROCESS_STATUSES.has(s)) {
      const err = new Error('Statut de processus invalide');
      err.statusCode = 400;
      throw err;
    }
    out.status = s;
  }
  if (body.reviewFrequency !== undefined) out.reviewFrequency = body.reviewFrequency ? String(body.reviewFrequency).trim().slice(0, 60) : null;
  if (body.lastReviewAt !== undefined) out.lastReviewAt = body.lastReviewAt ? new Date(body.lastReviewAt) : null;
  if (body.nextReviewAt !== undefined) out.nextReviewAt = body.nextReviewAt ? new Date(body.nextReviewAt) : null;
  return out;
}

export async function listProcesses(tenantId, { type, siteId } = {}) {
  const tf = prismaTenantFilter(tenantId);
  const where = { ...tf };
  if (type) where.type = type;
  if (siteId) where.siteId = siteId;
  const rows = await prisma.process.findMany({
    where,
    include: {
      owner: { select: { id: true, name: true, email: true } },
      deputy: { select: { id: true, name: true, email: true } },
      _count: { select: { links: true } },
      links: { select: { linkedType: true, linkedId: true } }
    },
    orderBy: [{ type: 'asc' }, { name: 'asc' }]
  });
  return rows;
}

export async function getProcessById(tenantId, id) {
  const tf = prismaTenantFilter(tenantId);
  const row = await prisma.process.findFirst({
    where: { id, ...tf },
    include: {
      owner: { select: { id: true, name: true, email: true } },
      deputy: { select: { id: true, name: true, email: true } },
      links: { orderBy: { createdAt: 'asc' } },
      reviews: {
        orderBy: { reviewedAt: 'desc' },
        include: { reviewedBy: { select: { id: true, name: true, email: true } } }
      }
    }
  });
  return row;
}

export async function listProcessReviews(tenantId, processId) {
  const tf = prismaTenantFilter(tenantId);
  const process = await prisma.process.findFirst({ where: { id: processId, ...tf }, select: { id: true } });
  if (!process) return null;
  return prisma.processReview.findMany({
    where: { processId: process.id },
    orderBy: { reviewedAt: 'desc' },
    include: { reviewedBy: { select: { id: true, name: true, email: true } } }
  });
}

export async function createProcessReview(tenantId, processId, body = {}, userId = null) {
  const tf = prismaTenantFilter(tenantId);
  const process = await prisma.process.findFirst({ where: { id: processId, ...tf }, select: { id: true } });
  if (!process) return null;

  const conclusion = String(body.conclusion || '').trim();
  if (!conclusion) {
    const err = new Error('La conclusion de la revue est requise');
    err.statusCode = 400;
    throw err;
  }
  let status = null;
  if (body.status !== undefined && body.status !== null && body.status !== '') {
    status = String(body.status).trim();
    if (!PROCESS_STATUSES.has(status)) {
      const err = new Error('Statut de processus invalide');
      err.statusCode = 400;
      throw err;
    }
  }
  const reviewedAt = body.reviewedAt ? new Date(body.reviewedAt) : new Date();
  const nextReviewAt = body.nextReviewAt ? new Date(body.nextReviewAt) : null;
  const tenant = normalizeTenantId(tenantId);

  const review = await prisma.processReview.create({
    data: {
      processId: process.id,
      conclusion: conclusion.slice(0, 4000),
      status,
      reviewedAt,
      nextReviewAt,
      reviewedByUserId: userId || null,
      ...(tenant ? { tenantId: tenant } : {})
    },
    include: { reviewedBy: { select: { id: true, name: true, email: true } } }
  });

  const updateData = { lastReviewAt: reviewedAt };
  if (nextReviewAt) updateData.nextReviewAt = nextReviewAt;
  if (status) updateData.status = status;
  await prisma.process.update({ where: { id: process.id }, data: updateData });

  return review;
}

export async function createProcess(tenantId, body = {}) {
  const data = sanitizeProcessInput(body, { partial: false });
  const tenant = normalizeTenantId(tenantId);
  const created = await prisma.process.create({
    data: {
      ...data,
      type: data.type || 'realisation',
      status: data.status || 'a_surveiller',
      ...(tenant ? { tenantId: tenant } : {})
    }
  });
  return created;
}

export async function updateProcess(tenantId, id, body = {}) {
  const tf = prismaTenantFilter(tenantId);
  const current = await prisma.process.findFirst({ where: { id, ...tf }, select: { id: true } });
  if (!current) return null;
  const data = sanitizeProcessInput(body, { partial: true });
  await prisma.process.update({ where: { id: current.id }, data });
  return getProcessById(tenantId, current.id);
}

export async function deleteProcess(tenantId, id) {
  const tf = prismaTenantFilter(tenantId);
  const row = await prisma.process.findFirst({ where: { id, ...tf }, select: { id: true } });
  if (!row) return false;
  await prisma.process.delete({ where: { id: row.id } });
  return true;
}

export async function addProcessLink(tenantId, processId, body = {}) {
  const tf = prismaTenantFilter(tenantId);
  const process = await prisma.process.findFirst({ where: { id: processId, ...tf }, select: { id: true } });
  if (!process) return null;
  const linkedType = String(body.linkedType || '').trim();
  const linkedId = String(body.linkedId || '').trim();
  if (!LINK_TYPES.has(linkedType) || !linkedId) {
    const err = new Error('linkedType ou linkedId invalide');
    err.statusCode = 400;
    throw err;
  }
  const role = body.role != null && String(body.role).trim() ? String(body.role).trim() : null;
  if (role && !LINK_ROLES.has(role)) {
    const err = new Error('Rôle de lien invalide');
    err.statusCode = 400;
    throw err;
  }
  const tenant = normalizeTenantId(tenantId);
  const created = await prisma.processLink.upsert({
    where: { processId_linkedType_linkedId: { processId: process.id, linkedType, linkedId } },
    create: { processId: process.id, linkedType, linkedId, role, ...(tenant ? { tenantId: tenant } : {}) },
    update: { role }
  });
  return created;
}

export async function removeProcessLink(tenantId, processId, linkId) {
  const tf = prismaTenantFilter(tenantId);
  const process = await prisma.process.findFirst({ where: { id: processId, ...tf }, select: { id: true } });
  if (!process) return false;
  const del = await prisma.processLink.deleteMany({ where: { id: linkId, processId: process.id } });
  return del.count > 0;
}

/**
 * Score de maîtrise d'un processus (0..100, pas de pénalité tant que rien n'est lié/configuré).
 * Pénalités : actions en retard, risques critiques, documents expirés, audits/écarts ouverts,
 * revue de processus en retard, preuves ISO manquantes pour les exigences liées.
 */
export async function computeProcessScore(tenantId, process) {
  const links = Array.isArray(process?.links) ? process.links : [];
  const idsByType = (type) => links.filter((l) => l.linkedType === type).map((l) => l.linkedId);
  const tf = prismaTenantFilter(tenantId);

  const penalties = [];
  let total = 0;

  const riskIds = idsByType('risk');
  if (riskIds.length) {
    const risks = await prisma.risk.findMany({ where: { id: { in: riskIds }, ...tf } });
    const critical = risks.filter(isCriticalRisk).length;
    if (critical > 0) {
      const p = Math.min(35, critical * 12);
      total += p;
      penalties.push({ key: 'risksCritical', count: critical, points: p, label: `${critical} risque(s) critique(s)` });
    }
  }

  const actionIds = idsByType('action');
  if (actionIds.length) {
    const actions = await prisma.action.findMany({ where: { id: { in: actionIds }, ...tf } });
    const overdue = actions.filter(isActionOverdueDashboardRow).length;
    if (overdue > 0) {
      const p = Math.min(35, overdue * 8);
      total += p;
      penalties.push({ key: 'actionsOverdue', count: overdue, points: p, label: `${overdue} action(s) en retard` });
    }
  }

  const docIds = idsByType('document');
  if (docIds.length) {
    const docs = await prisma.controlledDocument.findMany({ where: { id: { in: docIds }, ...tf } });
    const now = Date.now();
    const expired = docs.filter((d) => d.expiresAt && new Date(d.expiresAt).getTime() < now).length;
    if (expired > 0) {
      const p = Math.min(25, expired * 10);
      total += p;
      penalties.push({ key: 'documentsExpired', count: expired, points: p, label: `${expired} document(s) expiré(s)` });
    }
  }

  const auditIds = idsByType('audit');
  if (auditIds.length) {
    const audits = await prisma.audit.findMany({ where: { id: { in: auditIds }, ...tf }, include: { nonConformities: true } });
    let openNc = 0;
    for (const a of audits) {
      openNc += (a.nonConformities || []).filter((nc) => isNcOpen(nc.status)).length;
    }
    if (openNc > 0) {
      const p = Math.min(30, openNc * 6);
      total += p;
      penalties.push({ key: 'ncOpen', count: openNc, points: p, label: `${openNc} non-conformité(s) ouverte(s)` });
    }
  }

  const incidentIds = idsByType('incident');
  if (incidentIds.length) {
    const incidents = await prisma.incident.findMany({ where: { id: { in: incidentIds }, ...tf } });
    const critical = incidents.filter((i) => /critique|critical/i.test(String(i.severity || ''))).length;
    if (critical > 0) {
      const p = Math.min(30, critical * 10);
      total += p;
      penalties.push({ key: 'incidentsCritical', count: critical, points: p, label: `${critical} incident(s) critique(s)` });
    }
  }

  if (process?.nextReviewAt) {
    const due = new Date(process.nextReviewAt).getTime();
    if (Number.isFinite(due) && due < Date.now()) {
      total += 10;
      penalties.push({ key: 'reviewOverdue', count: 1, points: 10, label: 'Revue de processus en retard' });
    }
  }

  const isoReqIds = idsByType('isoRequirement');
  if (isoReqIds.length) {
    const evidences = await prisma.isoEvidence.findMany({
      where: { requirementId: { in: isoReqIds }, ...tf },
      select: { requirementId: true }
    });
    const covered = new Set(evidences.map((e) => e.requirementId));
    const missing = isoReqIds.filter((id) => !covered.has(id)).length;
    if (missing > 0 && missing < isoReqIds.length) {
      // Compte neuf sans aucune preuve : pas de pénalité (cohérent avec isoScore.js / smi.service.js).
      const p = Math.min(20, missing * 4);
      total += p;
      penalties.push({ key: 'isoEvidenceMissing', count: missing, points: p, label: `${missing} exigence(s) ISO sans preuve` });
    }
  }

  const score = Math.max(0, Math.min(100, Math.round(100 - total)));
  return { score, penalties };
}

/**
 * Enregistre un instantané du score si aucun n'a encore été pris aujourd'hui pour ce processus.
 */
export async function recordScoreSnapshot(tenantId, processId, score) {
  const tenant = normalizeTenantId(tenantId);
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  const existing = await prisma.processScoreSnapshot.findFirst({
    where: { processId, capturedAt: { gte: startOfDay } },
    select: { id: true }
  });
  if (existing) return;
  await prisma.processScoreSnapshot.create({
    data: {
      processId,
      score,
      ...(tenant ? { tenantId: tenant } : {})
    }
  });
}

export async function getProcessScoreHistory(tenantId, processId, days = 90) {
  const tf = prismaTenantFilter(tenantId);
  const process = await prisma.process.findFirst({ where: { id: processId, ...tf }, select: { id: true } });
  if (!process) return null;
  const since = new Date();
  since.setDate(since.getDate() - days);
  return prisma.processScoreSnapshot.findMany({
    where: { processId: process.id, capturedAt: { gte: since } },
    orderBy: { capturedAt: 'asc' },
    select: { score: true, capturedAt: true }
  });
}
