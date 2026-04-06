/**
 * Lexique opérationnel par famille de clauses (thèmes SMS / ISO 9001·14001·45001).
 * Formulations génériques — pas de reprise de texte normatif propriétaire.
 * Sert uniquement au moteur d’aide locale (recoupement mots-clés).
 */

/** @type {Record<string, Record<string, string[]>>} */
export const CLAUSE_HINTS_BY_NORM = {
  iso9001: {
    default: ['qualité', 'satisfaction', 'client', 'processus', 'documentation', 'revue'],
    '4': ['contexte', 'parties', 'intéressées', 'périmètre', 'sms'],
    '5': ['politique', 'engagement', 'direction', 'rôles'],
    '6': ['planification', 'risques', 'opportunités', 'objectifs'],
    '7': ['ressources', 'compétence', 'formation', 'infrastructure'],
    '7.1.5': ['mesure', 'étalonnage', 'équipement', 'surveillance'],
    '8': ['réalisation', 'exécution', 'contrôle', 'livraison'],
    '9': ['performance', 'indicateur', 'suivi', 'mesure', 'analyse', 'revue'],
    '9.1': ['indicateur', 'données', 'analyse', 'performance'],
    '9.1.1': ['processus', 'indicateur', 'performance', 'mesure', 'suivi'],
    '10': ['amélioration', 'nc', 'correctif', 'préventif'],
    '10.2': ['non conformité', 'corrective', 'cause', 'action', 'efficacité']
  },
  iso14001: {
    default: ['environnement', 'impact', 'pollution', 'réglementation', 'maîtrise'],
    '6': ['aspect', 'impact', 'significatif', 'environnemental'],
    '6.1.2': ['aspect', 'impact', 'environnement', 'matrice'],
    '8': ['exploitation', 'prévention', 'déchet', 'rejet', 'énergie'],
    '8.1': ['opérationnel', 'procédure', 'maîtrise', 'déchet'],
    '9': ['surveillance', 'mesure', 'conformité', 'réglementaire'],
    '9.1.1': ['surveillance', 'mesure', 'indicateur', 'environnement'],
    '10': ['amélioration', 'nc', 'incident', 'environnemental']
  },
  iso45001: {
    default: ['sst', 'sécurité', 'santé', 'travail', 'danger', 'risque'],
    '6': ['danger', 'risque', 'ddr', 'évaluation', 'maîtrise'],
    '6.1.2': ['danger', 'risque', 'ddr', 'poste', 'habilitation'],
    '8': ['exploitation', 'planification', 'sous-traitant'],
    '8.1.3': ['changement', 'gmc', 'organisation', 'équipement'],
    '9': ['surveillance', 'sst', 'mesure', 'inspection'],
    '10': ['incident', 'nc', 'corrective', 'enquête'],
    '10.2': ['incident', 'événement', 'corrective', 'enquête']
  }
};

/**
 * @param {string} normId — ex. iso9001
 * @param {string} clause — ex. 9.1.1
 * @returns {string[]}
 */
export function resolveClauseHints(normId, clause) {
  const id = String(normId || '').toLowerCase().trim();
  const table = CLAUSE_HINTS_BY_NORM[id] || CLAUSE_HINTS_BY_NORM.iso9001;
  const c = String(clause || '').trim();
  if (!c) return [...(table.default || [])];
  const parts = c.split(/[\s.]+/).filter(Boolean);
  const numericParts = parts[0]?.match(/^[\d.]+$/) ? parts[0].split('.') : [];
  if (numericParts.length) {
    for (let len = numericParts.length; len >= 1; len -= 1) {
      const key = numericParts.slice(0, len).join('.');
      if (Array.isArray(table[key]) && table[key].length) {
        return [...new Set([...table[key], ...(table.default || [])])];
      }
    }
  }
  return [...(table.default || [])];
}
