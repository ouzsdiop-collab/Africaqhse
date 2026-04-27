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
  if (!t) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const siteId = await assertSiteExistsOrNull(tenantId, data.siteId);
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

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 * @param {unknown} score
 */
export async function updateAuditScore(tenantId, id, score) {
  const tf = prismaTenantFilter(tenantId);
  const auditId = String(id ?? '').trim();
  if (!auditId) {
    const err = new Error('Audit introuvable');
    err.code = 'P2025';
    throw err;
  }
  const scoreNum = Number(score);
  if (!Number.isFinite(scoreNum)) {
    const err = new Error('Score invalide');
    err.statusCode = 400;
    throw err;
  }
  const existing = await prisma.audit.findFirst({
    where: { id: auditId, ...tf },
    select: { id: true }
  });
  if (!existing) {
    const err = new Error('Audit introuvable');
    err.code = 'P2025';
    throw err;
  }
  const upd = await prisma.audit.updateMany({
    where: { id: auditId, ...tf },
    data: { score: Math.round(scoreNum) }
  });
  if (!upd?.count) {
    const err = new Error('Audit introuvable');
    err.code = 'P2025';
    throw err;
  }
  return prisma.audit.findFirst({ where: { id: auditId, ...tf } });
}
