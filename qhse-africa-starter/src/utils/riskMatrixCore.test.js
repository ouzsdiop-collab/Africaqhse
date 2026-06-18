import { describe, it, expect } from 'vitest';
import {
  parseRiskMatrixGp,
  riskScoreProduct,
  riskTierFromGp,
  riskLevelLabelFromTier,
  riskCriticalityFromMeta
} from './riskMatrixCore.js';

describe('parseRiskMatrixGp', () => {
  it('extrait G et P depuis différentes notations', () => {
    expect(parseRiskMatrixGp('G3 x P4')).toEqual({ g: 3, p: 4 });
    expect(parseRiskMatrixGp('G3×P4')).toEqual({ g: 3, p: 4 });
    expect(parseRiskMatrixGp('contexte G2*P5 suite')).toEqual({ g: 2, p: 5 });
  });

  it('retourne null si absent ou hors plage', () => {
    expect(parseRiskMatrixGp('')).toBeNull();
    expect(parseRiskMatrixGp(null)).toBeNull();
    expect(parseRiskMatrixGp('G6 x P1')).toBeNull();
    expect(parseRiskMatrixGp('G0 x P1')).toBeNull();
  });
});

describe('riskTierFromGp', () => {
  it('mappe le produit G×P vers le bon palier', () => {
    expect(riskTierFromGp(1, 1)).toBe(1);
    expect(riskTierFromGp(1, 3)).toBe(2);
    expect(riskTierFromGp(2, 4)).toBe(3);
    expect(riskTierFromGp(3, 4)).toBe(4);
    expect(riskTierFromGp(5, 5)).toBe(5);
  });
});

describe('riskLevelLabelFromTier', () => {
  it('retourne le libellé attendu et clampe hors bornes', () => {
    expect(riskLevelLabelFromTier(1)).toBe('Faible');
    expect(riskLevelLabelFromTier(5)).toBe('Critique');
    expect(riskLevelLabelFromTier(0)).toBe('Faible');
    expect(riskLevelLabelFromTier(99)).toBe('Critique');
  });
});

describe('riskCriticalityFromMeta', () => {
  it('calcule la criticité complète depuis une métadonnée brute', () => {
    expect(riskCriticalityFromMeta('G4 x P5')).toEqual({
      g: 4,
      p: 5,
      product: riskScoreProduct(4, 5),
      tier: 5,
      label: 'Critique'
    });
  });

  it('retourne null si la métadonnée ne contient pas de G×P', () => {
    expect(riskCriticalityFromMeta('aucune notation')).toBeNull();
  });
});
