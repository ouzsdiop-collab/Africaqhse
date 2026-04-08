/**
 * Évolution G/P — pilotage dynamique (données locales).
 */

/**
 * @typedef {{ when: string; g: number; p: number; note?: string }} GpHistoryEntry
 */

/**
 * @param {GpHistoryEntry[]} history
 * @param {{ meta?: string }} risk
 * @returns {string} chaîne type "G3×P3 → G4×P3"
 */
export function formatGpHistoryArrow(history, risk) {
  if (!Array.isArray(history) || history.length < 2) return '—';
  const a = history[history.length - 2];
  const b = history[history.length - 1];
  return `G${a.g}×P${a.p} → G${b.g}×P${b.p}`;
}

/**
 * @param {GpHistoryEntry[]} history
 * @param {{ pilotageState?: string; trend?: string; meta?: string }} risk
 * @returns {'improvement'|'drift'|'aggravation'|null}
 */
export function computeEvolutionBadgeKind(history, risk) {
  if (Array.isArray(history) && history.length >= 2) {
    const a = history[history.length - 2];
    const b = history[history.length - 1];
    const pa = a.g * a.p;
    const pb = b.g * b.p;
    if (pb > pa) return 'aggravation';
    if (pb < pa) return 'improvement';
    if (risk.pilotageState === 'derive') return 'drift';
    return null;
  }
  if (risk.pilotageState === 'derive') return 'drift';
  if (risk.trend === 'down') return 'improvement';
  if (risk.trend === 'up') return 'aggravation';
  return null;
}

export const EVOLUTION_BADGE_LABELS = {
  improvement: { label: 'Amélioration', className: 'risk-evolution-badge--improve' },
  drift: { label: 'Dérive', className: 'risk-evolution-badge--drift' },
  aggravation: { label: 'Aggravation', className: 'risk-evolution-badge--worse' }
};
