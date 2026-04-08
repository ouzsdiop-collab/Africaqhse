import { prisma } from '../db.js';

/**
 * Écrit une entrée de journal serveur (ne bloque pas la requête en cas d’échec disque).
 *
 * @param {{
 *   tenantId?: string | null,
 *   userId?: string | null,
 *   resource: string,
 *   resourceId: string,
 *   action: string,
 *   metadata?: Record<string, unknown> | null
 * }} entry
 */
export async function writeAuditLog(entry) {
  const tenantId =
    entry.tenantId != null && String(entry.tenantId).trim() !== ''
      ? String(entry.tenantId).trim()
      : null;
  const resource = String(entry.resource || 'unknown').slice(0, 120);
  const resourceId = String(entry.resourceId ?? '').slice(0, 200);
  const action = String(entry.action || 'unknown').slice(0, 120);
  const userId =
    entry.userId != null && String(entry.userId).trim() !== ''
      ? String(entry.userId).trim()
      : null;

  let metadata = entry.metadata;
  if (metadata != null && typeof metadata !== 'object') {
    metadata = { value: metadata };
  }

  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        userId,
        resource,
        resourceId,
        action,
        metadata: metadata === undefined ? undefined : metadata
      }
    });
  } catch (e) {
    console.error('[auditLog] writeAuditLog failed', e);
  }
}

/**
 * @param {import('express').Request} req
 * @returns {string | null}
 */
export function auditUserIdFromRequest(req) {
  const id = req?.qhseUser?.id;
  return typeof id === 'string' && id.trim() ? id.trim() : null;
}
