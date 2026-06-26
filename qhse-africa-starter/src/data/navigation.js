export const siteOptions = [
  'Site principal',
  'Site industriel',
  'Vue groupe multi-sites'
];

/**
 * Navigation latérale : 5 familles (usage responsable QHSE : pilotage → risques → conformité → terrain → admin).
 * Les `id` de page et l’ordre des items préservent le routage (#hash) et les permissions ; seule l’exposition change.
 * `collapsible` : sections repliables pour réduire le bruit quand un périmètre n’est pas utilisé au quotidien.
 */
export const navigationGroups = [
  {
    label: 'Pilotage',
    collapsible: true,
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: '◫' },
      { id: 'processes', label: 'Pilotage des processus', icon: '⟳' },
      { id: 'analytics', label: 'Analyses & synthèse', icon: '≈' },
      { id: 'performance', label: 'Performance QHSE', icon: '▤' },
      { id: 'activity-log', label: 'Journal', icon: '≣' },
      /* IA regroupée au pilotage : aide à la revue / synthèse, pas un « silo » produit séparé. */
      { id: 'ai-center', label: 'Synthèse et assist.', icon: '✦' }
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
    label: 'Conformité réglementaire',
    collapsible: true,
    items: [
      { id: 'iso', label: 'ISO & conformité', icon: '◎' },
      { id: 'audits', label: 'Audits', icon: '☑' },
      { id: 'regulatory-watch', label: 'Veille réglementaire', icon: '📜' }
    ]
  },
  {
    label: 'Ressources & compétences',
    collapsible: true,
    items: [
      { id: 'habilitations', label: 'Habilitations', icon: '⛑' },
      { id: 'equipment', label: 'Équipements / EPI', icon: '🥽' },
      { id: 'equipment-signalements', label: 'Signalements terrain', icon: '🔧', resource: 'equipment_signalements' },
      { id: 'trainings', label: 'Formations', icon: '🎓' }
    ]
  },
  {
    label: 'Produits & environnement',
    collapsible: true,
    items: [
      { id: 'products', label: 'Produits / FDS', icon: '⚗' },
      { id: 'environmental', label: 'Environnement', icon: '🌍' }
    ]
  },
  {
    label: 'Opérations',
    collapsible: true,
    items: [
      { id: 'incidents', label: 'Incidents', icon: '!' },
      { id: 'near-misses', label: 'Presque-accidents', icon: '⚠' },
      { id: 'permits', label: 'Permis de travail', icon: '⌁' },
      { id: 'prevention-plans', label: 'Plans de prévention', icon: '🤝' }
    ]
  },
  {
    label: 'Administration',
    collapsible: false,
    items: [
      { id: 'settings', label: 'Paramètres', icon: '⚙' },
      { id: 'saas-clients', label: 'Clients SaaS', icon: '◈' }
    ]
  }
];

/**
 * Entrées hors menu principal pour la palette de recherche shell.
 * Sites / imports : plus proposés ici (hors « modules » métier). Pages toujours joignables via #sites, #imports
 * et cartes Paramètres (mêmes routes et droits).
 */
const NAV_ORPHAN_SEARCH_ITEMS = [];

