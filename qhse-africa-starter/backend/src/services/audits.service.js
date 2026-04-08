import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';

function tid(tenantId) {
  return tenantId == null || tenantId === '' ? '' : String(tenantId).trim();
}

/**
 * @param {string | null | undefined} tenantId
 * @param {{ siteId?: string | null, limit?: number }} [filters]
 */
export async function findAllAudits(tenantId, filters = {}) {
  const t = tid(tenantId);
  if (!t) return [];
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
  return prisma.audit.findMany({
    where: { tenantId: t, ...(siteId ? { siteId } : {}) },
    orderBy: { createdAt: 'desc' },
    take
  });
}

export async function createAudit(tenantId, data) {
  const t = tid(tenantId);
  if (!t) {
    const err = new Error('Contexte organisation manquant');
    err.statusCode = 400;
    throw err;
  }
  const siteId = await assertSiteExistsOrNull(t, data.siteId);
  const scoreNum = Number(data.score);
  const row = {
    tenantId: t,
    ref: data.ref,
    site: data.site,
    siteId,
    score: scoreNum,
    status: data.status
  };
  if (data.checklist !== undefined && data.checklist !== null) {
    row.checklist = data.checklist;
  }
  return prisma.audit.create({ data: row });
}
