import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

const JWT_EXPIRES = '7d';

let warnedDevJwtSecret = false;

export function getJwtSecret() {
  const s = process.env.JWT_SECRET;
  if (s && String(s).trim().length >= 16) {
    return String(s).trim();
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET requis en production (minimum 16 caractères).');
  }
  if (!warnedDevJwtSecret) {
    warnedDevJwtSecret = true;
    console.warn(
      '[auth] JWT_SECRET absent ou trop court — clé de développement utilisée (interdit en production).'
    );
  }
  return 'qhse-dev-insecure-secret';
}

/**
 * @param {{ id: string, name: string, email: string, role: string }} user
 * @param {string} tenantId — organisation active (claim `tid`)
 */
export function issueAccessToken(user, tenantId) {
  const tid = typeof tenantId === 'string' ? tenantId.trim() : '';
  if (!tid) {
    throw new Error('tenantId requis pour émettre un jeton');
  }
  return jwt.sign(
    {
      sub: user.id,
      tid,
      role: String(user.role ?? '').trim().toUpperCase()
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES }
  );
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ id: string, name: string, email: string, role: string } | null>}
 */
export async function authenticateWithEmailPassword(email, password) {
  const normalizedEmail = String(email ?? '')
    .trim()
    .toLowerCase();
  if (!normalizedEmail || password == null) return null;
  const pwd = String(password);
  if (pwd.length === 0 || pwd.length > 128) return null;

  const user = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      passwordHash: true
    }
  });

  if (!user?.passwordHash) return null;
  const ok = await bcrypt.compare(pwd, user.passwordHash);
  if (!ok) return null;

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: String(user.role ?? '').trim().toUpperCase()
  };
}

/**
 * @param {string} userId
 */
export async function listUserTenants(userId) {
  if (!userId || typeof userId !== 'string') return [];
  return prisma.userTenant.findMany({
    where: { userId: userId.trim() },
    include: { tenant: { select: { id: true, slug: true, name: true } } },
    orderBy: { createdAt: 'asc' }
  });
}

/**
 * @param {string} userId
 * @param {unknown} tenantSlug — optionnel ; si plusieurs adhésions, requis
 */
export async function resolveActiveMembership(userId, tenantSlug) {
  const list = await listUserTenants(userId);
  if (!list.length) {
    return { kind: 'no_membership' };
  }
  const rawSlug =
    tenantSlug != null && String(tenantSlug).trim() !== ''
      ? String(tenantSlug).trim().toLowerCase()
      : '';
  if (rawSlug) {
    const m = list.find((x) => String(x.tenant.slug).toLowerCase() === rawSlug);
    if (!m) {
      return {
        kind: 'unknown_tenant',
        tenants: list.map((x) => ({
          slug: x.tenant.slug,
          name: x.tenant.name,
          role: String(x.role ?? '').trim().toUpperCase()
        }))
      };
    }
    return { kind: 'ok', membership: m };
  }
  if (list.length === 1) {
    return { kind: 'ok', membership: list[0] };
  }
  return {
    kind: 'tenant_required',
    tenants: list.map((x) => ({
      slug: x.tenant.slug,
      name: x.tenant.name,
      role: String(x.role ?? '').trim().toUpperCase()
    }))
  };
}
