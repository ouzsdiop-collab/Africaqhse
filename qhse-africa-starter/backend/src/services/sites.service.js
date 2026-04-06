import { prisma } from '../db.js';

const publicSelect = {
  id: true,
  name: true,
  code: true,
  address: true,
  createdAt: true
};

export async function findAllSites() {
  return prisma.site.findMany({
    orderBy: [{ name: 'asc' }],
    select: publicSelect,
    take: 200
  });
}

export async function findSiteById(id) {
  if (!id || typeof id !== 'string') return null;
  return prisma.site.findUnique({
    where: { id: id.trim() },
    select: publicSelect
  });
}

/**
 * @param {{ name: string, code?: string|null, address?: string|null }} data
 */
/**
 * Valide un id de site pour liaison optionnelle (create / update).
 * @param {unknown} siteId
 * @returns {Promise<string|null>}
 */
export async function assertSiteExistsOrNull(siteId) {
  if (siteId === undefined || siteId === null || siteId === '') return null;
  const id = String(siteId).trim();
  if (!id) return null;
  const row = await prisma.site.findUnique({
    where: { id },
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
 * Listes / stats avec ?siteId= : si l’identifiant n’existe pas en base (ex. seed régénéré,
 * session périmètre obsolète), ignorer le filtre plutôt que renvoyer des totaux à zéro.
 * @param {string | null | undefined} siteId
 * @returns {Promise<string | null>}
 */
export async function coalesceQuerySiteIdForList(siteId) {
  if (siteId == null) return null;
  const id = String(siteId).trim();
  if (!id) return null;
  const row = await prisma.site.findUnique({
    where: { id },
    select: { id: true }
  });
  if (row) return id;
  console.warn(
    '[qhse-api] siteId de requête absent de la base — filtre ignoré (vue groupe). id=%s',
    id
  );
  return null;
}

export async function createSite(data) {
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
      name,
      code,
      address
    },
    select: publicSelect
  });
}
