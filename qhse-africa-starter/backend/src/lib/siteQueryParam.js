/**
 * Extrait siteId depuis req.query (liste API filtrable par périmètre).
 * Chaîne vide → null (pas de filtre).
 * @param {import('express').Request} req
 * @returns {string | null}
 */
export function parseSiteIdQuery(req) {
  const v = req.query?.siteId;
  if (v === undefined || v === null) return null;
  const s = Array.isArray(v) ? String(v[0]) : String(v);
  const t = s.trim();
  return t === '' ? null : t;
}
