/**
 * Analyse Pareto des presque-accidents par catégorie : compte, part relative,
 * part cumulée — pour repérer les catégories qui concentrent le plus d'événements.
 */

const UNCATEGORIZED_LABEL = 'Non catégorisé';

/**
 * @param {{ category?: string | null }[]} rows
 * @returns {{ category: string, count: number, pct: number, cumulativePct: number }[]}
 */
export function computeNearMissPareto(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const total = list.length;
  if (total === 0) return [];

  /** @type {Map<string, number>} */
  const counts = new Map();
  for (const r of list) {
    const cat = String(r?.category || '').trim() || UNCATEGORIZED_LABEL;
    counts.set(cat, (counts.get(cat) || 0) + 1);
  }

  const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

  let cumulative = 0;
  return sorted.map(([category, count]) => {
    const pct = Math.round((100 * count) / total);
    cumulative += count;
    const cumulativePct = Math.round((100 * cumulative) / total);
    return { category, count, pct, cumulativePct };
  });
}
