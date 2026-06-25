import { prisma } from '../db.js';
import { normalizeTenantId } from '../lib/tenantScope.js';

const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function recordActivity(tenantId, userId) {
  try {
    const tid = normalizeTenantId(tenantId);
    if (!tid || !userId) return;
    await prisma.userActivity.upsert({
      where: { tenantId_userId: { tenantId: tid, userId } },
      create: { tenantId: tid, userId, actionCount: 1, lastActionAt: new Date() },
      update: { actionCount: { increment: 1 }, lastActionAt: new Date() }
    });
  } catch (err) {
    console.error('[trackActivity] échec écriture UserActivity', err?.message || err);
  }
}

/** Comptabilise l'activité d'un utilisateur sans bloquer la requête (fire-and-forget). */
export function trackActivity(req, res, next) {
  if (MUTATING_METHODS.has(req.method)) {
    void recordActivity(req.qhseTenantId, req.qhseUser?.id);
  }
  next();
}
