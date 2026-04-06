/**
 * Périmètre site (préparation multi-site / SaaS) — désactivé par défaut pour compatibilité.
 * Activez ENFORCE_SITE_SCOPE ou ENFORCE_DOCUMENT_SITE_SCOPE une fois le front aligné.
 */

function envTruthy(name) {
  const v = process.env[name];
  return v === 'true' || v === '1';
}

export function isEnforceSiteScopeForQueriesEnabled() {
  return envTruthy('ENFORCE_SITE_SCOPE');
}

export function isEnforceDocumentSiteScopeEnabled() {
  return envTruthy('ENFORCE_DOCUMENT_SITE_SCOPE');
}

/**
 * @param {{ role?: string, defaultSiteId?: string | null } | null | undefined} user
 * @param {string | null | undefined} siteId
 */
export function canUserAccessSiteId(user, siteId) {
  if (!siteId) return true;
  if (!user) return true;
  const role = String(user.role ?? '')
    .trim()
    .toUpperCase();
  if (role === 'ADMIN' || role === 'QHSE') return true;
  const ds = user.defaultSiteId != null ? String(user.defaultSiteId).trim() : '';
  if (!ds) return true;
  return ds === String(siteId).trim();
}

/**
 * @param {{ role?: string, defaultSiteId?: string | null } | null | undefined} user
 * @param {string | null | undefined} querySiteId — ex. ?siteId=
 */
export function assertQuerySiteAllowed(user, querySiteId) {
  if (!isEnforceSiteScopeForQueriesEnabled()) return;
  if (!querySiteId) return;
  if (!canUserAccessSiteId(user, querySiteId)) {
    const err = new Error('Périmètre site non autorisé pour ce profil.');
    err.statusCode = 403;
    throw err;
  }
}

/**
 * @param {{ role?: string, defaultSiteId?: string | null } | null | undefined} user
 * @param {string | null | undefined} documentSiteId
 */
export function assertDocumentSiteAllowed(user, documentSiteId) {
  if (!isEnforceDocumentSiteScopeEnabled()) return;
  if (!documentSiteId) return;
  if (!canUserAccessSiteId(user, documentSiteId)) {
    const err = new Error('Accès document refusé pour ce périmètre site.');
    err.statusCode = 403;
    throw err;
  }
}
