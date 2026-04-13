function envTruthy(name) {
  const v = process.env[name];
  return v === 'true' || v === '1';
}

function envFalsy(name) {
  const v = process.env[name];
  return v === 'false' || v === '0';
}

export function getCorsMiddlewareOptions() {
  const raw = process.env.ALLOWED_ORIGINS || '';
  const whitelist = raw
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const devDefaults = ['http://localhost:5173', 'http://127.0.0.1:5173'];
  const origins = whitelist.length > 0 ? whitelist : devDefaults;

  if (process.env.NODE_ENV === 'production' && whitelist.length === 0) {
    throw new Error(
      '[CORS] ALLOWED_ORIGINS est vide en production — definissez-la dans les variables Railway.'
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
