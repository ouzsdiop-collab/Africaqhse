/**
 * Identifiant du tenant créé par la migration `20260411120000_tenants_password_reset`.
 * Le seed réutilise ce même id pour rattacher sites et données démo.
 */
export const DEFAULT_TENANT_ID = 'qhse_default_tenant';

/** Corps JSON 403 lorsque `requireTenantContext` (ou équivalent) bloque sans organisation résolue. */
export const TENANT_CONTEXT_REQUIRED_MESSAGE = 'Contexte organisation requis.';
