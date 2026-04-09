function envTruthy(name) {
  const v = process.env[name];
  return v === 'true' || v === '1';
}

function envFalsy(name) {
  const v = process.env[name];
  return v === 'false' || v === '0';
}

export function getCorsMiddlewareOptions() {
  return {
    origin: true,
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

export function isXUserIdAllowed() {
  return true;
}
