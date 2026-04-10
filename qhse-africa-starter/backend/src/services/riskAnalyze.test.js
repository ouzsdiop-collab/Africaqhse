import { describe, it, expect } from 'vitest';
import { analyzeRiskDescription, analyzeRiskDescriptionAsync } from './riskAnalyze.service.js';

describe('analyzeRiskDescription', () => {
  it('detecte Securite pour "chute"', () => {
    const out = analyzeRiskDescription('Risque de chute en travail en hauteur');
    expect(out.category).toBe('Sécurité');
    expect(typeof out.causes).toBe('string');
    expect(typeof out.impacts).toBe('string');
    expect(out.causes.length).toBeGreaterThan(10);
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

  it('analyzeRiskDescriptionAsync sans IA externe renvoie provider rules', async () => {
    const out = await analyzeRiskDescriptionAsync('Risque de chute en hauteur');
    expect(out.provider).toBe('rules');
    expect(out.category).toBe('Sécurité');
    expect(Array.isArray(out.suggestedActions)).toBe(true);
  });
});
