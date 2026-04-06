import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';

/**
 * @param {{ siteId?: string | null, limit?: number }} [filters]
 */
export async function findAllAudits(filters = {}) {
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
    where: siteId ? { siteId } : undefined,
    orderBy: { createdAt: 'desc' },
    take
  });
}

export async function createAudit(data) {
  const siteId = await assertSiteExistsOrNull(data.siteId);
  const scoreNum = Number(data.score);
  const row = {
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
