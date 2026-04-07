import { describe, it, expect } from 'vitest';
import { analyzeRiskDescription } from './riskAnalyze.service.js';

describe('analyzeRiskDescription', () => {
  it('detecte Securite pour "chute"', () => {
    const out = analyzeRiskDescription('Risque de chute en travail en hauteur');
    expect(out.category).toBe('Sécurité');
  });

  it('detecte Environnement pour "pollution"', () => {
    const out = analyzeRiskDescription('Pollution potentielle par deversement');
    expect(out.category).toBe('Environnement');
  });

  it('detecte Qualite pour "non-conformite"', () => {
    const out = analyzeRiskDescription('Non-conformité documentée lors de l audit');
    expect(out.category).toBe('Qualité');
  });

  it('description vide ne crash pas', () => {
    const out = analyzeRiskDescription('');
    expect(out).toHaveProperty('category');
    expect(Array.isArray(out.suggestedActions)).toBe(true);
  });

  it('description longue > 500 chars ne leve pas', () => {
    const longText = `chute ${'x'.repeat(600)}`;
    expect(() => analyzeRiskDescription(longText)).not.toThrow();
  });
});
