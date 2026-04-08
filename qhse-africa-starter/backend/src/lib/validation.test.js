import { describe, it, expect } from 'vitest';
import {
  clampTrimString,
  isValidEmailBasic,
  LIST_DEFAULT_LIMIT,
  LIST_MAX_LIMIT,
  parseAuditScore,
  parseListLimit,
  validatePasswordPolicy
} from './validation.js';

describe('clampTrimString', () => {
  it('tronque a la longueur max', () => {
    expect(clampTrimString('abcdef', 4)).toBe('abcd');
  });

  it('trimme les espaces', () => {
    expect(clampTrimString('  abc  ', 10)).toBe('abc');
  });

  it("retourne '' si entree non-string", () => {
    expect(clampTrimString(123, 10)).toBe('');
  });
});

describe('parseListLimit', () => {
  it('undefined -> LIST_DEFAULT_LIMIT', () => {
    expect(parseListLimit(undefined)).toBe(LIST_DEFAULT_LIMIT);
  });

  it("'50' -> 50", () => {
    expect(parseListLimit('50')).toBe(50);
  });

  it("'9999' -> LIST_MAX_LIMIT", () => {
    expect(parseListLimit('9999')).toBe(LIST_MAX_LIMIT);
  });

  it("'-1' -> LIST_DEFAULT_LIMIT", () => {
    expect(parseListLimit('-1')).toBe(LIST_DEFAULT_LIMIT);
  });

  it("'abc' -> LIST_DEFAULT_LIMIT", () => {
    expect(parseListLimit('abc')).toBe(LIST_DEFAULT_LIMIT);
  });
});

describe('isValidEmailBasic', () => {
  it('valide un email simple', () => {
    expect(isValidEmailBasic('test@example.com')).toBe(true);
  });

  it('rejette un format invalide', () => {
    expect(isValidEmailBasic('pas-un-email')).toBe(false);
  });

  it('rejette une chaine vide', () => {
    expect(isValidEmailBasic('')).toBe(false);
  });

  it('rejette > 254 caracteres', () => {
    const longLocal = 'a'.repeat(245);
    expect(isValidEmailBasic(`${longLocal}@example.com`)).toBe(false);
  });
});

describe('validatePasswordPolicy', () => {
  it('accepte lettre + chiffre et longueur >= 8', () => {
    expect(validatePasswordPolicy('abc12345').ok).toBe(true);
    expect(validatePasswordPolicy('café2024').ok).toBe(true);
  });

  it('rejette trop court', () => {
    expect(validatePasswordPolicy('ab1').ok).toBe(false);
  });

  it('rejette sans chiffre', () => {
    const r = validatePasswordPolicy('abcdefgh');
    expect(r.ok).toBe(false);
    expect(r).toMatchObject({ ok: false });
  });

  it('rejette sans lettre', () => {
    const r = validatePasswordPolicy('12345678');
    expect(r.ok).toBe(false);
  });
});

describe('parseAuditScore', () => {
  it('85 -> ok true', () => {
    expect(parseAuditScore(85)).toEqual({ ok: true, value: 85 });
  });

  it('-5 -> ok false', () => {
    expect(parseAuditScore(-5).ok).toBe(false);
  });

  it('110 -> ok false', () => {
    expect(parseAuditScore(110).ok).toBe(false);
  });

  it("'72' -> ok true, value 72", () => {
    expect(parseAuditScore('72')).toEqual({ ok: true, value: 72 });
  });
});
