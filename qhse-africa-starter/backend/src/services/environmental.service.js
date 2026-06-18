import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

const ENVIRONMENTAL_TYPES = ['waste', 'water', 'energy'];

const environmentalInclude = {
  siteRecord: { select: { id: true, name: true, code: true } }
};

function serializeRow(row) {
  if (!row) return row;
  return {
    ...row,
    periodDate: row.periodDate.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

/**
 * @param {string | null | undefined} tenantId
 * @param {{ siteId?: string | null, type?: string | null, from?: string | null, to?: string | null }} [filters]
 */
export async function findAllEnvironmentalRecords(tenantId, filters = {}) {
  const tf = prismaTenantFilter(tenantId);
  const siteId =
    filters.siteId != null && String(filters.siteId).trim() !== '' ? String(filters.siteId).trim() : null;
  const type =
    filters.type != null && ENVIRONMENTAL_TYPES.includes(String(filters.type)) ? String(filters.type) : null;
  const from = filters.from ? new Date(String(filters.from)) : null;
  const to = filters.to ? new Date(String(filters.to)) : null;

  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  if (siteId) where.siteId = siteId;
  if (type) where.type = type;
  if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
    where.periodDate = {
      ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
      ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {})
    };
  }

  const rows = await prisma.environmentalRecord.findMany({
    where,
    include: environmentalInclude,
    orderBy: [{ periodDate: 'desc' }, { createdAt: 'desc' }]
  });
  return rows.map(serializeRow);
}

/**
 * Synthèse par type (totaux de quantité), sur une période optionnelle.
 *
 * @param {string | null | undefined} tenantId
 * @param {{ siteId?: string | null, from?: string | null, to?: string | null }} [filters]
 */
export async function getEnvironmentalSummary(tenantId, filters = {}) {
  const tf = prismaTenantFilter(tenantId);
  const siteId =
    filters.siteId != null && String(filters.siteId).trim() !== '' ? String(filters.siteId).trim() : null;
  const from = filters.from ? new Date(String(filters.from)) : null;
  const to = filters.to ? new Date(String(filters.to)) : null;

  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  if (siteId) where.siteId = siteId;
  if ((from && !Number.isNaN(from.getTime())) || (to && !Number.isNaN(to.getTime()))) {
    where.periodDate = {
      ...(from && !Number.isNaN(from.getTime()) ? { gte: from } : {}),
      ...(to && !Number.isNaN(to.getTime()) ? { lte: to } : {})
    };
  }

  const grouped = await prisma.environmentalRecord.groupBy({
    by: ['type', 'unit'],
    where,
    _sum: { quantity: true },
    _count: { _all: true }
  });

  return grouped.map((g) => ({
    type: g.type,
    unit: g.unit,
    totalQuantity: g._sum.quantity ?? 0,
    recordCount: g._count._all
  }));
}

/**
 * @param {string | null | undefined} tenantId
 * @param {Record<string, unknown>} data
 */
export async function createEnvironmentalRecord(tenantId, data) {
  const tid = normalizeTenantId(tenantId);
  const type = typeof data.type === 'string' ? data.type.trim() : '';
  if (!ENVIRONMENTAL_TYPES.includes(type)) {
    const err = new Error('type invalide (waste|water|energy)');
    err.statusCode = 400;
    throw err;
  }
  const quantity = Number(data.quantity);
  if (!Number.isFinite(quantity)) {
    const err = new Error('quantity invalide');
    err.statusCode = 400;
    throw err;
  }
  const unit = typeof data.unit === 'string' ? data.unit.trim() : '';
  if (!unit) {
    const err = new Error('unit requis');
    err.statusCode = 400;
    throw err;
  }
  const periodDate = data.periodDate != null && data.periodDate !== '' ? new Date(String(data.periodDate)) : null;
  if (!periodDate || Number.isNaN(periodDate.getTime())) {
    const err = new Error('periodDate invalide');
    err.statusCode = 400;
    throw err;
  }
  const siteId =
    data.siteId != null && data.siteId !== ''
      ? await assertSiteExistsOrNull(tenantId, data.siteId)
      : null;
  const category =
    data.category == null || data.category === '' ? null : String(data.category).trim() || null;
  const notes = data.notes == null || data.notes === '' ? null : String(data.notes);

  const created = await prisma.environmentalRecord.create({
    data: {
      tenantId: tid,
      siteId,
      type,
      category,
      quantity,
      unit,
      periodDate,
      notes
    },
    include: environmentalInclude
  });
  return serializeRow(created);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 * @param {Record<string, unknown>} patch
 */
export async function updateEnvironmentalRecord(tenantId, id, patch) {
  const rid = String(id ?? '').trim();
  if (!rid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.environmentalRecord.findFirst({ where: { id: rid, ...tf } });
  if (!existing) {
    const err = new Error('Relevé introuvable');
    err.statusCode = 404;
    throw err;
  }

  /** @type {Record<string, unknown>} */
  const data = {};
  if ('type' in patch) {
    const t = typeof patch.type === 'string' ? patch.type.trim() : '';
    if (!ENVIRONMENTAL_TYPES.includes(t)) {
      const err = new Error('type invalide (waste|water|energy)');
      err.statusCode = 400;
      throw err;
    }
    data.type = t;
  }
  if ('category' in patch) {
    data.category = patch.category == null || patch.category === '' ? null : String(patch.category).trim() || null;
  }
  if ('quantity' in patch) {
    const q = Number(patch.quantity);
    if (!Number.isFinite(q)) {
      const err = new Error('quantity invalide');
      err.statusCode = 400;
      throw err;
    }
    data.quantity = q;
  }
  if ('unit' in patch) {
    const u = typeof patch.unit === 'string' ? patch.unit.trim() : '';
    if (!u) {
      const err = new Error('unit ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    data.unit = u;
  }
  if ('periodDate' in patch) {
    const d = new Date(String(patch.periodDate));
    if (Number.isNaN(d.getTime())) {
      const err = new Error('periodDate invalide');
      err.statusCode = 400;
      throw err;
    }
    data.periodDate = d;
  }
  if ('siteId' in patch) {
    data.siteId =
      patch.siteId == null || patch.siteId === ''
        ? null
        : await assertSiteExistsOrNull(tenantId, patch.siteId);
  }
  if ('notes' in patch) {
    data.notes = patch.notes == null || patch.notes === '' ? null : String(patch.notes);
  }

  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }

  const upd = await prisma.environmentalRecord.updateMany({ where: { id: rid, ...tf }, data });
  if (!upd?.count) {
    const err = new Error('Relevé introuvable');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.environmentalRecord.findFirst({
    where: { id: rid, ...tf },
    include: environmentalInclude
  });
  return serializeRow(updated);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 */
export async function deleteEnvironmentalRecord(tenantId, id) {
  const rid = String(id ?? '').trim();
  if (!rid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.environmentalRecord.findFirst({ where: { id: rid, ...tf } });
  if (!existing) {
    const err = new Error('Relevé introuvable');
    err.statusCode = 404;
    throw err;
  }
  const del = await prisma.environmentalRecord.deleteMany({ where: { id: rid, ...tf } });
  if (!del?.count) {
    const err = new Error('Relevé introuvable');
    err.statusCode = 404;
    throw err;
  }
}
