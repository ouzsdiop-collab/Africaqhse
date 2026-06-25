import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';
import { parseListLimit } from '../lib/validation.js';

const NEAR_MISS_STATUSES = ['open', 'under_review', 'closed'];

const nearMissInclude = {
  siteRecord: { select: { id: true, name: true, code: true } }
};

function serializeRow(row) {
  if (!row) return row;
  return {
    ...row,
    occurredAt: row.occurredAt.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

/**
 * @param {string | null | undefined} tenantId
 * @param {{ siteId?: string | null, status?: string | null, from?: string | null, to?: string | null }} [filters]
 */
export async function findAllNearMisses(tenantId, filters = {}) {
  const tf = prismaTenantFilter(tenantId);
  const siteId =
    filters.siteId != null && String(filters.siteId).trim() !== '' ? String(filters.siteId).trim() : null;
  const status =
    filters.status != null && NEAR_MISS_STATUSES.includes(String(filters.status)) ? String(filters.status) : null;
  const from = filters.from ? new Date(String(filters.from)) : null;
  const to = filters.to ? new Date(String(filters.to)) : null;

  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  if (siteId) where.siteId = siteId;
  if (status) where.status = status;
  if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
    where.occurredAt = {
      ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
      ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {})
    };
  }

  const rows = await prisma.nearMiss.findMany({
    where,
    include: nearMissInclude,
    orderBy: [{ occurredAt: 'desc' }, { createdAt: 'desc' }],
    take: parseListLimit(filters.limit)
  });
  return rows.map(serializeRow);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {Record<string, unknown>} data
 */
export async function createNearMiss(tenantId, data) {
  const tid = normalizeTenantId(tenantId);
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) {
    const err = new Error('title requis');
    err.statusCode = 400;
    throw err;
  }
  const occurredAt = data.occurredAt != null && data.occurredAt !== '' ? new Date(String(data.occurredAt)) : null;
  if (!occurredAt || Number.isNaN(occurredAt.getTime())) {
    const err = new Error('occurredAt invalide');
    err.statusCode = 400;
    throw err;
  }
  const status =
    data.status != null && NEAR_MISS_STATUSES.includes(String(data.status)) ? String(data.status) : 'open';
  const siteId =
    data.siteId != null && data.siteId !== ''
      ? await assertSiteExistsOrNull(tenantId, data.siteId)
      : null;
  const description = data.description == null || data.description === '' ? null : String(data.description);
  const category =
    data.category == null || data.category === '' ? null : String(data.category).trim() || null;
  const location = data.location == null || data.location === '' ? null : String(data.location).trim() || null;
  const immediateActions =
    data.immediateActions == null || data.immediateActions === '' ? null : String(data.immediateActions);
  const lessonsLearned =
    data.lessonsLearned == null || data.lessonsLearned === '' ? null : String(data.lessonsLearned);

  const created = await prisma.nearMiss.create({
    data: {
      tenantId: tid,
      siteId,
      title,
      description,
      category,
      occurredAt,
      location,
      immediateActions,
      lessonsLearned,
      status
    },
    include: nearMissInclude
  });
  return serializeRow(created);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 * @param {Record<string, unknown>} patch
 */
export async function updateNearMiss(tenantId, id, patch) {
  const rid = String(id ?? '').trim();
  if (!rid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.nearMiss.findFirst({ where: { id: rid, ...tf } });
  if (!existing) {
    const err = new Error('Presque-accident introuvable');
    err.statusCode = 404;
    throw err;
  }

  /** @type {Record<string, unknown>} */
  const data = {};
  if ('title' in patch) {
    const t = typeof patch.title === 'string' ? patch.title.trim() : '';
    if (!t) {
      const err = new Error('title ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    data.title = t;
  }
  if ('description' in patch) {
    data.description = patch.description == null || patch.description === '' ? null : String(patch.description);
  }
  if ('category' in patch) {
    data.category = patch.category == null || patch.category === '' ? null : String(patch.category).trim() || null;
  }
  if ('occurredAt' in patch) {
    const d = new Date(String(patch.occurredAt));
    if (Number.isNaN(d.getTime())) {
      const err = new Error('occurredAt invalide');
      err.statusCode = 400;
      throw err;
    }
    data.occurredAt = d;
  }
  if ('location' in patch) {
    data.location = patch.location == null || patch.location === '' ? null : String(patch.location).trim() || null;
  }
  if ('immediateActions' in patch) {
    data.immediateActions =
      patch.immediateActions == null || patch.immediateActions === '' ? null : String(patch.immediateActions);
  }
  if ('lessonsLearned' in patch) {
    data.lessonsLearned =
      patch.lessonsLearned == null || patch.lessonsLearned === '' ? null : String(patch.lessonsLearned);
  }
  if ('status' in patch) {
    const s = typeof patch.status === 'string' ? patch.status.trim() : '';
    if (!NEAR_MISS_STATUSES.includes(s)) {
      const err = new Error('status invalide (open|under_review|closed)');
      err.statusCode = 400;
      throw err;
    }
    data.status = s;
  }
  if ('siteId' in patch) {
    data.siteId =
      patch.siteId == null || patch.siteId === ''
        ? null
        : await assertSiteExistsOrNull(tenantId, patch.siteId);
  }

  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }

  const upd = await prisma.nearMiss.updateMany({ where: { id: rid, ...tf }, data });
  if (!upd?.count) {
    const err = new Error('Presque-accident introuvable');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.nearMiss.findFirst({
    where: { id: rid, ...tf },
    include: nearMissInclude
  });
  return serializeRow(updated);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 */
export async function deleteNearMiss(tenantId, id) {
  const rid = String(id ?? '').trim();
  if (!rid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.nearMiss.findFirst({ where: { id: rid, ...tf } });
  if (!existing) {
    const err = new Error('Presque-accident introuvable');
    err.statusCode = 404;
    throw err;
  }
  const del = await prisma.nearMiss.deleteMany({ where: { id: rid, ...tf } });
  if (!del?.count) {
    const err = new Error('Presque-accident introuvable');
    err.statusCode = 404;
    throw err;
  }
}
