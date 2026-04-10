import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';

const JWT_EXPIRES = '1h';

const REFRESH_EXPIRES = '30d';

/** Réponse API / contexte — pas de table `tenants` en V1. */
export const MONO_ORG = Object.freeze({
  id: 'mono',
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
 */
export function issueAccessToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      role: String(user.role ?? '').trim().toUpperCase()
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES }
  );
}

export function issueRefreshToken(user) {
  return jwt.sign(
    { sub: user.id, type: 'refresh' },
    getJwtSecret(),
    { expiresIn: REFRESH_EXPIRES }
  );
}

export function verifyRefreshToken(token) {
  try {
    const payload = jwt.verify(token, getJwtSecret());
    if (payload.type !== 'refresh') return null;
    return payload;
  } catch {
    return null;
  }
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
