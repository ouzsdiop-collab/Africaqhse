import { TENANT_CONTEXT_REQUIRED_MESSAGE } from './tenantConstants.js';

/**
 * Filtres `tenantId` pour Prisma.
 *
 * Sur les routes **authentifiées**, `req.qhseTenantId` est renseigné par le middleware
 * (JWT `tid` + adhésion vérifiée). Ne pas s’appuyer sur une chaîne vide pour signifier
 * « tout le périmètre » dans ces chemins — utiliser `normalizeTenantId` et refuser si vide.
 */

/**
 * @param {string | null | undefined} tenantId
 * @returns {string} identifiant normalisé ou '' (= pas de filtre explicite)
 */
export function normalizeTenantId(tenantId) {
  if (tenantId == null || tenantId === '') return '';
  return String(tenantId).trim();
}

/**
 * Fragment `where` Prisma pour colonnes `tenantId`.
 * @returns {Record<string, never> | { tenantId: string }}
 */
export function prismaTenantFilter(tenantId) {
  const t = normalizeTenantId(tenantId);
  return t ? { tenantId: t } : {};
}

/**
 * Routes authentifiées : sans tenant explicite, `prismaTenantFilter` serait `{}` (fuite cross-tenant).
 * @returns {string | null} id tenant ou `null` si une réponse 403 a été envoyée
 */
export function requireTenantIdOrRespond(req, res) {
  const t = normalizeTenantId(req.qhseTenantId);
  if (!t) {
    res.status(403).json({ error: TENANT_CONTEXT_REQUIRED_MESSAGE });
    return null;
  }
  return t;
}
