const allowedPages = [
  'login',
  'dashboard',
  'incidents',
  'risks',
  'actions',
  'iso',
  'audits',
  'sites',
  'products',
  'imports',
  'analytics',
  'performance',
  'ai-center',
  'activity-log',
  'settings'
];

export const appState = {
  currentPage: 'dashboard',
  /** Libellé affiché (topbar, contexte) */
  currentSite: 'Vue groupe (tous sites)',
  /** Id Prisma du site actif ; null = vue groupe (pas de filtre API) */
  activeSiteId: null,
  notificationsOpen: false
};

export function setCurrentPage(page) {
  if (allowedPages.includes(page)) {
    appState.currentPage = page;
  }
}

/**
 * @param {string | null | undefined} siteId — id Prisma ou vide pour la vue groupe
 * @param {string} [label] — libellé affiché
 */
export function setActiveSiteContext(siteId, label) {
  const trimmed =
    siteId != null && String(siteId).trim() !== '' ? String(siteId).trim() : null;
  appState.activeSiteId = trimmed;
  if (label && String(label).trim()) {
    appState.currentSite = String(label).trim();
  } else {
    appState.currentSite = trimmed ? 'Site' : 'Vue groupe (tous sites)';
  }
}

/** @deprecated Préférer setActiveSiteContext — conservé pour compatibilité lecture seule */
export function setActiveSite(siteLabel) {
  appState.currentSite = siteLabel;
  appState.activeSiteId = null;
}
