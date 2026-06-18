import { describe, it, expect } from 'vitest';
import { habRowIsBlockedCritical, habCriticalityScore, sortHabilitationsByCriticality } from './habilitationsCriticality.js';

function isoInDays(days) {
  return new Date(Date.now() + days * 86400000).toISOString().slice(0, 10);
}

describe('habRowIsBlockedCritical', () => {
  it('détecte une habilitation expirée ou suspendue', () => {
    expect(habRowIsBlockedCritical({ statut: 'expiree' })).toBe(true);
    expect(habRowIsBlockedCritical({ statut: 'suspendue' })).toBe(true);
  });

  it('détecte un blocage mentionné dans les remarques', () => {
    expect(habRowIsBlockedCritical({ statut: 'valide', remarques: 'Soudure bloquée' })).toBe(true);
  });

  it('retourne false sinon', () => {
    expect(habRowIsBlockedCritical({ statut: 'valide', remarques: 'OK' })).toBe(false);
    expect(habRowIsBlockedCritical({})).toBe(false);
  });
});

describe('habCriticalityScore', () => {
  it('priorise une habilitation expirée devant tout le reste', () => {
    const expired = habCriticalityScore({ statut: 'expiree', expiration: isoInDays(-5), justificatif: true });
    const urgent = habCriticalityScore({ statut: 'valide', expiration: isoInDays(3), justificatif: true });
    expect(expired).toBeLessThan(urgent);
  });

  it('priorise une échéance proche devant un justificatif manquant lointain', () => {
    const soon = habCriticalityScore({ statut: 'valide', expiration: isoInDays(5), justificatif: true });
    const missingDoc = habCriticalityScore({ statut: 'valide', expiration: isoInDays(200), justificatif: false });
    expect(soon).toBeLessThan(missingDoc);
  });

  it('renvoie un score élevé mais fini pour une ligne saine et lointaine', () => {
    const score = habCriticalityScore({ statut: 'valide', expiration: isoInDays(200), justificatif: true });
    expect(score).toBeGreaterThanOrEqual(100);
    expect(Number.isFinite(score)).toBe(true);
  });
});

describe('sortHabilitationsByCriticality', () => {
  it('trie du plus critique au moins critique sans muter le tableau original', () => {
    const rows = [
      { id: 'a', statut: 'valide', expiration: isoInDays(200), justificatif: true },
      { id: 'b', statut: 'expiree', expiration: isoInDays(-1), justificatif: true },
      { id: 'c', statut: 'valide', expiration: isoInDays(5), justificatif: true }
    ];
    const sorted = sortHabilitationsByCriticality(rows);
    expect(sorted.map((r) => r.id)).toEqual(['b', 'c', 'a']);
    expect(rows.map((r) => r.id)).toEqual(['a', 'b', 'c']);
  });
});
