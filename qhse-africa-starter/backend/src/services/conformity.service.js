import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

/**
 * @param {import('@prisma/client').ConformityStatus} row
 */
export function serializeConformityRow(row) {
  return {
    id: row.id,
    tenantId: row.tenantId,
    requirementId: row.requirementId,
    status: row.status,
    siteId: row.siteId,
    userId: row.userId,
    updatedAt: row.updatedAt.toISOString()
  };
}

/**
 * @param {string | null | undefined} tenantId
 */
export async function listConformityStatuses(tenantId) {
  const where = prismaTenantFilter(tenantId);
  const rows = await prisma.conformityStatus.findMany({
    where,
    orderBy: [{ requirementId: 'asc' }, { siteId: 'asc' }]
  });
  return rows.map(serializeConformityRow);
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} requirementId
 * @param {{ status: string, siteId?: string | null, userId?: string | null }} input
 */
export async function upsertConformityStatus(tenantId, requirementId, input) {
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const rid = String(requirementId ?? '').trim();
  if (!rid) {
    const err = new Error('Identifiant d’exigence requis');
    err.statusCode = 400;
    throw err;
  }
  const st = String(input.status ?? '').trim();
  if (!st) {
    const err = new Error('Statut requis');
    err.statusCode = 400;
    throw err;
  }
  const sid =
    input.siteId != null && String(input.siteId).trim() !== ''
      ? String(input.siteId).trim()
      : null;
  const uid =
    input.userId != null && String(input.userId).trim() !== ''
      ? String(input.userId).trim()
      : null;

  const row = await prisma.conformityStatus.upsert({
    where: {
      tenantId_requirementId_siteId: {
        tenantId: tid,
        requirementId: rid,
        siteId: sid
      }
    },
    create: {
      tenantId: tid,
      requirementId: rid,
      siteId: sid,
      status: st,
      userId: uid
    },
    update: {
      status: st,
      userId: uid
    }
  });
  return serializeConformityRow(row);
}
