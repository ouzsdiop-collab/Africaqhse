import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

const habilitationInclude = {
  user: { select: { id: true, name: true, email: true, role: true } },
  siteRecord: { select: { id: true, name: true, code: true } }
};

function serializeRow(row) {
  if (!row) return row;
  return {
    ...row,
    validFrom: row.validFrom ? row.validFrom.toISOString() : null,
    validUntil: row.validUntil ? row.validUntil.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string | null | undefined} siteId
 */
export async function findAllHabilitations(tenantId, siteId = null) {
  const tf = prismaTenantFilter(tenantId);
  const sid = siteId != null && String(siteId).trim() !== '' ? String(siteId).trim() : null;
  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  if (sid) where.siteId = sid;
  const rows = await prisma.habilitation.findMany({
    where,
    include: habilitationInclude,
    orderBy: [{ validUntil: 'asc' }, { createdAt: 'desc' }]
  });
  return rows.map(serializeRow);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {number} daysAhead
 */
export async function getExpiringHabilitations(tenantId, daysAhead) {
  const d = Math.max(1, Math.min(365, Math.floor(Number(daysAhead) || 30)));
  const now = new Date();
  const end = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  const tf = prismaTenantFilter(tenantId);
  const rows = await prisma.habilitation.findMany({
    where: {
      ...tf,
      validUntil: { not: null, gte: now, lte: end }
    },
    include: habilitationInclude,
    orderBy: { validUntil: 'asc' }
  });
  return rows.map(serializeRow);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {Record<string, unknown>} data
 */
export async function createHabilitation(tenantId, data) {
  const tid = normalizeTenantId(tenantId);
  const userId = typeof data.userId === 'string' ? data.userId.trim() : '';
  if (!userId) {
    const err = new Error('userId requis');
    err.statusCode = 400;
    throw err;
  }
  const userOk = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userOk) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 400;
    throw err;
  }
  const type = typeof data.type === 'string' ? data.type.trim() : '';
  if (!type) {
    const err = new Error('type requis');
    err.statusCode = 400;
    throw err;
  }
  const siteId =
    data.siteId != null && data.siteId !== ''
      ? await assertSiteExistsOrNull(tenantId, data.siteId)
      : null;
  const level =
    data.level == null || data.level === '' ? null : String(data.level).trim() || null;
  const status =
    data.status != null && String(data.status).trim()
      ? String(data.status).trim()
      : 'active';
  const validFrom =
    data.validFrom != null && data.validFrom !== '' ? new Date(String(data.validFrom)) : null;
  const validUntil =
    data.validUntil != null && data.validUntil !== '' ? new Date(String(data.validUntil)) : null;
  if (validFrom && Number.isNaN(validFrom.getTime())) {
    const err = new Error('validFrom invalide');
    err.statusCode = 400;
    throw err;
  }
  if (validUntil && Number.isNaN(validUntil.getTime())) {
    const err = new Error('validUntil invalide');
    err.statusCode = 400;
    throw err;
  }

  const created = await prisma.habilitation.create({
    data: {
      tenantId: tid,
      userId,
      siteId,
      type,
      level,
      validFrom: validFrom && !Number.isNaN(validFrom.getTime()) ? validFrom : null,
      validUntil: validUntil && !Number.isNaN(validUntil.getTime()) ? validUntil : null,
      status
    },
    include: habilitationInclude
  });
  return serializeRow(created);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 * @param {Record<string, unknown>} patch
 */
export async function updateHabilitation(tenantId, id, patch) {
  const hid = String(id ?? '').trim();
  if (!hid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.habilitation.findFirst({
    where: { id: hid, ...tf }
  });
  if (!existing) {
    const err = new Error('Habilitation introuvable');
    err.statusCode = 404;
    throw err;
  }

  /** @type {Record<string, unknown>} */
  const data = {};
  if ('type' in patch) {
    const t = typeof patch.type === 'string' ? patch.type.trim() : '';
    if (!t) {
      const err = new Error('type ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    data.type = t;
  }
  if ('level' in patch) {
    data.level =
      patch.level == null || patch.level === ''
        ? null
        : String(patch.level).trim() || null;
  }
  if ('status' in patch && patch.status != null && String(patch.status).trim()) {
    data.status = String(patch.status).trim();
  }
  if ('validFrom' in patch) {
    if (patch.validFrom == null || patch.validFrom === '') data.validFrom = null;
    else {
      const d = new Date(String(patch.validFrom));
      if (Number.isNaN(d.getTime())) {
        const err = new Error('validFrom invalide');
        err.statusCode = 400;
        throw err;
      }
      data.validFrom = d;
    }
  }
  if ('validUntil' in patch) {
    if (patch.validUntil == null || patch.validUntil === '') data.validUntil = null;
    else {
      const d = new Date(String(patch.validUntil));
      if (Number.isNaN(d.getTime())) {
        const err = new Error('validUntil invalide');
        err.statusCode = 400;
        throw err;
      }
      data.validUntil = d;
    }
  }
  if ('siteId' in patch) {
    data.siteId =
      patch.siteId == null || patch.siteId === ''
        ? null
        : await assertSiteExistsOrNull(tenantId, patch.siteId);
  }
  if ('userId' in patch) {
    const uid = typeof patch.userId === 'string' ? patch.userId.trim() : '';
    if (!uid) {
      const err = new Error('userId invalide');
      err.statusCode = 400;
      throw err;
    }
    const userOk = await prisma.user.findUnique({ where: { id: uid }, select: { id: true } });
    if (!userOk) {
      const err = new Error('Utilisateur introuvable');
      err.statusCode = 400;
      throw err;
    }
    data.userId = uid;
  }

  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }

  const upd = await prisma.habilitation.updateMany({
    where: { id: hid, ...tf },
    data
  });
  if (!upd?.count) {
    const err = new Error('Habilitation introuvable');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.habilitation.findFirst({
    where: { id: hid, ...tf },
    include: habilitationInclude
  });
  return serializeRow(updated);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 */
export async function deleteHabilitation(tenantId, id) {
  const hid = String(id ?? '').trim();
  if (!hid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.habilitation.findFirst({
    where: { id: hid, ...tf }
  });
  if (!existing) {
    const err = new Error('Habilitation introuvable');
    err.statusCode = 404;
    throw err;
  }
  const del = await prisma.habilitation.deleteMany({ where: { id: hid, ...tf } });
  if (!del?.count) {
    const err = new Error('Habilitation introuvable');
    err.statusCode = 404;
    throw err;
  }
}
