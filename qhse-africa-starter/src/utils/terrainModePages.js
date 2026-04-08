/**
 * Pages accessibles en mode terrain : groupe Opérations + raccourcis pilotage.
 * Utilisé par shell (whitelist), sidebar, recherche topbar, barre mobile.
 */
export const TERRAIN_ALLOWED_PAGE_IDS = new Set([
  'terrain-mode',
  'dashboard',
  'incidents',
  'audits',
  'permits',
  'risks',
  'actions',
  'settings',
  'ai-center'
]);

/** Sous-ensemble « Opérations » (menu mobile / lanceur). */
export const TERRAIN_OPERATIONS_PAGE_IDS = [
  { id: 'incidents', label: 'Incidents' },
  { id: 'audits', label: 'Audits' },
  { id: 'risks', label: 'Risques' },
  { id: 'permits', label: 'PTW' },
  { id: 'actions', label: 'Actions' }
];

/** Barre fixe mobile (4 emplacements) : accueil terrain + opérations clés. */
export const TERRAIN_BOTTOM_NAV_ITEMS = [
  { id: 'terrain-mode', label: 'Accueil' },
  { id: 'incidents', label: 'Incidents' },
  { id: 'actions', label: 'Actions' },
  { id: 'audits', label: 'Audits' }
];
