/**
 * Analyse risque — règles par mots-clés + enrichissement OpenAI optionnel
 * (AI_ALLOW_EXTERNAL=true + OPENAI_API_KEY, voir aiProvider.service.js).
 * Sortie en français, lisible pour le formulaire terrain.
 */

import { requestJsonCompletion, isExternalAiEnabled } from './aiProvider.service.js';

const LEVEL_VALUES = new Set(['élevée', 'moyenne', 'faible']);
const CATEGORY_VALUES = new Set(['Sécurité', 'Environnement', 'Qualité', 'Autre']);

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
      /\bintoxication\b/,
      /\bespace[\s-]?confin[eé]\b/,
      /\bconfined\b/,
      /\blevage\b/,
      /\bgrue\b/,
      /\bpalan\b/,
      /\barc[\s-]?(flash|électrique)\b/,
      /\bcontact[\s-]?direct\b.*\bcourant\b/,
      /\bmanutention\b.*\blourde?\b/,
      /\bpsychosocial\b/,
      /\bharc[eè]lement\b/,
      /\bstress\b.*\bcharge\b/
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
      /\bbiodiversit/,
      /\bstockage[\s-]?non[\s-]?conforme\b/,
      /\bcontamination\b.*\b(crois[eé]e|croisee)\b/
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

/**
 * Pistes causes / impacts (règles — à recouper sur le terrain).
 * @param {string} category
 * @param {string} severity
 * @param {string} probability
 * @param {string} t — texte normalisé
 */
function inferCausesImpacts(category, severity, probability, t) {
  const high = severity === 'élevée' || probability === 'élevée';
  /** @type {string[]} */
  const causeBits = [];
  /** @type {string[]} */
  const impactBits = [];

  if (/\bchute\b|hauteur|échafaud|echafaud/.test(t)) {
    causeBits.push('conditions d’accès / garde-corps / ancrages à vérifier');
    impactBits.push('blessures, arrêts, enquête SST');
  }
  if (/\bengin|vh[eé]cule|manutention|levage|grue/.test(t)) {
    causeBits.push('coactivité, visibilité, signalisation, stabilité des sols');
    impactBits.push('chocs, renversements, dommages matériels');
  }
  if (/\bfeu|incendie|explosion|arc/.test(t)) {
    causeBits.push('sources d’ignition, ATEX, moyens de secours');
    impactBits.push('blessés graves, arrêt d’exploitation, impacts environnementaux');
  }
  if (/\bconfine|espace\s+restreint/.test(t)) {
    causeBits.push('atmosphère, ventilation, consignation, équipe de secours');
    impactBits.push('intoxication, asphyxie, intervention d’urgence');
  }
  if (/\bdeverse|fuite|hydrocarbure|rétention|retention/.test(t)) {
    causeBits.push('étanchéité, surstockage, maintenance des équipements');
    impactBits.push('pollution sols/eaux, sanctions, coûts de traitement');
  }
  if (/\bnon[\s-]?conform|qualit[eé]|tra[cç]abilit/.test(t)) {
    causeBits.push('écarts procédure, formation, contrôles insuffisants');
    impactBits.push('non-conformité client / réglementaire, rappel éventuel');
  }
  if (/\bpsychosocial|stress|harcel/.test(t)) {
    causeBits.push('charge de travail, organisation, climat social');
    impactBits.push('absentéisme, turnover, plaintes');
  }

  if (!causeBits.length) {
    if (category === 'Sécurité') {
      causeBits.push('facteurs humains, matériels et organisationnels à préciser en revue');
      impactBits.push(
        high ? 'blessures potentielles graves, arrêt d’activité' : 'incidents de gravité variable'
      );
    } else if (category === 'Environnement') {
      causeBits.push('défaillance technique ou dérive de pratiques de stockage / transfert');
      impactBits.push('atteinte environnementale, obligations de déclaration selon gravité');
    } else if (category === 'Qualité') {
      causeBits.push('dérive process ou contrôle insuffisant sur le périmètre concerné');
      impactBits.push('non-conformité produit ou service, réclamation');
    } else {
      causeBits.push('contexte site et causes à structurer avec les parties prenantes');
      impactBits.push('impacts à dimensionner selon activité');
    }
  } else if (!impactBits.length) {
    impactBits.push(high ? 'impacts potentiellement majeurs pour QHSE et exploitation' : 'impacts à confirmer selon criticité');
  }

  return {
    causes: causeBits.slice(0, 3).join(' ; ') + ' — à valider en équipe.',
    impacts: impactBits.slice(0, 3).join(' ; ') + ' — à adapter au site.'
  };
}

