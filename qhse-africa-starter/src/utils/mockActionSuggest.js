/**
 * Suggestion locale (assistant) pour création d’action · à valider terrain.
 */

/**
 * @param {{ title?: string, origin?: string, actionType?: string }} input
 */
export function mockSuggestActionContent(input) {
  const title = String(input?.title || 'Nouvelle action').trim() || 'Nouvelle action';
  const origin = String(input?.origin || 'other');
  const type = String(input?.actionType || 'corrective');

  const origLabel =
    origin === 'risk'
      ? 'un risque identifié'
      : origin === 'audit'
        ? 'un constat d’audit'
        : origin === 'incident'
          ? 'un incident'
          : 'le pilotage QHSE';

  const typeLabel =
    type === 'preventive'
      ? 'préventive'
      : type === 'improvement'
        ? 'd’amélioration'
        : 'corrective';

  return {
    description: `Action ${typeLabel} issue de ${origLabel} (« ${title} »).\n\nContexte (à compléter).\nDécrire la situation, les barrières existantes et l’écart observé.\n\nPérimètre.\nSite / zone / équipement concerné.\n\nCritère de clôture.\nIndicateur ou vérification terrain attendue.`,
    priority: origin === 'incident' || type === 'corrective' ? 'haute' : 'normale',
    progressHint: 0
  };
}