/** Métadonnées shell (topbar) : titres, fil d’Ariane perceptif, CTA principal */
export const pageTopbarById = {
  'terrain-mode': {
    title: 'Accueil Essentiel',
    kicker: 'Mode global Essentiel',
    subtitle: 'Raccourcis incident, risque, actions. Même bascule « Essentiel » que la barre du haut.',
    cta: { label: 'Déclarer incident', pageId: 'incidents' }
  },
  dashboard: {
    title: 'Tableau de bord',
    kicker: 'Pilotage',
    subtitle: 'Retards d’actions, incidents récents, NC et audits : vue du jour par organisation et par site.',
    cta: { label: 'Voir les incidents', pageId: 'incidents' }
  },
  'mines-demo': {
    title: 'Démo spéciale mines',
    kicker: 'Pilotage',
    subtitle:
      'Parcours express orienté site minier : dashboard, PTW, habilitations, incidents, risques et synthèse direction.',
    cta: { label: 'Lancer le parcours', pageId: 'dashboard' }
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
    subtitle: 'Fiches événement, gravité, causes et actions liées jusqu’à clôture.',
    cta: { label: 'Aller au plan d’actions', pageId: 'actions' }
  },
  'near-misses': {
    title: 'Presque-accidents',
    kicker: 'Opérations terrain',
    subtitle: 'Registre des presque-accidents et retours d’expérience : analyse et enseignements avant qu’un incident ne survienne.',
    cta: { label: 'Voir les incidents', pageId: 'incidents' }
  },
  permits: {
    title: 'Permis de travail',
    kicker: 'Opérations terrain',
    subtitle:
      'Gestion terrain des permis de travail : création, checklist sécurité, validations et signatures.',
    cta: { label: 'Voir les incidents', pageId: 'incidents' }
  },
  risks: {
    title: 'Registre des risques',
    kicker: 'Maîtrise des risques',
    subtitle: 'Cotation G×P, mesures de maîtrise et liens vers les actions ouvertes.',
    cta: { label: 'Plan d’actions', pageId: 'actions' }
  },
  actions: {
    title: 'Plan d’actions',
    kicker: 'Maîtrise des risques',
    subtitle: 'Suivi des actions correctives et préventives, responsables et dates cibles.',
    cta: { label: 'Synthèse et assist.', pageId: 'ai-center' }
  },
  iso: {
    title: 'ISO & Conformité',
    kicker: 'Conformité',
    subtitle: 'Exigences par norme, statuts, pièces jointes et historique pour audit interne ou revue de direction.',
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
  equipment: {
    title: 'Équipements / EPI',
    kicker: 'Conformité',
    subtitle: 'Registre des équipements et EPI : contrôles périodiques, péremption, affectation.',
    cta: { label: 'Voir les habilitations', pageId: 'habilitations' }
  },
  'equipment-signalements': {
    title: 'Signalements terrain',
    kicker: 'Terrain',
    subtitle: 'Signalements équipement remontés depuis le mode terrain : à valider ou rejeter.',
    cta: { label: 'Voir les équipements', pageId: 'equipment' }
  },
  trainings: {
    title: 'Formations',
    kicker: 'Conformité',
    subtitle: 'Catalogue de formations, sessions planifiées, inscriptions et alertes de recyclage.',
    cta: { label: 'Voir les habilitations', pageId: 'habilitations' }
  },
  'prevention-plans': {
    title: 'Plans de prévention',
    kicker: 'Opérations',
    subtitle: 'Coactivité avec les entreprises extérieures : inspection commune, risques d’interférence et signatures.',
    cta: { label: 'Voir les permis de travail', pageId: 'permits' }
  },
  'regulatory-watch': {
    title: 'Veille réglementaire',
    kicker: 'Conformité',
    subtitle: 'Registre des textes légaux/normatifs suivis pour votre pays, résumé assisté par IA validé manuellement.',
    cta: { label: 'Voir ISO & conformité', pageId: 'iso' }
  },
  environmental: {
    title: 'Environnement',
    kicker: 'Conformité',
    subtitle: 'Suivi des déchets, de l’eau et de l’énergie par site : relevés périodiques et synthèse par type.',
    cta: { label: 'Voir les sites', pageId: 'sites' }
  },
  imports: {
    title: 'Import de documents',
    kicker: 'Documents',
    subtitle:
      'Import de fichiers (CSV, PDF, tableur) et contrôle visuel avant traitement ou reprise manuelle.',
    cta: { label: 'Synthèse et assist.', pageId: 'ai-center' }
  },
  processes: {
    title: 'Pilotage des processus',
    kicker: 'Pilotage',
    subtitle:
      'Cartographie des processus reliés à leurs pilotes, documents, risques, actions, audits et preuves ISO, avec un score de maîtrise par processus.',
    cta: { label: 'Tableau de bord', pageId: 'dashboard' }
  },
  analytics: {
    title: 'Analyses / Synthèse',
    kicker: 'Pilotage',
    subtitle:
      'Incidents, NC, actions et audits sur une même période. Utile pour un rapport mensuel ou une revue de direction.',
    cta: { label: 'Tableau de bord', pageId: 'dashboard' }
  },
  performance: {
    title: 'Performance QHSE',
    kicker: 'Pilotage',
    subtitle:
      'Tendances et écarts par rapport aux objectifs affichés (saisis côté interface, pas de cible serveur imposée).',
    cta: { label: 'Analyses & synthèse', pageId: 'analytics' }
  },
  'ai-center': {
    title: 'Synthèse et assistance',
    kicker: 'Pilotage',
    subtitle: 'Textes et brouillons à relire avant envoi. Rien n’est enregistré dans les modules sans validation explicite.',
    cta: { label: 'Retour tableau de bord', pageId: 'dashboard' }
  },
  'activity-log': {
    title: 'Journal',
    kicker: 'Pilotage',
    subtitle:
      'Filtres et exports sur l’activité en session, plus extraits du journal serveur lorsque l’API est disponible.',
    cta: { label: 'Audits', pageId: 'audits' }
  },
  settings: {
    title: 'Paramètres & configuration',
    kicker: 'Administration',
    subtitle:
      'Organisation, rôles, alertes, e-mail, exports et préférences d’affichage pour votre périmètre.',
    cta: { label: 'Synthèse et assist.', pageId: 'ai-center' }
  },
  'saas-clients': {
    title: 'Clients SaaS',
    kicker: 'Super administration',
    subtitle:
      'Cockpit entreprises et utilisateurs : statut, modules, rôles et mots de passe provisoires (affichage unique).',
    cta: { label: 'Paramètres', pageId: 'settings' }
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
