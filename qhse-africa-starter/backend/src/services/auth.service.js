import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../db.js';
import { DEFAULT_TENANT_ID } from '../lib/tenantConstants.js';
import { validatePasswordPolicy } from '../lib/validation.js';

const JWT_EXPIRES = '1h';

const REFRESH_EXPIRES = '30d';

/** @deprecated Utiliser le tenant issu de la DB / JWT (`tid`). Conservé pour compatibilité d’import. */
export const MONO_ORG = Object.freeze({
  id: DEFAULT_TENANT_ID,
  slug: 'default',
  name: 'Organisation'
});

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
 * @param {string | null | undefined} tenantId
 */
export function issueAccessToken(user, tenantId) {
  const tid = typeof tenantId === 'string' ? tenantId.trim() : '';
  return jwt.sign(
    {
      sub: user.id,
      role: String(user.role ?? '').trim().toUpperCase(),
      ...(tid ? { tid } : {})
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES }
  );
}

/**
 * @param {{ id: string }} user
 * @param {string | null | undefined} tenantId
 */
export function issueRefreshToken(user, tenantId) {
  const tid = typeof tenantId === 'string' ? tenantId.trim() : '';
  return jwt.sign(
    { sub: user.id, type: 'refresh', ...(tid ? { tid } : {}) },
    getJwtSecret(),
    { expiresIn: REFRESH_EXPIRES }
  );
}

/** @returns {import('jsonwebtoken').JwtPayload & { sub?: string, tid?: string } | null} */
export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (payload.type !== 'refresh') return null;
    return payload;
  } catch {
    return null;
  }
}

const RESET_TOKEN_BYTES = 32;
const RESET_EXPIRES_MS = 60 * 60 * 1000;

function hashResetToken(raw) {
  return createHash('sha256').update(raw, 'utf8').digest('hex');
}

/**
 * Crée un jeton de réinitialisation (valeur brute à envoyer par e-mail).
 * @param {string} userId
 * @returns {Promise<{ rawToken: string, expiresAt: Date } | null>}
 */
export async function createPasswordResetToken(userId) {
  const uid = String(userId ?? '').trim();
  if (!uid) return null;
  const rawToken = randomBytes(RESET_TOKEN_BYTES).toString('hex');
  const tokenHash = hashResetToken(rawToken);
  const expiresAt = new Date(Date.now() + RESET_EXPIRES_MS);
  await prisma.passwordResetToken.deleteMany({ where: { userId: uid } });
  await prisma.passwordResetToken.create({
    data: {
      tokenHash,
      userId: uid,
      expiresAt
    }
  });
  return { rawToken, expiresAt };
}

/**
 * @param {string} rawToken
 * @param {string} newPassword
 * @returns {Promise<{ ok: true } | { ok: false, code: string, message?: string }>}
 */
export async function consumePasswordResetToken(rawToken, newPassword) {
  const raw = typeof rawToken === 'string' ? rawToken.trim() : '';
  if (!raw || raw.length < 16) {
    return { ok: false, code: 'invalid_token' };
  }
  const tokenHash = hashResetToken(raw);
  const row = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true } } }
  });
  if (!row || row.expiresAt < new Date()) {
    if (row) {
      await prisma.passwordResetToken.delete({ where: { id: row.id } }).catch(() => {});
    }
    return { ok: false, code: 'invalid_or_expired' };
  }
  const pwd = String(newPassword ?? '');
  const pv = validatePasswordPolicy(pwd);
  if (!pv.ok) {
    return { ok: false, code: 'password_policy', message: pv.error };
  }
  const passwordHash = await bcrypt.hash(pwd, 10);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: row.userId },
      data: { passwordHash }
    }),
    prisma.passwordResetToken.deleteMany({ where: { userId: row.userId } }),
    prisma.refreshToken.deleteMany({ where: { userId: row.userId } })
  ]);
  return { ok: true };
}

/**
 * Déconnexion : avec refresh JWT stateless, rien à révoquer côté serveur.
 */
export async function revokeRefreshToken(_token) {
  /* no-op */
}

/**
 * Purge des refresh tokens persistés (legacy DB) — tâche planifiée.
 * @returns {Promise<{ deleted: number }>}
 */
export async function cleanupExpiredRefreshTokens() {
  const result = await prisma.refreshToken.deleteMany({
    where: { expiresAt: { lt: new Date() } }
  });
  return { deleted: result.count };
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
