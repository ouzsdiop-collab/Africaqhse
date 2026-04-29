function envTruthy(name) {
  const v = process.env[name];
  return v === 'true' || v === '1';
}

function envFalsy(name) {
  const v = process.env[name];
  return v === 'false' || v === '0';
}

export function getCorsMiddlewareOptions() {
  // Priorité : CORS_ORIGINS (nouvelle variable). ALLOWED_ORIGINS reste en fallback.
  const raw = process.env.CORS_ORIGINS || process.env.ALLOWED_ORIGINS || '';
  const whitelist = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const devDefaults = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const origins = whitelist.length > 0 ? whitelist : devDefaults;

  if (process.env.NODE_ENV === 'production' && whitelist.length === 0) {
    throw new Error(
      '[CORS] CORS_ORIGINS/ALLOWED_ORIGINS est vide en production — definissez-la dans les variables Railway.'
    );
  }

  return {
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (origins.includes(origin)) return callback(null, true);
      callback(new Error(`CORS : origine non autorisee — ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Request-Id']
  };
}

/**
 * REQUIRE_AUTH=false : pas d’utilisateur obligatoire (démo / dev).
 * REQUIRE_AUTH=true : auth obligatoire.
 * Non défini : production → true, sinon false (compat starter local).
 */
export function isRequireAuthEnabled() {
  if (envFalsy('REQUIRE_AUTH')) return false;
  if (envTruthy('REQUIRE_AUTH')) return true;
  return process.env.NODE_ENV === 'production';
}

/**
 * En-tête `X-User-Id` (bootstrap dev) : désactivé en production sauf si
 * `ALLOW_X_USER_ID=true`. En développement, désactivable avec `ALLOW_X_USER_ID=false`.
 */
export function isXUserIdAllowed() {
  if (envTruthy('ALLOW_X_USER_ID')) return true;
  if (envFalsy('ALLOW_X_USER_ID')) return false;
  return process.env.NODE_ENV !== 'production';
}

/**
 * Hébergeur « managé » (Railway, Render, Cloud Run, etc.) : même hors NODE_ENV=production,
 * on refuse REQUIRE_AUTH=false et ALLOW_X_USER_ID=true pour éviter une préprod publique ouverte.
 */
function envPresent(name) {
  const v = process.env[name];
  return v != null && String(v).trim() !== '';
}

export function isManagedCloudRuntime() {
  if (envTruthy('MANAGED_CLOUD')) return true;
  if (envPresent('RAILWAY_ENVIRONMENT') || envPresent('RAILWAY_PROJECT_ID')) return true;
  if (envPresent('RENDER')) return true;
  if (envPresent('FLY_APP_NAME')) return true;
  if (envPresent('K_SERVICE')) return true;
  if (envPresent('VERCEL')) return true;
  if (envPresent('NETLIFY')) return true;
  if (envPresent('CF_PAGES')) return true;
  if (envPresent('AWS_EXECUTION_ENV')) return true;
  return false;
}

/**
 * Affiche un avertissement stderr très visible si l’API tourne sans auth obligatoire (hors prod déjà bloquée).
 */
export function formatRequireAuthDisabledBanner() {
  const lines = [
    '',
    '********************************************************************************',
    '* [SECURITY] REQUIRE_AUTH est désactivé : l’API accepte des requêtes sans JWT.',
    '* Utilisation UNIQUEMENT sur machine locale / réseau de confiance.',
    '* Ne jamais exposer cette configuration sur Internet.',
    '********************************************************************************',
    ''
  ];
  return lines.join('\n');
}
