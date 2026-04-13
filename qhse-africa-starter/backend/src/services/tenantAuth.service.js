import { prisma } from '../db.js';
import { DEFAULT_TENANT_ID } from '../lib/tenantConstants.js';

/**
 * @param {string} userId
 * @returns {Promise<{ id: string, slug: string, name: string, role: string }[]>}
 */
export async function listTenantsForUser(userId) {
  const uid = String(userId ?? '').trim();
  if (!uid) return [];
  const rows = await prisma.tenantMember.findMany({
    where: { userId: uid },
    include: { tenant: { select: { id: true, slug: true, name: true } } },
    orderBy: { createdAt: 'asc' }
  });
  return rows.map((r) => ({
    id: r.tenant.id,
    slug: r.tenant.slug,
    name: r.tenant.name,
    role: String(r.role ?? 'MEMBER').trim().toUpperCase()
  }));
}

/**
 * @typedef {{ mode: 'ok', tenant: { id: string, slug: string, name: string }, memberRole: string }} TenantLoginOk
 * @typedef {{ mode: 'pick', tenants: Awaited<ReturnType<typeof listTenantsForUser>> }} TenantLoginPick
 */

/**
 * @param {string} userId
 * @param {string | null | undefined} tenantSlug — normalisé en minuscules
 * @returns {Promise<TenantLoginOk | TenantLoginPick | null>}
 */
export async function resolveTenantForLogin(userId, tenantSlug) {
  const uid = String(userId ?? '').trim();
  if (!uid) return null;
  const slug = typeof tenantSlug === 'string' ? tenantSlug.trim().toLowerCase() : '';

  if (slug) {
    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true }
    });
    if (!tenant) return null;
    const m = await prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: uid } },
      select: { role: true }
    });
    if (!m) return null;
    return {
      mode: 'ok',
      tenant,
      memberRole: String(m.role ?? 'MEMBER').trim().toUpperCase()
    };
  }

  const memberships = await prisma.tenantMember.findMany({
    where: { userId: uid },
    include: { tenant: { select: { id: true, slug: true, name: true } } },
    orderBy: { createdAt: 'asc' },
    take: 2
  });

  if (memberships.length === 0) {
    return null;
  }
  if (memberships.length > 1) {
    return { mode: 'pick', tenants: await listTenantsForUser(uid) };
  }

  const m0 = memberships[0];
  return {
    mode: 'ok',
    tenant: m0.tenant,
    memberRole: String(m0.role ?? 'MEMBER').trim().toUpperCase()
  };
}

/**
 * Vérifie l’appartenance ; renvoie le tenant ou null.
 * @param {string} userId
 * @param {string} tenantId
 */
export async function assertUserTenantAccess(userId, tenantId) {
  const uid = String(userId ?? '').trim();
  const tid = String(tenantId ?? '').trim();
  if (!uid || !tid) return null;
  const m = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: tid, userId: uid } },
    include: { tenant: { select: { id: true, slug: true, name: true } } }
  });
  return m?.tenant ?? null;
}

/**
 * Premier tenant du compte (JWT sans `tid` — rétrocompat).
 */
export async function getFirstTenantForUser(userId) {
  const uid = String(userId ?? '').trim();
  if (!uid) return null;
  const m = await prisma.tenantMember.findFirst({
    where: { userId: uid },
    include: { tenant: { select: { id: true, slug: true, name: true } } },
    orderBy: { createdAt: 'asc' }
  });
  return m?.tenant ?? null;
}

export function defaultTenantIdForSeed() {
  return DEFAULT_TENANT_ID;
}
