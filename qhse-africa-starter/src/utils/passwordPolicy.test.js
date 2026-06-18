import { describe, it, expect } from 'vitest';
import { validatePasswordPolicy, PASSWORD_MIN_LENGTH, PASSWORD_MAX_LENGTH } from './passwordPolicy.js';

describe('validatePasswordPolicy', () => {
  it('accepte un mot de passe valide', () => {
    expect(validatePasswordPolicy('Demo2026!')).toEqual({ ok: true });
  });

  it('rejette un mot de passe trop court', () => {
    const res = validatePasswordPolicy('a1');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(new RegExp(String(PASSWORD_MIN_LENGTH)));
  });

  it('rejette un mot de passe trop long', () => {
    const res = validatePasswordPolicy(`a1${'x'.repeat(PASSWORD_MAX_LENGTH)}`);
    expect(res.ok).toBe(false);
    expect(res.error).toBe('Mot de passe trop long');
  });

  it('rejette un mot de passe sans lettre', () => {
    const res = validatePasswordPolicy('12345678');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/lettre/);
  });

  it('rejette un mot de passe sans chiffre', () => {
    const res = validatePasswordPolicy('abcdefgh');
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/chiffre/);
  });

  it('tolère null/undefined sans planter', () => {
    expect(validatePasswordPolicy(null).ok).toBe(false);
    expect(validatePasswordPolicy(undefined).ok).toBe(false);
  });
});
