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
      status: data.status ?? 'Nouveau'
    }
  });
}

/**
 * @param {string} ref
 * @param {{ status: string }} data
 */
export async function updateIncidentByRef(ref, data) {
  return prisma.incident.update({
    where: { ref },
    data: { status: data.status }
  });
}
