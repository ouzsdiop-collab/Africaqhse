export const siteOptions = [
  'Site principal',
  'Site industriel',
  'Vue groupe multi-sites'
];

/**
 * Navigation latérale — 5 familles (usage responsable QHSE : pilotage → risques → conformité → terrain → admin).
 * Les `id` de page et l’ordre des items préservent le routage (#hash) et les permissions ; seule l’exposition change.
 * `collapsible` : sections repliables pour réduire le bruit quand un périmètre n’est pas utilisé au quotidien.
 */
export const navigationGroups = [
  {
    label: 'Pilotage',
    collapsible: true,
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: '◫' },
      { id: 'analytics', label: 'Analytics & synthèse', icon: '≈' },
      { id: 'performance', label: 'Performance QHSE', icon: '▤' },
      { id: 'activity-log', label: 'Journal', icon: '≣' },
      /* IA regroupée au pilotage : aide à la revue / synthèse, pas un « silo » produit séparé. */
      { id: 'ai-center', label: 'Centre IA', icon: '✦' }
    ]
  },
  {
    label: 'Maîtrise des risques',
    collapsible: true,
    items: [
      { id: 'risks', label: 'Risques', icon: '△' },
      { id: 'actions', label: 'Plan d’actions', icon: '✓' }
    ]
  },
  {
    label: 'Conformité',
    collapsible: true,
    items: [
      { id: 'iso', label: 'ISO & conformité', icon: '◎' },
      { id: 'audits', label: 'Audits', icon: '☑' },
      { id: 'products', label: 'Produits / FDS', icon: '⚗' },
      { id: 'habilitations', label: 'Habilitations', icon: '⛑' }
    ]
  },
  {
    label: 'Opérations',
    collapsible: true,
    items: [
      { id: 'incidents', label: 'Incidents', icon: '!' },
      { id: 'permits', label: 'Permits to work', icon: '⌁' }
    ]
  },
  {
    label: 'Administration',
    collapsible: false,
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
  'terrain-mode': {
    title: 'Mode terrain',
    kicker: 'Opérations terrain',
    subtitle: 'Accès direct aux actions essentielles chantier, sans complexité.',
    cta: { label: 'Déclarer incident', pageId: 'incidents' }
  },
  dashboard: {
    title: 'Tableau de bord',
    kicker: 'Pilotage',
    subtitle: 'Indicateurs critiques, alertes et priorités du jour, par organisation et par site.',
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
    kicker: 'Opérations terrain',
    subtitle: 'Suivi des événements, investigations et plans de correction.',
    cta: { label: 'Aller au plan d’actions', pageId: 'actions' }
  },
  permits: {
    title: 'Permits to Work',
    kicker: 'Opérations terrain',
    subtitle: 'Gestion terrain des permis de travail: création, checklist sécurité, validations et signatures.',
    cta: { label: 'Voir les incidents', pageId: 'incidents' }
  },
  risks: {
    title: 'Registre des risques',
    kicker: 'Maîtrise des risques',
    subtitle: 'Cartographie, criticité et traitements associés.',
    cta: { label: 'Plan d’actions', pageId: 'actions' }
  },
  actions: {
    title: 'Plan d’actions',
    kicker: 'Maîtrise des risques',
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
    kicker: 'Conformité',
    subtitle: 'Audits planifiés, constats et preuves documentaires.',
    cta: { label: 'Produits / FDS', pageId: 'products' }
  },
  products: {
    title: 'Produits / FDS',
    kicker: 'Conformité',
    subtitle: 'Fiches de données sécurité et registres produits.',
    cta: { label: 'ISO & Conformité', pageId: 'iso' }
  },
  habilitations: {
    title: 'Habilitations',
    kicker: 'Conformité',
    subtitle: 'Registre des habilitations terrain, sous-traitants, échéances et conformité multi-sites.',
    cta: { label: 'Voir les audits', pageId: 'audits' }
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
    kicker: 'Pilotage',
    subtitle: 'Assistants et analyses pilotées pour accélérer vos revues QHSE.',
    cta: { label: 'Retour dashboard', pageId: 'dashboard' }
  },
  'activity-log': {
    title: 'Journal',
    kicker: 'Pilotage',
    subtitle:
      'Traçabilité : piste session navigateur (filtres, exports) et journal serveur (API) dans un seul écran.',
    cta: { label: 'Audits', pageId: 'audits' }
  },
  settings: {
    title: 'Paramètres & configuration',
    kicker: 'Administration',
    subtitle:
      'Organisation, sécurité des accès, alertes, notifications, exports et options d’affichage — centralisez vos préférences métier.',
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
