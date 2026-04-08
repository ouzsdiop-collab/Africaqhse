/**
 * Politique d’accès API — compatible dev local et durcissement prod / SaaS.
 * Variables : REQUIRE_AUTH, ALLOW_X_USER_ID, NODE_ENV, CORS_ORIGINS, FRONTEND_URL
 */

let warnedCorsProd = false;

/**
 * @param {string} value
 */
function normalizeOrigin(value) {
  return String(value).trim().replace(/\/+$/, '');
}

/**
 * Liste d’origines autorisées : CORS_ORIGINS (virgules) + option FRONTEND_URL (une URL).
 */
function buildCorsOriginList() {
  const fromCors = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((s) => normalizeOrigin(s)).filter(Boolean)
    : [];
  const front = process.env.FRONTEND_URL ? normalizeOrigin(process.env.FRONTEND_URL) : '';
  const merged = front ? [front, ...fromCors] : [...fromCors];
  return [...new Set(merged)];
}

/**
 * Authentification obligatoire sur les routes protégées par requirePermission.
 * - REQUIRE_AUTH=true|1 → toujours exiger un utilisateur.
 * - REQUIRE_AUTH=false|0 → ne jamais exiger (dev / démo).
 * - Sinon : si NODE_ENV=production → exiger ; sinon relâché (comportement historique).
 */
export function isRequireAuthEnabled() {
  const r = process.env.REQUIRE_AUTH;
  if (r === 'false' || r === '0') return false;
  if (r === 'true' || r === '1') return true;
  return process.env.NODE_ENV === 'production';
}

/**
 * En-tête X-User-Id (bootstrap démo). Désactivé par défaut en production.
 * - ALLOW_X_USER_ID=true|1 → autorisé même en prod (urgence / intégration).
 * - ALLOW_X_USER_ID=false|0 → refusé.
 * - Sinon : autorisé seulement hors production.
 */
export function isXUserIdAllowed() {
  const a = process.env.ALLOW_X_USER_ID;
  if (a === 'true' || a === '1') return true;
  if (a === 'false' || a === '0') return false;
  return process.env.NODE_ENV !== 'production';
}

/**
 * Options passées à cors().
 */
export function getCorsMiddlewareOptions() {
  const list = buildCorsOriginList();

  return {
    origin(origin, callback) {
      if (list.length === 0) {
        if (process.env.NODE_ENV !== 'production') {
          return callback(null, true);
        }
        if (!warnedCorsProd) {
          warnedCorsProd = true;
          console.warn(
            '[security] CORS_ORIGINS non défini en production — origine navigateur refusée.'
          );
        }
        if (!origin) {
          return callback(null, true);
        }
        return callback(new Error(`Origine non autorisée par CORS : ${origin}`));
      }
      if (list.includes('*')) {
        return callback(null, true);
      }
      if (!origin) {
        return callback(null, true);
      }
      if (list.includes(normalizeOrigin(origin))) {
        return callback(null, true);
      }
      return callback(new Error(`Origine non autorisée par CORS : ${origin}`));
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-User-Id',
      'X-Request-Id',
      'X-Automation-Secret'
    ]
  };
}
