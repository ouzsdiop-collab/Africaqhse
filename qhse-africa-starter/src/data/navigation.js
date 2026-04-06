export const siteOptions = [
  'Site principal',
  'Site industriel',
  'Vue groupe multi-sites'
];

export const navigationGroups = [
  {
    label: 'Pilotage',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '◫' },
      { id: 'analytics', label: 'Analytics / Synthèse', icon: '≈' },
      { id: 'performance', label: 'Performance QHSE', icon: '▤' },
      { id: 'activity-log', label: 'Journal', icon: '≣' }
    ]
  },
  {
    label: 'Opérations',
    items: [
      { id: 'audits', label: 'Audits', icon: '☑' },
      { id: 'incidents', label: 'Incidents', icon: '!' },
      { id: 'risks', label: 'Risques', icon: '△' },
      { id: 'actions', label: 'Actions', icon: '✓' }
    ]
  },
  {
    label: 'Conformité',
    items: [
      { id: 'iso', label: 'ISO & Conformité', icon: '◎' },
      { id: 'products', label: 'Produits / FDS', icon: '⚗' }
    ]
  },
  {
    label: 'IA',
    items: [{ id: 'ai-center', label: 'Centre IA', icon: '✦' }]
  },
  {
    label: 'Paramètres',
    items: [{ id: 'settings', label: 'Paramètres', icon: '⚙' }]
  }
];

/**
 * Entrées hors menu principal pour la palette de recherche shell.
 * Sites / imports : plus proposés ici (hors « modules » métier) — pages toujours joignables via #sites, #imports
 * et cartes Paramètres (mêmes routes et droits).
 */
const NAV_ORPHAN_SEARCH_ITEMS = [];

/** Métadonnées shell (topbar) — titres, fil d’Ariane perceptif, CTA principal */
export const pageTopbarById = {
  dashboard: {
    title: 'Cockpit QHSE',
    kicker: 'Pilotage',
    subtitle: 'Vue consolidée des indicateurs critiques, alertes et priorités du jour.',
    cta: { label: 'Voir les incidents', pageId: 'incidents' }
  },
  sites: {
    title: 'Sites & périmètres',
    kicker: 'Organisation',
    subtitle:
      'Référentiel des sites pour rattacher incidents, audits et actions à un périmètre réel (V1).',
    cta: { label: 'Voir les incidents', pageId: 'incidents' }
  },
  incidents: {
    title: 'Incidents terrain',
    kicker: 'Opérations',
    subtitle: 'Suivi des événements, investigations et plans de correction.',
    cta: { label: 'Aller au plan d’actions', pageId: 'actions' }
  },
  risks: {
    title: 'Registre des risques',
    kicker: 'Opérations',
    subtitle: 'Cartographie, criticité et traitements associés.',
    cta: { label: 'Plan d’actions', pageId: 'actions' }
  },
  actions: {
    title: 'Plan d’actions',
    kicker: 'Opérations',
    subtitle: 'Pilotez les actions correctives, préventives et le suivi des échéances.',
    cta: { label: 'Centre IA', pageId: 'ai-center' }
  },
  iso: {
    title: 'ISO & Conformité',
    kicker: 'Conformité',
    subtitle: 'Pilotage du SMS QHSE, référentiels, exigences et preuves pour audits et revue de direction.',
    cta: { label: 'Audits terrain', pageId: 'audits' }
  },
  audits: {
    title: 'Audits & conformité',
    kicker: 'Opérations',
    subtitle: 'Audits planifiés, constats et preuves documentaires.',
    cta: { label: 'Produits / FDS', pageId: 'products' }
  },
  products: {
    title: 'Produits / FDS',
    kicker: 'Conformité',
    subtitle: 'Fiches de données sécurité et registres produits.',
    cta: { label: 'ISO & Conformité', pageId: 'iso' }
  },
  imports: {
    title: 'Import de documents',
    kicker: 'Documents',
    subtitle: 'Chargement et aperçu brut des contenus (PDF, Excel) — base pour extraction intelligente ultérieure.',
    cta: { label: 'Centre IA', pageId: 'ai-center' }
  },
  analytics: {
    title: 'Analytics / Synthèse',
    kicker: 'Pilotage',
    subtitle:
      'Synthèse consolidée incidents, NC, actions, audits et alertes — base revue direction et rapports périodiques.',
    cta: { label: 'Dashboard', pageId: 'dashboard' }
  },
  performance: {
    title: 'Performance QHSE',
    kicker: 'Pilotage',
    subtitle:
      'Indicateurs clés, tendances et écarts à l’objectif — données issues des modules existants (synthèse, incidents, audits).',
    cta: { label: 'Analytics', pageId: 'analytics' }
  },
  'ai-center': {
    title: 'Centre IA',
    kicker: 'IA',
    subtitle: 'Assistants et analyses pilotées pour accélérer vos revues QHSE.',
    cta: { label: 'Retour dashboard', pageId: 'dashboard' }
  },
  'activity-log': {
    title: 'Journal',
    kicker: 'Pilotage',
    subtitle: 'Historique des changements et traçabilité opérationnelle.',
    cta: { label: 'Audits', pageId: 'audits' }
  },
  settings: {
    title: 'Paramètres & configuration',
    kicker: 'Paramètres',
    subtitle:
      'Organisation, alertes, notifications, exports, référentiels, règles IA et cycle de contrôle — préférences locales (démo) jusqu’à branchement API.',
    cta: { label: 'Centre IA', pageId: 'ai-center' }
  }
};

/**
 * Contexte de navigation pour fil d’Ariane / recherche.
 * @param {string} pageId
 * @returns {{ groupLabel: string; item: { id: string; label: string; icon: string } } | null}
 */
export function getNavContextForPage(pageId) {
  for (const group of navigationGroups) {
    const item = group.items.find((i) => i.id === pageId);
    if (item) return { groupLabel: group.label, item };
  }
  return null;
}

/**
 * Fil d’Ariane léger : racine → groupe → page courante.
 * @param {string} pageId
 */
export function getBreadcrumbForPage(pageId) {
  const meta = pageTopbarById[pageId];
  const ctx = getNavContextForPage(pageId);
  const currentTitle = meta?.title || ctx?.item?.label || 'Module';
  /** @type {{ label: string; pageId?: string | null }[]} */
  const crumbs = [{ label: 'Accueil', pageId: 'dashboard' }];
  if (ctx) {
    crumbs.push({ label: ctx.groupLabel, pageId: null });
  }
  crumbs.push({ label: currentTitle, pageId: null });
  return crumbs;
}

/**
 * Entrées indexées par la recherche shell : menu latéral + orphelins éventuels (sans doublon de pageId).
 */
export function getFlattenedNavItems() {
  const fromMenu = navigationGroups.flatMap((g) =>
    g.items.map((item) => ({
      ...item,
      groupLabel: g.label
    }))
  );
  return [...fromMenu, ...NAV_ORPHAN_SEARCH_ITEMS];
}
