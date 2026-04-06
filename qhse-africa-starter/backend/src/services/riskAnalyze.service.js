/**
 * Analyse V1 — règles par mots-clés (pas d’appel modèle externe).
 * Sortie en français, lisible pour le formulaire terrain.
 */

const CATEGORY_RULES = [
  {
    category: 'Sécurité',
    patterns: [
      /\bchute\b/,
      /\bblessure\b/,
      /\baccident\b/,
      /\bquasi[\s-]?accident\b/,
      /\bincendie\b/,
      /\bexplosion\b/,
      /\belectrocution\b/,
      /\bengin\b/,
      /\bvehicule\b/,
      /\bvh[eé]cule\b/,
      /\brenversement\b/,
      /\bcollision\b/,
      /\btravail[\s-]?en[\s-]?hauteur\b/,
      /\bepi\b/,
      /\b[eé]quipement[\s-]?de[\s-]?protection\b/,
      /\bmachine\b/,
      /\bconvoyeur\b/,
      /\btranchee\b/,
      /\btranch[eé]e\b/,
      /\beffondrement\b/,
      /\bgaz\b.*\btoxique\b/,
      /\bintoxication\b/
    ]
  },
  {
    category: 'Environnement',
    patterns: [
      /\bpollution\b/,
      /\bdeversement\b/,
      /\bd[eé]versement\b/,
      /\bhydrocarbure\b/,
      /\bfuite\b/,
      /\br[eé]tention\b/,
      /\bbassin\b/,
      /\bdechets?\b/,
      /\bd[eé]chets?\b/,
      /\bnappe\b/,
      /\bsol\b.*\bcontamin/,
      /\beau\b.*\bsurface\b/,
      /\bbruit\b/,
      /\bpoussi[eè]re\b/,
      /\bemission\b/,
      /\b[eé]missions?\b/,
      /\bbiodiversit/
    ]
  },
  {
    category: 'Qualité',
    patterns: [
      /\bprocedure\b/,
      /\bproc[eé]dure\b/,
      /\berreur\b/,
      /\bnon[\s-]?conformit/,
      /\bnc\b/,
      /\bqualit[eé]\b/,
      /\bdocument\b/,
      /\btra[cç]abilit[eé]\b/,
      /\baudit\b/,
      /\bmesure\b/,
      /\bcalibrage\b/,
      /\bsp[eé]cification\b/,
      /\blot\b/,
      /\b[eé]chantillon\b/
    ]
  }
];

const SEV_HIGH = /\b(grave|mort|critique|fatal|catastroph|d[eé]c[eè]s|bless[eé]\s*grave|tr[eè]s\s*grave)\b/;
const SEV_LOW =
  /\b(faible|mineur|mineure|n[eé]gligeable|sans[\s-]?gravite|sans[\s-]?gravit[eé])\b/;

const PROB_HIGH =
  /\b(frequent|frequente|frequemment|fr[eé]quent|fr[eé]quente|souvent|quotidien|quotidienne|syst[eé]matique|r[eé]current|chaque\s+jour|tous\s+les\s+jours)\b/;
const PROB_LOW =
  /\b(rare|exceptionnel|exceptionnelle|improbable|peu[\s-]?fr[eé]quent|occasionnel)\b/;

/** @param {string} text */
function normalizeForMatch(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/**
 * @param {string} description
 * @returns {{ category: string, severity: string, probability: string, suggestedActions: string[] }}
 */
export function analyzeRiskDescription(description) {
  const t = normalizeForMatch(description);

  let category = 'Autre';
  for (const rule of CATEGORY_RULES) {
    if (rule.patterns.some((re) => re.test(t))) {
      category = rule.category;
      break;
    }
  }

  let severity = 'moyenne';
  if (SEV_HIGH.test(t)) severity = 'élevée';
  else if (SEV_LOW.test(t)) severity = 'faible';

  let probability = 'moyenne';
  if (PROB_HIGH.test(t)) probability = 'élevée';
  else if (PROB_LOW.test(t)) probability = 'faible';

  const suggestedActions = buildSuggestedActions(category, severity, probability);

  return {
    category,
    severity,
    probability,
    suggestedActions
  };
}

/**
 * @param {string} category
 * @param {string} severity
 * @param {string} probability
 */
function buildSuggestedActions(category, severity, probability) {
  const high = severity === 'élevée' || probability === 'élevée';
  const base = [];

  if (category === 'Sécurité') {
    base.push('Identifier la zone et les personnes exposées ; sécuriser l’accès si besoin.');
    base.push('Vérifier EPI, consignes et habilitations des intervenants.');
    if (high) {
      base.push('Engager une action corrective prioritaire et informer la hiérarchie / QHSE.');
    }
  } else if (category === 'Environnement') {
    base.push('Contrôler l’étanchéité, la rétention et les moyens d’absorption disponibles.');
    base.push('Documenter constats, photos et volumes estimés pour la traçabilité.');
    if (high) {
      base.push('Isoler la zone, limiter la propagation et prévenir les autorités si le seuil l’exige.');
    }
  } else if (category === 'Qualité') {
    base.push('Vérifier les exigences applicables (procédure, spécification, lot concerné).');
    base.push('Tracer les causes probables et les impacts sur la conformité produit / service.');
    if (high) {
      base.push('Mettre en quarantaine / contrôle renforcé jusqu’à décision documentée.');
    }
  } else {
    base.push('Compléter l’analyse avec le contexte site, les causes et les parties prenantes.');
    base.push('Associer QHSE pour classer le risque et prioriser les mesures.');
  }

  base.push('Valider manuellement les mesures avant enregistrement définitif.');

  return base.slice(0, 5);
}
