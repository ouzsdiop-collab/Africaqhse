import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

/**
 * @param {string | null | undefined} tenantId
 * @param {{ siteId?: string | null, limit?: number }} [filters]
 */
export async function findAllAudits(tenantId, filters = {}) {
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
  const tf = prismaTenantFilter(tenantId);
  return prisma.audit.findMany({
    where: { ...tf, ...(siteId ? { siteId } : {}) },
    orderBy: { createdAt: 'desc' },
    take
  });
}

export async function createAudit(tenantId, data) {
  const t = normalizeTenantId(tenantId);
  const siteId = await assertSiteExistsOrNull(tenantId, data.siteId);
  const scoreNum = Number(data.score);
  const row = {
    tenantId: t || null,
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
