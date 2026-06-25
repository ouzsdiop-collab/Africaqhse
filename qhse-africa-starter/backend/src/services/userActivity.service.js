import { prisma } from '../db.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';

export async function findAllUserActivity(tenantId) {
  const tf = prismaTenantFilter(tenantId);
  const rows = await prisma.userActivity.findMany({
    where: tf,
    orderBy: { lastActionAt: 'desc' }
  });
  const userIds = rows.map((r) => r.userId);
  const users = await prisma.user.findMany({
    where: { id: { in: userIds } },
    select: { id: true, name: true, email: true, lastLoginAt: true }
  });
  const userById = new Map(users.map((u) => [u.id, u]));
  return rows.map((r) => ({
    userId: r.userId,
    actionCount: r.actionCount,
    lastActionAt: r.lastActionAt ? r.lastActionAt.toISOString() : null,
    user: userById.get(r.userId)
      ? {
          ...userById.get(r.userId),
          lastLoginAt: userById.get(r.userId).lastLoginAt
            ? userById.get(r.userId).lastLoginAt.toISOString()
            : null
        }
      : null
  }));
}
