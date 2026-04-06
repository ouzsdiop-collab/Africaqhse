/** Limite par défaut des listes API (évite findMany illimité). */
export const LIST_DEFAULT_LIMIT = 300;

/** Plafond absolu pour ?limit= */
export const LIST_MAX_LIMIT = 500;

export const FIELD_LIMITS = {
  actionTitle: 500,
  actionDetail: 8000,
  actionStatus: 120,
  actionOwner: 200,
  incidentRef: 80,
  incidentType: 120,
  incidentSiteLabel: 120,
  incidentSeverity: 80,
  incidentDescription: 8000,
  incidentStatus: 120,
  auditRef: 80,
  auditSite: 120,
  auditStatus: 120,
  ncTitle: 500,
  ncDetail: 8000,
  riskDescription: 8000,
  riskTitle: 240,
  userName: 120,
  emailMax: 254
};

/**
 * @param {unknown} value — query param brut
 * @returns {number} entre 1 et LIST_MAX_LIMIT
 */
export function parseListLimit(value) {
  if (value === undefined || value === null || value === '') {
    return LIST_DEFAULT_LIMIT;
  }
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 1) return LIST_DEFAULT_LIMIT;
  return Math.min(Math.floor(n), LIST_MAX_LIMIT);
}

/**
 * @param {unknown} s
 * @param {number} max
 * @returns {string}
 */
export function clampTrimString(s, max) {
  if (typeof s !== 'string') return '';
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, max);
}

/**
 * Validation e-mail simple (pas RFC complète, suffisant pour rejeter les saisies évidentes).
 * @param {string} email
 */
export function isValidEmailBasic(email) {
  if (typeof email !== 'string') return false;
  const t = email.trim().toLowerCase();
  if (t.length < 5 || t.length > FIELD_LIMITS.emailMax) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t);
}

/**
 * @param {unknown} score
 * @returns {{ ok: true, value: number } | { ok: false, error: string }}
 */
export function parseAuditScore(score) {
  const n = Number(score);
  if (!Number.isFinite(n)) {
    return { ok: false, error: 'score doit être un nombre' };
  }
  if (n < 0 || n > 100) {
    return { ok: false, error: 'score doit être entre 0 et 100' };
  }
  return { ok: true, value: Math.round(n * 100) / 100 };
}
