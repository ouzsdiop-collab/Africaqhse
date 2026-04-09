const allowedPages = [
  'login',
  'dashboard',
  'terrain-mode',
  'incidents',
  'permits',
  'risks',
  'actions',
  'iso',
  'audits',
  'sites',
  'products',
  'habilitations',
  'imports',
  'analytics',
  'performance',
  'ai-center',
  'activity-log',
  'settings'
];

export const appState = {
  currentPage: 'dashboard',
  /** Après navigation `#audit-logs` ou équivalent : ouvrir l’onglet API sur la page Journal. */
  journalServerTabOnce: false,
  /** Libellé affiché (topbar, contexte) */
  currentSite: 'Vue groupe (tous sites)',
  /** Id Prisma du site actif ; null = vue groupe (pas de filtre API) */
  activeSiteId: null,
  notificationsOpen: false,
  /** Mode Complet uniquement — menu latéral en tiroir sur mobile */
  expertMobileNavOpen: false
};

export function setCurrentPage(page) {
  if (page === 'audit-logs') {
    appState.journalServerTabOnce = true;
  }
  const id = page === 'audit-logs' ? 'activity-log' : page;
  if (allowedPages.includes(id)) {
    appState.currentPage = id;
  }
}

/** @returns {boolean} */
export function consumeJournalServerTabIntent() {
  const v = appState.journalServerTabOnce;
  appState.journalServerTabOnce = false;
  return v;
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
