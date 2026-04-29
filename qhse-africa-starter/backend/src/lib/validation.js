/** Limite par défaut des listes API (évite findMany illimité). */
export const LIST_DEFAULT_LIMIT = 300;

/** Plafond absolu pour ?limit= */
export const LIST_MAX_LIMIT = 500;

/** Mot de passe utilisateur (création / reset admin) — aligné API + UI. */
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

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
  incidentLocation: 500,
  incidentCauses: 4000,
  incidentCauseCategory: 40,
  incidentPhotosJson: 450000,
  incidentResponsible: 200,
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
 * Politique V1 : longueur, au moins une lettre (Unicode), au moins un chiffre.
 * @param {unknown} password
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validatePasswordPolicy(password) {
  const p = String(password ?? '');
  if (p.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Mot de passe trop court (minimum ${PASSWORD_MIN_LENGTH} caractères)`
    };
  }
  if (p.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: 'Mot de passe trop long' };
  }
  if (!/\p{L}/u.test(p)) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins une lettre' };
  }
  if (!/\d/.test(p)) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins un chiffre' };
  }
  return { ok: true };
}

const MANDATORY_PWD_MIN = 10;

/**
 * Politique renforcée : premier changement après compte provisoire (aligné produit SaaS).
 * @param {unknown} password
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validateMandatoryPasswordChangePolicy(password) {
  const p = String(password ?? '');
  if (p.length < MANDATORY_PWD_MIN) {
    return {
      ok: false,
      error: `Mot de passe trop court (minimum ${MANDATORY_PWD_MIN} caractères)`
    };
  }
  if (p.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: 'Mot de passe trop long' };
  }
  if (!/[A-Z]/.test(p)) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins une majuscule' };
  }
  if (!/[a-z]/.test(p)) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins une minuscule' };
  }
  if (!/\d/.test(p)) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins un chiffre' };
  }
  if (!/[^A-Za-z0-9]/.test(p)) {
    return {
      ok: false,
      error: 'Le mot de passe doit contenir au moins un caractère spécial (ponctuation ou symbole)'
    };
  }
  return { ok: true };
}

/**
 * @param {unknown} score
 * @returns {{ ok: true, value: number } | { ok: false, error: string }}
 */
const INCIDENT_CAUSE_CATEGORIES = new Set(['humain', 'materiel', 'organisation', 'mixte']);

/**
 * @param {unknown} raw
 * @param {number} maxLen
 * @returns {{ ok: true, value: string[] | null } | { ok: false, error: string }}
 */
export function parseIncidentPhotosJson(raw, maxLen) {
  if (raw == null || raw === '') {
    return { ok: true, value: null };
  }

  /** @type {unknown} */
  let parsed;

  if (Array.isArray(raw)) {
    parsed = raw;
    const approx = JSON.stringify(raw);
    if (approx.length > maxLen) {
      return { ok: false, error: 'Données photo trop volumineuses (réduire taille ou nombre)' };
    }
  } else if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return { ok: true, value: null };
    if (s.length > maxLen) {
      return { ok: false, error: 'Données photo trop volumineuses (réduire taille ou nombre)' };
    }
    try {
      parsed = JSON.parse(s);
    } catch {
      return { ok: false, error: 'photosJson invalide (JSON)' };
    }
  } else {
    return { ok: false, error: 'photosJson : attendu une chaîne JSON ou un tableau' };
  }

  if (!Array.isArray(parsed)) {
    return { ok: false, error: 'photosJson : attendu un tableau' };
  }
  if (parsed.length > 4) {
    return { ok: false, error: 'Maximum 4 photos par incident' };
  }
  for (const x of parsed) {
    if (typeof x !== 'string' || x.length < 20 || !x.startsWith('data:image/')) {
      return { ok: false, error: 'Chaque photo doit être une data URL image' };
    }
  }

  return { ok: true, value: parsed };
}

/**
 * @param {unknown} raw
 * @param {number} maxLen
 * @returns {string | null}
 */
export function parseIncidentCauseCategory(raw, maxLen) {
  if (raw == null || raw === '') return null;
  const t = clampTrimString(String(raw), maxLen).toLowerCase();
  if (!t) return null;
  if (!INCIDENT_CAUSE_CATEGORIES.has(t)) {
    return '__invalid__';
  }
  return t;
}

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

/**
 * Middleware Express : valide `req.body` avec un schéma Zod.
 * @param {import('zod').ZodTypeAny} schema
 */
export function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(422).json({
        error: 'Donnees invalides',
        code: 'VALIDATION_ERROR',
        details: result.error.flatten().fieldErrors
      });
    }
    req.body = result.data;
    next();
  };
}
