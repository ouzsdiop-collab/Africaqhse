import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { assertIncidentExistsOrNull } from './incidents.service.js';

const assigneeSelect = {
  id: true,
  name: true,
  email: true,
  role: true
};

/** Normalise l’entrée API (string, nombre isolé, null) vers un id Prisma ou null. */
function normalizeAssigneeIdInput(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  return s === '' ? null : s;
}

/**
 * Liste des actions. Sans filtre : comportement historique (toutes les actions).
 * @param {{ assigneeId?: string|null, unassigned?: boolean, siteId?: string|null, limit?: number }} [filters]
 */
export async function findAllActions(filters = {}) {
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

  /** @type {{ where?: Record<string, unknown>, take: number }} */
  const query = {
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      assignee: { select: assigneeSelect },
      incident: { select: { id: true, ref: true } }
    }
  };

  const where = {};
  if (siteId) where.siteId = siteId;
  if (unassigned) {
    where.assigneeId = null;
  } else if (assigneeId) {
    where.assigneeId = assigneeId;
  }
  if (Object.keys(where).length) query.where = where;

  return prisma.action.findMany(query);
}

export async function createAction(data) {
  let assigneeId = null;
  let owner =
    typeof data.owner === 'string' ? data.owner.trim() : data.owner ?? null;

  const rawAssignee = normalizeAssigneeIdInput(data.assigneeId);
  if (rawAssignee) {
    const user = await prisma.user.findUnique({ where: { id: rawAssignee } });
    if (!user) {
      const err = new Error('Utilisateur assigné introuvable');
      err.statusCode = 400;
      throw err;
    }
    assigneeId = user.id;
    owner = (owner && owner !== '') ? owner : user.name;
  }

  const siteId = await assertSiteExistsOrNull(data.siteId);

  return prisma.action.create({
    data: {
      title: data.title,
      detail: data.detail ?? '',
      status: data.status,
      owner: owner ?? undefined,
      dueDate: data.dueDate ?? null,
      assigneeId,
      siteId
    },
    include: {
      assignee: { select: assigneeSelect },
      incident: { select: { id: true, ref: true } }
    }
  });
}

/**
 * @param {string} actionId
 * @param {string|null} assigneeId — null ou chaîne vide pour retirer l’assignation
 */
export async function assignAction(actionId, assigneeId) {
  const targetAssigneeId = normalizeAssigneeIdInput(assigneeId);
  if (targetAssigneeId) {
    const user = await prisma.user.findUnique({ where: { id: targetAssigneeId } });
    if (!user) {
      const err = new Error('Utilisateur introuvable');
      err.statusCode = 400;
      throw err;
    }
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
