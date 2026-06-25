import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

const publicSelect = {
  id: true,
  name: true,
  code: true,
  address: true,
  createdAt: true,
  tenantId: true
};

export async function findAllSites(tenantId) {
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  return prisma.site.findMany({
    where: { tenantId: tid },
    orderBy: [{ name: 'asc' }],
    select: publicSelect,
    take: 200
  });
}

/**
 * @param {unknown} tenantId
 * @param {unknown} id
 */
export async function findSiteById(tenantId, id) {
  if (!id || typeof id !== 'string') return null;
  const tf = prismaTenantFilter(tenantId);
  return prisma.site.findFirst({
    where: { id: id.trim(), ...tf },
    select: publicSelect
  });
}

/**
 * @param {unknown} tenantId
 * @param {unknown} siteId
 * @returns {Promise<string|null>}
 */
export async function assertSiteExistsOrNull(tenantId, siteId) {
  if (siteId === undefined || siteId === null || siteId === '') return null;
  const id = String(siteId).trim();
  if (!id) return null;
  const tf = prismaTenantFilter(tenantId);
  const row = await prisma.site.findFirst({
    where: { id, ...tf },
    select: { id: true }
  });
  if (!row) {
    const err = new Error('Site inconnu ou invalide');
    err.statusCode = 400;
    throw err;
  }
  return id;
}

/**
 * @param {unknown} tenantId
 * @param {string | null | undefined} siteId
 * @returns {Promise<string | null>}
 */
export async function coalesceQuerySiteIdForList(tenantId, siteId) {
  if (siteId == null) return null;
  const id = String(siteId).trim();
  if (!id) return null;
  const tf = prismaTenantFilter(tenantId);
  const row = await prisma.site.findFirst({
    where: { id, ...tf },
    select: { id: true }
  });
  if (row) return id;
  console.warn(
    '[qhse-api] siteId de requête inconnu — filtre ignoré (vue groupe). id=%s',
    id
  );
  return null;
}

/**
 * @param {unknown} tenantId
 * @param {{ name: string, code?: string|null, address?: string|null }} data
 */
export async function createSite(tenantId, data) {
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!name) {
    const err = new Error('Le nom du site est requis');
    err.statusCode = 400;
    throw err;
  }
  const code =
    data.code == null || data.code === ''
      ? null
      : String(data.code).trim() || null;
  const address =
    data.address == null || data.address === ''
      ? null
      : String(data.address).trim() || null;

  return prisma.site.create({
    data: {
      tenantId: tid,
      name,
      code,
      address
    },
    select: publicSelect
  });
}

/**
 * @param {unknown} tenantId
 * @param {unknown} id
 * @param {{ name?: string, code?: string|null, address?: string|null }} patch
 */
export async function updateSite(tenantId, id, patch) {
  const sid = String(id ?? '').trim();
  if (!sid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.site.findFirst({ where: { id: sid, ...tf } });
  if (!existing) {
    const err = new Error('Site introuvable');
    err.statusCode = 404;
    throw err;
  }
  /** @type {Record<string, unknown>} */
  const data = {};
  if ('name' in patch) {
    const v = typeof patch.name === 'string' ? patch.name.trim() : '';
    if (!v) {
      const err = new Error('Le nom du site est requis');
      err.statusCode = 400;
      throw err;
    }
    data.name = v;
  }
  if ('code' in patch) {
    data.code = patch.code == null || patch.code === '' ? null : String(patch.code).trim() || null;
  }
  if ('address' in patch) {
    data.address = patch.address == null || patch.address === '' ? null : String(patch.address).trim() || null;
  }
  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }
  const upd = await prisma.site.updateMany({ where: { id: sid, ...tf }, data });
  if (!upd?.count) {
    const err = new Error('Site introuvable');
    err.statusCode = 404;
    throw err;
  }
  return prisma.site.findFirst({ where: { id: sid, ...tf }, select: publicSelect });
}

/**
 * @param {unknown} tenantId
 * @param {unknown} id
 */
export async function deleteSite(tenantId, id) {
  const sid = String(id ?? '').trim();
  if (!sid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const del = await prisma.site.deleteMany({ where: { id: sid, ...tf } });
  if (!del?.count) {
    const err = new Error('Site introuvable');
    err.statusCode = 404;
    throw err;
  }
}
