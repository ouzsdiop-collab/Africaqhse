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
