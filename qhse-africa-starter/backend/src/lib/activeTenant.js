/**
 * Tenant actif résolu côté serveur.
 * - client normal: tenant JWT/membership
 * - SUPER_ADMIN en setup mode: tenant setup
 * - SUPER_ADMIN sans setup: null (accès /app refusé par requireTenantContext)
 */
export function getActiveTenantId(req) {
  const tid = typeof req?.qhseTenantId === 'string' ? req.qhseTenantId.trim() : '';
  return tid || null;
}
