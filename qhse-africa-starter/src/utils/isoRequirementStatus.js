/**
 * Normalise les statuts d’exigence ISO (FR attendu + variantes anglaises API / imports).
 */

/** Clés anglaises éventuelles → libellé français affiché dans le levier conformité. */
export const ISO_REQ_STATUS_EN_FR = {
  pending: 'En attente',
  review: 'En révision',
  draft: 'Brouillon',
  approved: 'Approuvé',
  missing: 'Manquant',
  verify: 'À vérifier',
  present: 'Présent',
  partial: 'Partiel',
  open: 'Ouvert',
  closed: 'Clôturé',
  in_progress: 'En cours',
  compliant: 'Conforme',
  non_compliant: 'Non conforme',
  nonconforme: 'Non conforme'
};

/**
 * @param {unknown} raw
 * @returns {'conforme'|'partiel'|'non_conforme'}
 */
export function isoRequirementStatusNormKey(raw) {
  const s = String(raw || '')
    .toLowerCase()
    .trim()
    .replace(/-/g, '_');
  if (s === 'conforme') return 'conforme';
  if (s === 'non_conforme') return 'non_conforme';
  if (s === 'partiel') return 'partiel';
  if (s === 'compliant' || s === 'approved' || s === 'closed') return 'conforme';
  if (s === 'non_compliant' || s === 'nonconforme') return 'non_conforme';
  if (
    s === 'partial' ||
    s === 'pending' ||
    s === 'review' ||
    s === 'draft' ||
    s === 'in_progress' ||
    s === 'open' ||
    s === 'verify' ||
    s === 'present' ||
    s === 'missing'
  ) {
    return 'partiel';
  }
  return 'partiel';
}
