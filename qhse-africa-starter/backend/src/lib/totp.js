import crypto from 'node:crypto';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP_SECONDS = 30;
const CODE_DIGITS = 6;

/** Encode un Buffer en base32 (RFC 4648, sans padding) — format attendu par les apps TOTP. */
function base32Encode(buffer) {
  let bits = '';
  for (const byte of buffer) bits += byte.toString(2).padStart(8, '0');
  let output = '';
  for (let i = 0; i + 5 <= bits.length; i += 5) {
    output += BASE32_ALPHABET[parseInt(bits.slice(i, i + 5), 2)];
  }
  const remainder = bits.length % 5;
  if (remainder) {
    const lastChunk = bits.slice(bits.length - remainder).padEnd(5, '0');
    output += BASE32_ALPHABET[parseInt(lastChunk, 2)];
  }
  return output;
}

function base32Decode(input) {
  const cleaned = String(input || '')
    .toUpperCase()
    .replace(/[^A-Z2-7]/g, '');
  let bits = '';
  for (const char of cleaned) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    bits += idx.toString(2).padStart(5, '0');
  }
  const bytes = [];
  for (let i = 0; i + 8 <= bits.length; i += 8) {
    bytes.push(parseInt(bits.slice(i, i + 8), 2));
  }
  return Buffer.from(bytes);
}

/** Génère un secret TOTP aléatoire (160 bits), encodé en base32. */
export function generateTotpSecret() {
  return base32Encode(crypto.randomBytes(20));
}

function hotp(secretBase32, counter) {
  const key = base32Decode(secretBase32);
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigUInt64BE(BigInt(counter));
  const hmac = crypto.createHmac('sha1', key).update(counterBuffer).digest();
  const offset = hmac[hmac.length - 1] & 0x0f;
  const binCode =
    ((hmac[offset] & 0x7f) << 24) |
    ((hmac[offset + 1] & 0xff) << 16) |
    ((hmac[offset + 2] & 0xff) << 8) |
    (hmac[offset + 3] & 0xff);
  return String(binCode % 10 ** CODE_DIGITS).padStart(CODE_DIGITS, '0');
}

/**
 * Vérifie un code TOTP à 6 chiffres avec une fenêtre de tolérance (horloges client/serveur).
 * @param {string} secretBase32
 * @param {string} token
 * @param {number} [windowSteps] nombre de pas de 30s acceptés avant/après l'heure courante
 */
export function verifyTotp(secretBase32, token, windowSteps = 1) {
  const clean = String(token || '').replace(/\s+/g, '');
  if (!/^\d{6}$/.test(clean)) return false;
  const counter = Math.floor(Date.now() / 1000 / STEP_SECONDS);
  for (let delta = -windowSteps; delta <= windowSteps; delta++) {
    if (hotp(secretBase32, counter + delta) === clean) return true;
  }
  return false;
}

/** URI `otpauth://` à encoder en QR code pour l'enrôlement dans une app d'authentification. */
export function buildTotpUri(secretBase32, accountEmail, issuer = 'QHSE Control Africa') {
  const label = encodeURIComponent(`${issuer}:${accountEmail}`);
  const params = new URLSearchParams({
    secret: secretBase32,
    issuer,
    algorithm: 'SHA1',
    digits: String(CODE_DIGITS),
    period: String(STEP_SECONDS)
  });
  return `otpauth://totp/${label}?${params.toString()}`;
}
