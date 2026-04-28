import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { assertIncidentExistsOrNull } from './incidents.service.js';
import { isActionOverdueDashboardRow } from './kpiCore.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

const assigneeSelect = {
  id: true,
  name: true,
  email: true,
  role: true
};

function normalizeAssigneeIdInput(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

/**
 * @param {string | null | undefined} userId
 */
async function assertAssigneeExistsInTenant(tenantId, userId) {
  const uid = normalizeAssigneeIdInput(userId);
  if (!uid) {
    const err = new Error('Utilisateur assigné introuvable');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const t = tf.tenantId;
  if (!t) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }

  const m = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: t, userId: uid } },
    include: { user: { select: { id: true, name: true, email: true, role: true } } }
  });
  const user = m?.user ?? null;
  if (!user) {
    const err = new Error('Utilisateur assigné introuvable');
    err.statusCode = 400;
    throw err;
  }
  return user;
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string | null | undefined} actionId
 */
async function assertActionInTenant(tenantId, actionId) {
  const id = typeof actionId === 'string' ? actionId.trim() : '';
  if (!id) {
    const err = new Error('Action introuvable');
    err.code = 'P2025';
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const row = await prisma.action.findFirst({
    where: { id, ...tf },
    select: { id: true }
  });
  if (!row) {
    const err = new Error('Action introuvable');
    err.code = 'P2025';
    throw err;
  }
  return id;
}

/**
 * @param {string | null | undefined} tenantId
 * @param {unknown} riskId
 * @returns {Promise<string|null>}
 */
async function assertRiskExistsOrNull(tenantId, riskId) {
  if (riskId == null || riskId === '') return null;
  const id = String(riskId).trim();
  if (!id) return null;
  const tf = prismaTenantFilter(tenantId);
  const row = await prisma.risk.findFirst({
    where: { id, ...tf },
    select: { id: true }
  });
  if (!row) {
    const err = new Error('Risque introuvable');
    err.statusCode = 404;
    throw err;
  }
  return id;
}

/**
 * @param {string | null | undefined} tenantId
 * @param {{ assigneeId?: string|null, unassigned?: boolean, siteId?: string|null, limit?: number }} [filters]
 */
export async function findAllActions(tenantId, filters = {}) {
  const unassigned = Boolean(filters.unassigned);
  const assigneeId = normalizeAssigneeIdInput(filters.assigneeId);
  const siteId =
    filters.siteId != null && String(filters.siteId).trim() !== ''
      ? String(filters.siteId).trim()
      : null;
  const limit =
    typeof filters.limit === 'number' &&
    Number.isFinite(filters.limit) &&
    filters.limit >= 1
      ? Math.min(Math.floor(filters.limit), 500)
      : 300;

  const tf = prismaTenantFilter(tenantId);
  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  if (siteId) where.siteId = siteId;
  if (unassigned) {
    where.assigneeId = null;
  } else if (assigneeId) {
    where.assigneeId = assigneeId;
  }

  return prisma.action.findMany({
    where,
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      assignee: { select: assigneeSelect },
      incident: { select: { id: true, ref: true } },
      risk: { select: { id: true, ref: true, title: true } }
    }
  });
}

/**
 * Actions en retard (même règle que le dashboard ; `Date.now()` peut être mockée en test).
 * @param {string | null | undefined} tenantId
 * @param {{ assigneeId?: string|null, unassigned?: boolean, siteId?: string|null, limit?: number }} [filters]
 */
export async function findOverdueActions(tenantId, filters = {}) {
  const cap =
    typeof filters.limit === 'number' &&
    Number.isFinite(filters.limit) &&
    filters.limit >= 1
      ? Math.min(Math.floor(filters.limit), 500)
      : 500;
  const rows = await findAllActions(tenantId, { ...filters, limit: cap });
  return rows.filter(isActionOverdueDashboardRow);
}

