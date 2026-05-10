import { describe, it, expect } from 'vitest';
import { labelFrom, translateSeverity, translateStatus } from './i18nTranslate.js';

describe('i18nTranslate', () => {
  it('labelFrom retourne le fallback si valeur absente', () => {
    expect(labelFrom({ pending: 'En attente' }, null)).toBe('Non renseigné');
    expect(labelFrom({ pending: 'En attente' }, undefined)).toBe('Non renseigné');
    expect(labelFrom({ pending: 'En attente' }, '   ')).toBe('Non renseigné');
  });

  it('translateStatus traduit les statuts connus', () => {
    expect(translateStatus('pending')).toBe('En attente');
    expect(translateStatus('validated')).toBe('Validé');
    expect(translateStatus('rejected')).toBe('Rejeté');
  });

  it('translateSeverity traduit les sévérités connues', () => {
    expect(translateSeverity('critical')).toBe('Critique');
    expect(translateSeverity('low')).toBe('Faible');
  });

  it('retourne la valeur d’origine si traduction absente', () => {
    expect(translateStatus('custom_status')).toBe('custom_status');
  });
});
