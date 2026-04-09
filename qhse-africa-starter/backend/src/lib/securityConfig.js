export function getCorsMiddlewareOptions() {
  return {
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-User-Id', 'X-Request-Id']
  };
}

export function isRequireAuthEnabled() {
  return false;
}

export function isXUserIdAllowed() {
  return true;
}