export async function createAction(tenantId, data) {
  const t = normalizeTenantId(tenantId);
  if (!t) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  let assigneeId = null;
  let owner =
    typeof data.owner === 'string' ? data.owner.trim() : data.owner ?? null;

  const rawAssignee = normalizeAssigneeIdInput(data.assigneeId);
  if (rawAssignee) {
    const user = await assertAssigneeExistsInTenant(tenantId, rawAssignee);
    assigneeId = user.id;
    owner = owner && owner !== '' ? owner : user.name;
  }

  const siteId = await assertSiteExistsOrNull(tenantId, data.siteId);
  const riskId = await assertRiskExistsOrNull(tenantId, data.riskId);

  /** @type {Record<string, unknown>} */
  const createData = {
    tenantId: t,
    title: data.title,
    detail: data.detail ?? '',
    status: data.status,
    owner: owner ?? undefined,
    dueDate: data.dueDate ?? null,
    assigneeId,
    siteId,
    ...(riskId ? { riskId } : {})
  };
  if (data.incidentId != null && String(data.incidentId).trim() !== '') {
    createData.incidentId = await assertIncidentExistsOrNull(tenantId, data.incidentId);
  }
  if (data.auditId != null && String(data.auditId).trim() !== '') {
    // auditId existant : accepté sans validation forte (module audits gère déjà ses liens),
    // mais on le normalise.
    createData.auditId = String(data.auditId).trim();
  }

  return prisma.action.create({
    data: createData,
    include: {
      assignee: { select: assigneeSelect },
      incident: { select: { id: true, ref: true } },
      risk: { select: { id: true, ref: true, title: true } }
    }
  });
}

export async function updateActionFields(tenantId, actionId, data) {
  await assertActionInTenant(tenantId, actionId);
  const id = typeof actionId === 'string' ? actionId.trim() : '';
  const patch = {};
  if (data.status != null && String(data.status).trim() !== '') {
    patch.status = String(data.status).trim();
  }
  if ('riskId' in data) {
    patch.riskId = await assertRiskExistsOrNull(tenantId, data.riskId);
  }
  if (Object.keys(patch).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const upd = await prisma.action.updateMany({ where: { id, ...tf }, data: patch });
  if (!upd?.count) {
    const err = new Error('Action introuvable');
    err.code = 'P2025';
    throw err;
  }
  return prisma.action.findFirst({
    where: { id, ...tf },
    include: {
      assignee: { select: assigneeSelect },
      incident: { select: { id: true, ref: true } },
      risk: { select: { id: true, ref: true, title: true } }
    }
  });
}

export async function assignAction(tenantId, actionId, assigneeId) {
  await assertActionInTenant(tenantId, actionId);
  const tf = prismaTenantFilter(tenantId);
  const targetAssigneeId = normalizeAssigneeIdInput(assigneeId);
  if (targetAssigneeId) {
    const user = await assertAssigneeExistsInTenant(tenantId, targetAssigneeId);
    const upd = await prisma.action.updateMany({
      where: { id: actionId, ...tf },
      data: {
        assigneeId: user.id,
        owner: user.name
      }
    });
    if (!upd?.count) {
      const err = new Error('Action introuvable');
      err.code = 'P2025';
      throw err;
    }
    return prisma.action.findFirst({
      where: { id: actionId, ...tf },
      include: {
        assignee: { select: assigneeSelect },
        incident: { select: { id: true, ref: true } }
      }
    });
  }

  const upd = await prisma.action.updateMany({
    where: { id: actionId, ...tf },
    data: {
      assigneeId: null,
      owner: 'À assigner'
    }
  });
  if (!upd?.count) {
    const err = new Error('Action introuvable');
    err.code = 'P2025';
    throw err;
  }
  return prisma.action.findFirst({
    where: { id: actionId, ...tf },
    include: {
      assignee: { select: assigneeSelect },
      incident: { select: { id: true, ref: true } }
    }
  });
}
