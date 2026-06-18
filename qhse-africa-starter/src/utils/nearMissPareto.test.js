import { describe, it, expect } from 'vitest';
import { computeNearMissPareto } from './nearMissPareto.js';

describe('computeNearMissPareto', () => {
  it('retourne un tableau vide si aucune ligne', () => {
    expect(computeNearMissPareto([])).toEqual([]);
    expect(computeNearMissPareto(undefined)).toEqual([]);
  });

  it('regroupe par catégorie et trie du plus fréquent au moins fréquent', () => {
    const rows = [
      { category: 'Manutention' },
      { category: 'Manutention' },
      { category: 'Circulation' },
      { category: 'Manutention' },
      { category: 'Circulation' }
    ];
    const result = computeNearMissPareto(rows);
    expect(result.map((r) => r.category)).toEqual(['Manutention', 'Circulation']);
    expect(result[0].count).toBe(3);
    expect(result[1].count).toBe(2);
  });

  it('regroupe les catégories vides ou absentes sous "Non catégorisé"', () => {
    const rows = [{ category: '' }, { category: '   ' }, {}];
    const result = computeNearMissPareto(rows);
    expect(result).toEqual([{ category: 'Non catégorisé', count: 3, pct: 100, cumulativePct: 100 }]);
  });

  it('calcule des pourcentages cumulés cohérents', () => {
    const rows = [
      { category: 'A' },
      { category: 'A' },
      { category: 'A' },
      { category: 'B' }
    ];
    const result = computeNearMissPareto(rows);
    expect(result[0]).toEqual({ category: 'A', count: 3, pct: 75, cumulativePct: 75 });
    expect(result[1]).toEqual({ category: 'B', count: 1, pct: 25, cumulativePct: 100 });
  });
});
