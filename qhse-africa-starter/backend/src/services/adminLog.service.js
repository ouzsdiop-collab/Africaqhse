import { prisma } from '../db.js';

export const ADMIN_LOG_ACTIONS = Object.freeze({
  USER_CREATED: 'USER_CREATED',
  ACCESS_EMAIL_SENT: 'ACCESS_EMAIL_SENT',
  TEMP_PASSWORD_RESET: 'TEMP_PASSWORD_RESET',
  USER_SUSPENDED: 'USER_SUSPENDED',
  USER_REACTIVATED: 'USER_REACTIVATED',
  COMPANY_CREATED: 'COMPANY_CREATED',
  COMPANY_SUSPENDED: 'COMPANY_SUSPENDED',
  ROLE_CHANGED: 'ROLE_CHANGED'
});

function sanitizeMetadata(meta) {
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return {};
  const forbiddenKeys = new Set([
    'password',
    'temporarypassword',
    'provisionalpassword',
    'temporarypasswordonetime',
    'token',
    'hash',
    'secret',
    'smtp_pass'
  ]);
  const clone = { ...meta };
  for (const k of Object.keys(clone)) {
    const lk = String(k || '').toLowerCase();
    if (forbiddenKeys.has(lk) || lk.includes('password') || lk.includes('token') || lk.includes('secret') || lk.includes('hash')) {
      delete clone[k];
    }
  }
  return clone;
}

export async function writeAdminLog({ actorUserId, targetType = null, targetId = null, tenantId = null, action, metadata = {} }) {
  const actor = String(actorUserId || '').trim();
  const act = String(action || '').trim().toUpperCase();
  if (!actor || !act) return;
  try {
    await prisma.adminLog.create({
      data: {
        actorUserId: actor,
        targetType: targetType ? String(targetType) : null,
        targetId: targetId ? String(targetId) : null,
        tenantId: tenantId ? String(tenantId) : null,
        action: act,
        metadata: sanitizeMetadata(metadata)
      }
    });
  } catch (err) {
    console.warn('[admin-log] write skipped', {
      actorUserId: actor,
      action: act,
      message: err instanceof Error ? err.message : String(err)
    });
  }
}

export async function listAdminLogs({ tenantId = '', action = '', limit = 100 }) {
  const where = {};
  if (tenantId) where.tenantId = String(tenantId).trim();
  if (action) where.action = String(action).trim().toUpperCase();
  const take = Math.min(Math.max(Number(limit) || 100, 1), 300);
  return prisma.adminLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take,
    select: {
      id: true,
      actorUserId: true,
      targetType: true,
      targetId: true,
      tenantId: true,
      action: true,
      metadata: true,
      createdAt: true
    }
  });
}
