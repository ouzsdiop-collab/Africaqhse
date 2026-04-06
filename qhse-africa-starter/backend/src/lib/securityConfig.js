/**
 * Politique d’accès API — compatible dev local et durcissement prod / SaaS.
 * Variables : REQUIRE_AUTH, ALLOW_X_USER_ID, NODE_ENV, CORS_ORIGINS
 */

let warnedCorsProd = false;

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
  const raw = process.env.CORS_ORIGINS;
  const list = raw
    ? raw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  return {
    origin(origin, callback) {
      if (list.length === 0) {
        if (process.env.NODE_ENV === 'production' && !warnedCorsProd) {
          warnedCorsProd = true;
          console.warn(
            '[security] CORS_ORIGINS non défini — toutes origines autorisées. Définissez CORS_ORIGINS en production (ex. https://app.example.com).'
          );
        }
        return callback(null, true);
      }
      if (list.includes('*')) {
        return callback(null, true);
      }
      if (!origin) {
        return callback(null, true);
      }
      if (list.includes(origin)) {
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
