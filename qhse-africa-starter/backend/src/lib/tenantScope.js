/**
 * V1 mono-tenant : `tenantId` optionnel sur les lignes métier.
 * Chaîne vide / null ⇒ pas de filtre Prisma sur `tenantId` (tout le périmètre).
 */

/**
 * @param {string | null | undefined} tenantId
 * @returns {string} identifiant normalisé ou '' (= pas de filtre tenant)
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
