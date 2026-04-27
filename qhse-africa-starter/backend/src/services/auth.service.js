import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createHash, randomBytes } from 'crypto';
import { prisma } from '../db.js';
import { DEFAULT_TENANT_ID } from '../lib/tenantConstants.js';
import { validatePasswordPolicy, validateMandatoryPasswordChangePolicy } from '../lib/validation.js';

const JWT_EXPIRES = '1h';

const REFRESH_EXPIRES = '30d';

/** Jeton court dédié au flux « changement obligatoire du mot de passe » (pas d’accès API métier). */
const PASSWORD_SETUP_EXPIRES = '15m';

/** Durée de validité d’un mot de passe provisoire après attribution (réinitialisation admin). */
export const PROVISIONAL_PASSWORD_TTL_MS = 7 * 24 * 60 * 60 * 1000;

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

/**
 * Jeton limité au POST /api/auth/change-temporary-password (claim `typ: pwd_setup`).
 * @param {string} userId
 * @param {string} tenantId
 */
export function issuePasswordSetupToken(userId, tenantId) {
  const uid = String(userId ?? '').trim();
  const tid = String(tenantId ?? '').trim();
  if (!uid || !tid) {
    throw new Error('issuePasswordSetupToken: userId et tenantId requis');
  }
  return jwt.sign(
    { sub: uid, typ: 'pwd_setup', tid },
    getJwtSecret(),
    { expiresIn: PASSWORD_SETUP_EXPIRES }
  );
}

/**
 * @param {string} token
 * @returns {{ sub: string, tid: string } | null}
 */
export function verifyPasswordSetupToken(token) {
  const raw = typeof token === 'string' ? token.trim() : '';
  if (!raw) return null;
  try {
    const payload = jwt.verify(raw, getJwtSecret());
    if (payload.typ !== 'pwd_setup') return null;
    const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
    const tid = typeof payload.tid === 'string' ? payload.tid.trim() : '';
    if (!sub || !tid) return null;
    return { sub, tid };
  } catch {
    return null;
  }
}

/**
 * @param {string} rawToken
 * @param {string} newPassword
 * @returns {Promise<{ ok: true, user: { id: string, name: string, email: string, role: string } } | { ok: false, code: string, message?: string }>}
 */
export async function fulfillMandatoryPasswordChange(rawToken, newPassword) {
  const parsed = verifyPasswordSetupToken(rawToken);
  if (!parsed) {
    return { ok: false, code: 'invalid_setup_token' };
  }
  const pv = validateMandatoryPasswordChangePolicy(newPassword);
  if (!pv.ok) {
    return { ok: false, code: 'password_policy', message: pv.error };
  }

  const row = await prisma.user.findUnique({
    where: { id: parsed.sub },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      mustChangePassword: true,
      isActive: true
    }
  });
  if (!row?.isActive) {
    return { ok: false, code: 'account_inactive' };
  }
  if (!row.mustChangePassword) {
    return { ok: false, code: 'no_change_required' };
  }

  const m = await prisma.tenantMember.findUnique({
    where: { tenantId_userId: { tenantId: parsed.tid, userId: parsed.sub } },
    select: { userId: true }
  });
  if (!m) {
    return { ok: false, code: 'tenant_mismatch' };
  }

  const passwordHash = await bcrypt.hash(String(newPassword), 12);
  await prisma.$transaction([
    prisma.user.update({
      where: { id: parsed.sub },
      data: {
        passwordHash,
        mustChangePassword: false,
        temporaryPasswordCreatedAt: null
      }
    }),
    prisma.refreshToken.deleteMany({ where: { userId: parsed.sub } })
  ]);

  return {
    ok: true,
    user: {
      id: row.id,
      name: row.name,
      email: row.email,
      role: String(row.role ?? '').trim().toUpperCase()
    }
  };
}

/** Génère un mot de passe provisoire lisible (affichage unique côté admin). */
export function generateProvisioningPassword() {
  const upper = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lower = 'abcdefghijkmnpqrstuvwxyz';
  const digits = '23456789';
  const special = '@%+-_!';
  const pick = (set, n) => {
    let s = '';
    for (let i = 0; i < n; i += 1) {
      s += set[randomBytes(1)[0] % set.length];
    }
    return s;
  };
  const core = pick(upper, 3) + pick(lower, 3) + pick(digits, 3) + pick(special, 2);
  const arr = core.split('');
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = randomBytes(1)[0] % (i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.join('');
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
  /**
   * TODO(auth-refresh): Passer à une stratégie refresh “rotating”.
   *
   * État actuel:
   * - Le refresh token est un JWT stateless stocké en cookie httpOnly.
   * - `revokeRefreshToken()` ne peut pas invalider un token déjà émis (pas de stockage server-side).
   *
   * Risque:
   * - Si le cookie refresh est volé, il reste utilisable jusqu’à expiration (30 jours par défaut),
   *   même après “logout” côté client (qui ne fait qu’effacer le cookie).
   *
   * Cible:
   * - Rotation à chaque refresh (ancien refresh invalide après usage),
   * - `jti` (ou hash de refresh) stocké en DB/Redis (allowlist/denylist),
   * - Révocation à logout (suppression/invalidation du `jti` courant),
   * - Détection de réutilisation (reuse detection) → invalidation de la session.
   */
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
 * Authentification par e-mail ou par `clientCode` (insensible à la casse pour le code).
 * @param {string} identifier — e-mail ou code client
 * @param {string} password
 * @returns {Promise<
 *   | null
 *   | { code: 'PROVISIONAL_EXPIRED' }
 *   | {
 *       id: string;
 *       name: string;
 *       email: string;
 *       role: string;
 *       mustChangePassword: boolean;
 *     }
 * >}
 */
export async function authenticateWithIdentifierAndPassword(identifier, password) {
  const idRaw = String(identifier ?? '').trim();
  if (!idRaw || password == null) return null;
  const pwd = String(password);
  if (pwd.length === 0 || pwd.length > 128) return null;

  const looksEmail = idRaw.includes('@');
  const user = looksEmail
    ? await prisma.user.findUnique({
        where: { email: idRaw.toLowerCase() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          passwordHash: true,
          mustChangePassword: true,
          isActive: true,
          temporaryPasswordCreatedAt: true,
          clientCode: true
        }
      })
    : await prisma.user.findUnique({
        where: { clientCode: idRaw.toLowerCase() },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          passwordHash: true,
          mustChangePassword: true,
          isActive: true,
          temporaryPasswordCreatedAt: true,
          clientCode: true
        }
      });

  if (!user?.passwordHash || user.isActive === false) return null;
  const ok = await bcrypt.compare(pwd, user.passwordHash);
  if (!ok) return null;

  if (
    user.mustChangePassword &&
    user.temporaryPasswordCreatedAt instanceof Date &&
    Date.now() - user.temporaryPasswordCreatedAt.getTime() > PROVISIONAL_PASSWORD_TTL_MS
  ) {
    return { code: 'PROVISIONAL_EXPIRED' };
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: String(user.role ?? '').trim().toUpperCase(),
    mustChangePassword: Boolean(user.mustChangePassword)
  };
}

/**
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{ id: string, name: string, email: string, role: string } | null>}
 */
export async function authenticateWithEmailPassword(email, password) {
  const r = await authenticateWithIdentifierAndPassword(email, password);
  if (!r || 'code' in r) return null;
  return {
    id: r.id,
    name: r.name,
    email: r.email,
    role: r.role
  };
}
