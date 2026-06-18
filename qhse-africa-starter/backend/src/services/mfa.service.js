import crypto from 'node:crypto';
import { prisma } from '../db.js';
import { generateTotpSecret, verifyTotp, buildTotpUri } from '../lib/totp.js';
import { encryptSecret, decryptSecret } from '../lib/secretCrypto.js';

const MFA_DOMAIN = 'mfa-secret';
const BACKUP_CODE_COUNT = 8;

function hashBackupCode(code) {
  return crypto.createHash('sha256').update(code).digest('hex');
}

function generateBackupCodes() {
  const codes = [];
  for (let i = 0; i < BACKUP_CODE_COUNT; i++) {
    codes.push(crypto.randomBytes(5).toString('hex'));
  }
  return codes;
}

/**
 * Démarre l'enrôlement MFA : génère un secret TOTP (non actif tant que non confirmé)
 * et le stocke chiffré temporairement sur l'utilisateur.
 * @param {string} userId
 * @param {string} email
 */
export async function startMfaEnrollment(userId, email) {
  const existing = await prisma.user.findUnique({ where: { id: userId }, select: { mfaEnabled: true } });
  if (existing?.mfaEnabled) {
    const err = new Error('Le MFA est déjà actif ; désactivez-le avant de ré-enrôler.');
    err.statusCode = 400;
    throw err;
  }
  const secret = generateTotpSecret();
  const encrypted = encryptSecret(secret, MFA_DOMAIN);
  if (!encrypted) {
    throw new Error('Chiffrement MFA indisponible (JWT_SECRET manquant).');
  }
  await prisma.user.update({
    where: { id: userId },
    data: { mfaSecretEncrypted: encrypted, mfaEnabled: false, mfaEnrolledAt: null }
  });
  return {
    secret,
    qrCodeUri: buildTotpUri(secret, email)
  };
}

/**
 * Confirme l'enrôlement avec un premier code TOTP valide : active le MFA et émet
 * les codes de secours (retournés en clair une seule fois).
 * @param {string} userId
 * @param {string} token
 */
export async function confirmMfaEnrollment(userId, token) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user?.mfaSecretEncrypted) {
    throw new Error('Aucun enrôlement MFA en cours.');
  }
  const secret = decryptSecret(user.mfaSecretEncrypted, MFA_DOMAIN);
  if (!secret || !verifyTotp(secret, token)) {
    return { ok: false };
  }
  const backupCodes = generateBackupCodes();
  const hashed = backupCodes.map(hashBackupCode);
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: true,
      mfaEnrolledAt: new Date(),
      mfaBackupCodesHash: JSON.stringify(hashed)
    }
  });
  return { ok: true, backupCodes };
}

/**
 * Vérifie un code MFA (TOTP ou code de secours) au login.
 * @param {{ mfaSecretEncrypted: string | null, mfaBackupCodesHash: string | null, id: string }} user
 * @param {string} token
 */
export async function verifyMfaLoginToken(user, token) {
  const secret = decryptSecret(user.mfaSecretEncrypted, MFA_DOMAIN);
  if (secret && verifyTotp(secret, token)) {
    return true;
  }
  const clean = String(token || '').trim().toLowerCase();
  if (!clean || !user.mfaBackupCodesHash) return false;
  /** @type {string[]} */
  let hashes = [];
  try {
    hashes = JSON.parse(user.mfaBackupCodesHash);
  } catch {
    return false;
  }
  const candidate = hashBackupCode(clean);
  const idx = hashes.indexOf(candidate);
  if (idx === -1) return false;
  // Code de secours à usage unique : on le retire après utilisation.
  hashes.splice(idx, 1);
  await prisma.user.update({
    where: { id: user.id },
    data: { mfaBackupCodesHash: JSON.stringify(hashes) }
  });
  return true;
}

/** Désactive le MFA pour un utilisateur (auto-désactivation ou action admin). */
export async function disableMfa(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: {
      mfaEnabled: false,
      mfaSecretEncrypted: null,
      mfaEnrolledAt: null,
      mfaBackupCodesHash: null
    }
  });
}
