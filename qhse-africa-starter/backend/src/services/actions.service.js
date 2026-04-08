import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { assertIncidentExistsOrNull } from './incidents.service.js';

const assigneeSelect = {
  id: true,
  name: true,
  email: true,
  role: true
};

function tid(tenantId) {
  return tenantId == null || tenantId === '' ? '' : String(tenantId).trim();
}

function normalizeAssigneeIdInput(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

/**
 * Vérifie qu’un utilisateur est bien membre du tenant (assignation d’actions).
 * @param {string | null | undefined} tenantId
 * @param {string | null | undefined} userId
 */
async function assertAssigneeMemberOfTenant(tenantId, userId) {
  const t = tid(tenantId);
  const uid = normalizeAssigneeIdInput(userId);
  if (!t || !uid) {
    const err = new Error('Utilisateur assigné introuvable');
    err.statusCode = 400;
    throw err;
  }
  const m = await prisma.userTenant.findFirst({
    where: { tenantId: t, userId: uid },
    include: { user: { select: { id: true, name: true, email: true, role: true } } }
  });
  if (!m?.user) {
    const err = new Error(
      'Utilisateur assigné introuvable ou non membre de cette organisation'
    );
    err.statusCode = 400;
    throw err;
  }
  return m.user;
}

async function assertActionInTenant(tenantId, actionId) {
  const t = tid(tenantId);
  const id = typeof actionId === 'string' ? actionId.trim() : '';
  if (!t || !id) {
    const err = new Error('Action introuvable');
    err.code = 'P2025';
    throw err;
  }
  const row = await prisma.action.findFirst({
    where: { id, tenantId: t },
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
 * @param {{ assigneeId?: string|null, unassigned?: boolean, siteId?: string|null, limit?: number }} [filters]
 */
export async function findAllActions(tenantId, filters = {}) {
  const t = tid(tenantId);
  if (!t) return [];
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

  const where = { tenantId: t };
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
      incident: { select: { id: true, ref: true } }
    }
  });
}

export async function createAction(tenantId, data) {
  const t = tid(tenantId);
  if (!t) {
    const err = new Error('Contexte organisation manquant');
    err.statusCode = 400;
    throw err;
  }
  let assigneeId = null;
  let owner =
    typeof data.owner === 'string' ? data.owner.trim() : data.owner ?? null;

  const rawAssignee = normalizeAssigneeIdInput(data.assigneeId);
  if (rawAssignee) {
    const user = await assertAssigneeMemberOfTenant(t, rawAssignee);
    assigneeId = user.id;
    owner = owner && owner !== '' ? owner : user.name;
  }

  const siteId = await assertSiteExistsOrNull(t, data.siteId);

  /** @type {Record<string, unknown>} */
  const createData = {
    tenantId: t,
    title: data.title,
    detail: data.detail ?? '',
    status: data.status,
    owner: owner ?? undefined,
    dueDate: data.dueDate ?? null,
    assigneeId,
    siteId
  };
  if (data.incidentId != null && String(data.incidentId).trim() !== '') {
    createData.incidentId = await assertIncidentExistsOrNull(t, data.incidentId);
  }

  return prisma.action.create({
    data: createData,
    include: {
      assignee: { select: assigneeSelect },
      incident: { select: { id: true, ref: true } }
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
  if (Object.keys(patch).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }
  return prisma.action.update({
    where: { id },
    data: patch,
    include: {
      assignee: { select: assigneeSelect },
      incident: { select: { id: true, ref: true } }
    }
  });
}

export async function assignAction(tenantId, actionId, assigneeId) {
  await assertActionInTenant(tenantId, actionId);
  const targetAssigneeId = normalizeAssigneeIdInput(assigneeId);
  if (targetAssigneeId) {
    const t = tid(tenantId);
    const user = await assertAssigneeMemberOfTenant(t, targetAssigneeId);
    return prisma.action.update({
      where: { id: actionId },
      data: {
        assigneeId: user.id,
        owner: user.name
      },
      include: {
        assignee: { select: assigneeSelect },
        incident: { select: { id: true, ref: true } }
      }
    });
  }

  return prisma.action.update({
    where: { id: actionId },
    data: {
      assigneeId: null,
      owner: 'À assigner'
    },
    include: {
      assignee: { select: assigneeSelect },
      incident: { select: { id: true, ref: true } }
    }
  });
}
