import { prisma } from '../db.js';
import { DEFAULT_TENANT_ID } from '../lib/tenantConstants.js';

function tenantIsActive(t) {
  const st = String(t?.status ?? 'active').toLowerCase();
  return st !== 'suspended';
}

/**
 * @param {string} userId
 * @returns {Promise<{ id: string, slug: string, name: string, role: string }[]>}
 */
export async function listTenantsForUser(userId) {
  const uid = String(userId ?? '').trim();
  if (!uid) return [];
  const rows = await prisma.tenantMember.findMany({
    where: { userId: uid },
    include: { tenant: { select: { id: true, slug: true, name: true, status: true } } },
    orderBy: { createdAt: 'asc' }
  });
  return rows
    .filter((r) => tenantIsActive(r.tenant))
    .map((r) => ({
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
      select: { id: true, slug: true, name: true, status: true }
    });
    if (!tenant || !tenantIsActive(tenant)) return null;
    const m = await prisma.tenantMember.findUnique({
      where: { tenantId_userId: { tenantId: tenant.id, userId: uid } },
      select: { role: true }
    });
    if (!m) return null;
    return {
      mode: 'ok',
      tenant: { id: tenant.id, slug: tenant.slug, name: tenant.name },
      memberRole: String(m.role ?? 'MEMBER').trim().toUpperCase()
    };
  }

  const memberships = await prisma.tenantMember.findMany({
    where: { userId: uid },
    include: { tenant: { select: { id: true, slug: true, name: true, status: true } } },
    orderBy: { createdAt: 'asc' }
  });

  const activeMemberships = memberships.filter((m) => tenantIsActive(m.tenant));
  if (activeMemberships.length === 0) {
    return null;
  }
  if (activeMemberships.length > 1) {
    return { mode: 'pick', tenants: await listTenantsForUser(uid) };
  }

  const m0 = activeMemberships[0];
  return {
    mode: 'ok',
    tenant: { id: m0.tenant.id, slug: m0.tenant.slug, name: m0.tenant.name },
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
    include: { tenant: { select: { id: true, slug: true, name: true, status: true } } }
  });
  if (!m?.tenant || !tenantIsActive(m.tenant)) return null;
  return { id: m.tenant.id, slug: m.tenant.slug, name: m.tenant.name };
}

/**
 * Premier tenant du compte (JWT sans `tid` — rétrocompat).
 */
export async function getFirstTenantForUser(userId) {
  const uid = String(userId ?? '').trim();
  if (!uid) return null;
  const rows = await prisma.tenantMember.findMany({
    where: { userId: uid },
    include: { tenant: { select: { id: true, slug: true, name: true, status: true } } },
    orderBy: { createdAt: 'asc' }
  });
  const m = rows.find((r) => tenantIsActive(r.tenant));
  if (!m?.tenant) return null;
  return { id: m.tenant.id, slug: m.tenant.slug, name: m.tenant.name };
}

export function defaultTenantIdForSeed() {
  return DEFAULT_TENANT_ID;
}
