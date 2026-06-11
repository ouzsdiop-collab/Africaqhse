import crypto from 'node:crypto';

const ALGO = 'aes-256-gcm';

function resolveKey() {
  const dedicated = String(process.env.TEMP_PASSWORD_ENCRYPTION_KEY || '').trim();
  const base = dedicated || String(process.env.JWT_SECRET || '').trim();
  if (!base) return null;
  return crypto.createHash('sha256').update(`temp-password:${base}`).digest();
}

/** Chiffre un texte en clair (ex. mot de passe provisoire) en base64 "iv:tag:ciphertext". */
export function encryptSecret(plainText) {
  const key = resolveKey();
  if (!key || typeof plainText !== 'string' || !plainText) return null;
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, encrypted].map((b) => b.toString('base64')).join(':');
}

/** Déchiffre une valeur produite par encryptSecret(). Retourne null si invalide/absent. */
export function decryptSecret(encoded) {
  const key = resolveKey();
  if (!key || typeof encoded !== 'string' || !encoded) return null;
  const parts = encoded.split(':');
  if (parts.length !== 3) return null;
  try {
    const [iv, tag, encrypted] = parts.map((p) => Buffer.from(p, 'base64'));
    const decipher = crypto.createDecipheriv(ALGO, key, iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
  } catch {
    return null;
  }
}
