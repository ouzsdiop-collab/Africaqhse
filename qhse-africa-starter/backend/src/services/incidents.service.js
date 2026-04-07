import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';

/**
 * @param {string | null | undefined} incidentId
 * @returns {Promise<string | null>}
 */
export async function assertIncidentExistsOrNull(incidentId) {
  if (incidentId == null || String(incidentId).trim() === '') {
    return null;
  }
  const id = String(incidentId).trim();
  const row = await prisma.incident.findUnique({ where: { id }, select: { id: true } });
  if (!row) {
    const err = new Error('Incident lié introuvable');
    err.statusCode = 400;
    throw err;
  }
  return id;
}

/**
 * Référence suivante alignée sur la logique front (INC-xxx).
 */
export async function computeNextIncidentRef() {
  const rows = await prisma.incident.findMany({
    select: { ref: true },
    orderBy: { createdAt: 'desc' },
    take: 3000
  });
  const nums = rows.map((r) => {
    const m = /^INC-(\d+)$/i.exec(r.ref);
    return m ? parseInt(m[1], 10) : 0;
  });
  const max = nums.length ? Math.max(...nums) : 200;
  return `INC-${max + 1}`;
}

/**
 * @param {{ siteId?: string | null, limit?: number }} [filters]
 */
export async function findAllIncidents(filters = {}) {
  const siteId =
    filters.siteId != null && String(filters.siteId).trim() !== ''
      ? String(filters.siteId).trim()
      : null;
  const raw =
    typeof filters.limit === 'number' &&
    Number.isFinite(filters.limit) &&
    filters.limit >= 1
      ? Math.floor(filters.limit)
      : 300;
  const take = Math.min(raw, 500);
  return prisma.incident.findMany({
    where: siteId ? { siteId } : undefined,
    orderBy: { createdAt: 'desc' },
    take
  });
}

export async function createIncident(data) {
  const siteId = await assertSiteExistsOrNull(data.siteId);
  return prisma.incident.create({
    data: {
      ref: data.ref,
      type: data.type,
      site: data.site,
      siteId,
      severity: data.severity,
      description: data.description ?? null,
      status: data.status ?? 'Nouveau',
      location: data.location ?? null,
      causes: data.causes ?? null,
      causeCategory: data.causeCategory ?? null,
      photosJson: data.photosJson ?? null,
      responsible: data.responsible ?? null
    }
  });
}

const CAUSE_CATS = new Set(['humain', 'materiel', 'organisation', 'mixte']);

/**
 * @param {string} ref
 * @param {{
 *   status?: string,
 *   causes?: string | null,
 *   causeCategory?: string | null,
 *   location?: string | null,
 *   responsible?: string | null,
 *   photosJson?: string | null
 * }} data
 */
export async function updateIncidentByRef(ref, data) {
  const patch = {};
  if (data.status != null && String(data.status).trim() !== '') {
    patch.status = data.status;
  }
  if ('causes' in data) {
    patch.causes = data.causes;
  }
  if ('causeCategory' in data) {
    const c = data.causeCategory;
    if (c == null || c === '') {
      patch.causeCategory = null;
    } else if (CAUSE_CATS.has(String(c).toLowerCase())) {
      patch.causeCategory = String(c).toLowerCase();
    } else {
      const err = new Error('causeCategory invalide (humain, materiel, organisation, mixte)');
      err.statusCode = 400;
      throw err;
    }
  }
  if ('location' in data) {
    patch.location = data.location;
  }
  if ('responsible' in data) {
    patch.responsible = data.responsible;
  }
  if ('photosJson' in data) {
    patch.photosJson = data.photosJson;
  }
  if (Object.keys(patch).length === 0) {
    const err = new Error('Aucun champ valide à mettre à jour');
    err.statusCode = 400;
    throw err;
  }
  return prisma.incident.update({
    where: { ref },
    data: patch
  });
}
