/**
 * Limite du parseur express.json — défaut 512 ko (aligné sur message d’erreur serveur).
 * Variables d’environnement acceptées : nombre d’octets ou chaîne type « 512kb », « 1mb ».
 */
export function getJsonBodyLimit() {
  const raw = process.env.JSON_BODY_LIMIT;
  if (raw == null || String(raw).trim() === '') {
    return '512kb';
  }
  const s = String(raw).trim().toLowerCase();
  if (/^\d+$/.test(s)) {
    const n = Number(s);
    if (Number.isFinite(n) && n > 0 && n <= 10 * 1024 * 1024) {
      return n;
    }
  }
  if (/^(?:\d+(?:\.\d+)?)\s*(?:kb|mb|gb)$/i.test(s)) {
    return s;
  }
  return '512kb';
}
