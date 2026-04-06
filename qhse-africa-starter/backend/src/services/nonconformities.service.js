import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';

/**
 * @param {{ siteId?: string | null, limit?: number }} [filters]
 */
export async function findAllNonConformities(filters = {}) {
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
  return prisma.nonConformity.findMany({
    where: siteId ? { siteId } : undefined,
    orderBy: { createdAt: 'desc' },
    take
  });
}

/**
 * Crée une non-conformité et une action liée (plan d’actions) dans une transaction.
 * siteId optionnel : sinon hérité de l’audit lié (auditRef).
 */
export async function createNonConformityWithAction({
  title,
  detail,
  auditRef,
  siteId: inputSiteId
}) {
  const actionTitle = `NC audit ${auditRef} — ${title}`;
  const safeTitle =
    actionTitle.length > 220 ? `${actionTitle.slice(0, 217)}...` : actionTitle;

  return prisma.$transaction(async (tx) => {
    let siteId = await assertSiteExistsOrNull(inputSiteId);

    let auditRow = await tx.audit.findFirst({
      where: { ref: auditRef },
      select: { id: true, siteId: true }
    });

    if (!siteId) {
      siteId = auditRow?.siteId ?? null;
    }

    const nonConformity = await tx.nonConformity.create({
      data: {
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
