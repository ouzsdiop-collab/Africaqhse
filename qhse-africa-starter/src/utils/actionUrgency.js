/**
 * Score d’urgence décisionnel (pilotage local) : criticité + retard + priorité.
 * Pas d’import circulaire avec les cartes Kanban.
 */

/** @typedef {'urgent'|'prioritaire'|'normal'} UrgencyTier */

const IMPACT_CRITICITE = {
  amelioration: 1,
  reduction_risque_eleve: 2,
  reduction_risque_critique: 3
};

const PRIO_SCORE = {
  basse: 1,
  normale: 2,
  haute: 3,
  critique: 4
};

/**
 * Retard / échéance (1 = calme … 4 = bloquant).
 * @param {string} columnKey
 * @param {string | null | undefined} dueIso
 */
function scoreRetard(columnKey, dueIso) {
  if (columnKey === 'done') return 0;
  if (columnKey === 'overdue') return 4;
  if (dueIso) {
    const d = new Date(dueIso);
    if (!Number.isNaN(d.getTime())) {
      const days = (d.getTime() - Date.now()) / 86400000;
      if (days < 0) return 4;
      if (days <= 3) return 3;
      if (days <= 14) return 2;
    }
  }
  return 1;
}

/**
 * @param {object} [pilotage]
 * @param {string} columnKey
 */
export function computeActionUrgency(row, columnKey, pilotage = {}) {
  const impactKey = pilotage.impact || 'amelioration';
  const criticite = IMPACT_CRITICITE[impactKey] ?? 2;
  const retard = scoreRetard(columnKey, row?.dueDate);
  const priorite = PRIO_SCORE[pilotage.priority] ?? 2;
  const total = criticite + retard + priorite;
  return { total, criticite, retard, priorite, impactKey };
}

/**
 * @param {number} total
 * @returns {UrgencyTier}
 */
export function urgencyTierFromTotal(total) {
  if (total >= 9) return 'urgent';
  if (total >= 6) return 'prioritaire';
  return 'normal';
}

export const URGENCY_LABELS = {
  urgent: 'URGENT',
  prioritaire: 'PRIORITAIRE',
  normal: 'NORMAL'
};

export const URGENCY_TOOLTIP =
  'Score urgence = impact (réduction risque / amélioration) + retard (échéance & colonne) + priorité fiche. ' +
  'Les trois notes (1 à 4 chacune) sont additionnées : plus le total est élevé, plus le pilotage doit être rapide.';

export const IMPACT_LABELS = {
  reduction_risque_critique: 'Réduction risque critique',
  reduction_risque_eleve: 'Réduction risque élevé',
  amelioration: 'Amélioration'
};
