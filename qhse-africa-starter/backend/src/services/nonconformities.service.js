import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

/**
 * @param {string | null | undefined} tenantId
 * @param {{ siteId?: string | null, limit?: number }} [filters]
 */
export async function findAllNonConformities(tenantId, filters = {}) {
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
  return prisma.nonConformity.findMany({
    where: { ...tf, ...(siteId ? { siteId } : {}) },
    orderBy: { createdAt: 'desc' },
    take
  });
}

/**
 * @param {string | null | undefined} tenantId
 */
export async function createNonConformityWithAction(
  tenantId,
  { title, detail, auditRef, siteId: inputSiteId }
) {
  const t = normalizeTenantId(tenantId);
  const actionTitle = `NC audit ${auditRef} — ${title}`;
  const safeTitle =
    actionTitle.length > 220 ? `${actionTitle.slice(0, 217)}...` : actionTitle;
  const tf = prismaTenantFilter(tenantId);

  return prisma.$transaction(async (tx) => {
    let siteId = await assertSiteExistsOrNull(tenantId, inputSiteId);

    let auditRow = await tx.audit.findFirst({
      where: { ref: auditRef, ...tf },
      select: { id: true, siteId: true }
    });

    if (!siteId) {
      siteId = auditRow?.siteId ?? null;
    }

    const nonConformity = await tx.nonConformity.create({
      data: {
        tenantId: t || null,
        title,
        detail: detail ?? null,
        status: 'open',
        auditRef,
        auditId: auditRow?.id ?? null,
        siteId
      }
    });

    const action = await tx.action.create({
      data: {
        tenantId: t || null,
        title: safeTitle,
        detail: `NC issue audit ${auditRef} • ${title}`,
        status: 'À lancer',
        owner: 'À assigner',
        assigneeId: null,
        dueDate: null,
        siteId
      }
    });

    return { nonConformity, action };
  });
}
