import { TENANT_CONTEXT_REQUIRED_MESSAGE } from '../lib/tenantConstants.js';
import { normalizeTenantId } from '../lib/tenantScope.js';

/**
 * Chemins `/api` où l’absence de `req.qhseTenantId` est acceptable.
 * (Auth, santé, OpenAPI, téléchargement par jeton signé, analyse FDS sans persistance,
 * déclencheurs automation qui parcourent les tenants côté service.)
 *
 * @param {string} pathWithoutQuery — chemin sans query string
 */
export function isApiTenantOptionalPath(pathWithoutQuery) {
  const raw = String(pathWithoutQuery || '').split('?')[0];
  if (raw === '/api/health' || raw.startsWith('/api/health/')) return true;
  if (raw === '/api/auth' || raw.startsWith('/api/auth/')) return true;
  if (raw.startsWith('/api/docs')) return true;
  if (/^\/api\/controlled-documents\/stream\/?$/.test(raw)) return true;
  if (/^\/api\/fds\/analyze\/?$/.test(raw)) return true;
  if (raw === '/api/automation' || raw.startsWith('/api/automation/')) return true;
  return false;
}

/**
 * Impose un tenant résolu (`req.qhseTenantId`) sur les routes métier `/api/*`
 * pour éviter les filtres Prisma vides (fuite cross-tenant), y compris si
 * `REQUIRE_AUTH=false` et qu’aucun `qhseUser` n’est attaché.
 *
 * Les clients doivent envoyer un JWT avec organisation ou `X-User-Id` (hors production)
 * pour que `attachRequestUser` renseigne le tenant.
 */
export function requireTenantContext(req, res, next) {
  const raw = String(req.originalUrl || req.url || '').split('?')[0];

  if (!raw.startsWith('/api')) {
    return next();
  }

  if (isApiTenantOptionalPath(raw)) {
    return next();
  }

  if (!normalizeTenantId(req.qhseTenantId)) {
    return res.status(403).json({ error: TENANT_CONTEXT_REQUIRED_MESSAGE });
  }

  next();
}
