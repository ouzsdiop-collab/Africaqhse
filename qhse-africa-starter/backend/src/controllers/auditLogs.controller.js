import { prisma } from '../db.js';

const MAX_TAKE = 100;

/**
 * Liste paginée des entrées de journal serveur.
 * - ADMIN : toutes les entrées ; filtre optionnel `?tenantId=`
 * - Autres rôles autorisés : entrées du tenant JWT uniquement (sans entrées `tenantId` null sauf ADMIN).
 */
export async function list(req, res) {
  const role = String(req.qhseUser?.role ?? '').trim().toUpperCase();
  const tenantFromJwt = req.qhseTenantId;

  const rawTake = Number(req.query.take ?? req.query.limit);
  const take = Number.isFinite(rawTake)
    ? Math.min(MAX_TAKE, Math.max(1, Math.floor(rawTake)))
    : 50;
  const rawSkip = Number(req.query.skip);
  const skip = Number.isFinite(rawSkip)
    ? Math.min(10_000, Math.max(0, Math.floor(rawSkip)))
    : 0;

  /** @type {import('@prisma/client').Prisma.AuditLogWhereInput} */
  const where = {};

  if (role === 'ADMIN') {
    const tid = typeof req.query.tenantId === 'string' ? req.query.tenantId.trim() : '';
    if (tid) {
      where.tenantId = tid;
    }
  } else {
    if (!tenantFromJwt) {
      return res.status(403).json({ error: 'Contexte organisation requis.' });
    }
    where.tenantId = tenantFromJwt;
  }

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take,
      include: {
        user: { select: { id: true, name: true, email: true } }
      }
    }),
    prisma.auditLog.count({ where })
  ]);

  res.json({
    items,
    total,
    skip,
    take
  });
}