/** @param {string} text */
function normalizeForMatch(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{M}/gu, '');
}

/**
 * @param {string} description
 * @returns {{ category: string, severity: string, probability: string, suggestedActions: string[], causes: string, impacts: string }}
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
  const { causes, impacts } = inferCausesImpacts(category, severity, probability, t);

  return {
    category,
    severity,
    probability,
    suggestedActions,
    causes,
    impacts
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

/**
 * @param {Record<string, unknown>} parsed
 * @param {{ category: string, severity: string, probability: string, suggestedActions: string[], causes: string, impacts: string }} local
 */
function mergeLlmRiskAnalysis(parsed, local) {
  const catRaw = typeof parsed.category === 'string' ? parsed.category.trim() : '';
  const category = CATEGORY_VALUES.has(catRaw) ? catRaw : local.category;

  const sevRaw = typeof parsed.severity === 'string' ? parsed.severity.trim() : '';
  const severity = LEVEL_VALUES.has(sevRaw) ? sevRaw : local.severity;

  const probRaw = typeof parsed.probability === 'string' ? parsed.probability.trim() : '';
  const probability = LEVEL_VALUES.has(probRaw) ? probRaw : local.probability;

  let suggestedActions = local.suggestedActions;
  if (Array.isArray(parsed.suggestedActions)) {
    const lines = parsed.suggestedActions
      .map((x) => String(x ?? '').trim())
      .filter(Boolean)
      .slice(0, 5);
    if (lines.length) suggestedActions = lines;
  }

  const causes =
    typeof parsed.causes === 'string' && parsed.causes.trim()
      ? parsed.causes.trim().slice(0, 2000)
      : local.causes;
  const impacts =
    typeof parsed.impacts === 'string' && parsed.impacts.trim()
      ? parsed.impacts.trim().slice(0, 2000)
      : local.impacts;

  return { category, severity, probability, suggestedActions, causes, impacts };
}

/**
 * Analyse avec règles puis, si activé, passage par le modèle distant (JSON strict).
 * @param {string} description
 * @returns {Promise<{
 *   category: string,
 *   severity: string,
 *   probability: string,
 *   suggestedActions: string[],
 *   causes: string,
 *   impacts: string,
 *   provider: 'openai' | 'rules',
 *   llmError?: string
 * }>}
 */
export async function analyzeRiskDescriptionAsync(description) {
  const local = analyzeRiskDescription(description);

  if (!isExternalAiEnabled()) {
    return { ...local, provider: 'rules' };
  }

  const excerpt = String(description).trim().slice(0, 7500);
  const sys = `Tu es un expert QHSE (ISO 45001, 14001, 9001). On te donne la description d'un risque opérationnel en français.
Réponds uniquement par un objet JSON (pas de markdown) avec exactement ces clés :
- "category" : une parmi "Sécurité", "Environnement", "Qualité", "Autre"
- "severity" : une parmi "élevée", "moyenne", "faible" (gravité potentielle)
- "probability" : une parmi "élevée", "moyenne", "faible"
- "suggestedActions" : tableau de 3 à 5 chaînes, mesures concrètes et réalisables
- "causes" : une chaîne, pistes de causes (à valider en équipe)
- "impacts" : une chaîne, impacts possibles (à adapter au site)
Reste factuel, sans inventer de chiffres ni de noms propres non présents dans le texte.`;

  const ext = await requestJsonCompletion({
    system: sys,
    user: excerpt
  });

  if (!ext.rawText) {
    return {
      ...local,
      provider: 'rules',
      ...(ext.error ? { llmError: ext.error.slice(0, 500) } : {})
    };
  }

  try {
    const parsed = JSON.parse(ext.rawText);
    const merged = mergeLlmRiskAnalysis(parsed, local);
    return { ...merged, provider: 'openai' };
  } catch {
    return { ...local, provider: 'rules', llmError: 'Réponse LLM non JSON' };
  }
}
