import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { isActionOverdueDashboardRow } from './actionOverdueDashboard.js';

describe('isActionOverdueDashboardRow', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('retourne true si le statut contient « retard »', () => {
    expect(isActionOverdueDashboardRow({ status: 'En retard', dueDate: null })).toBe(true);
  });

  it('retourne false si le statut est considéré comme clôturé', () => {
    expect(isActionOverdueDashboardRow({ status: 'Terminé', dueDate: '2026-01-01T00:00:00Z' })).toBe(
      false
    );
    expect(
      isActionOverdueDashboardRow({ status: 'Clôturé : rappel retard', dueDate: '2026-01-01T00:00:00Z' })
    ).toBe(false);
  });

  it('retourne true si dueDate est dans le passé et action non clôturée', () => {
    expect(
      isActionOverdueDashboardRow({ status: 'En cours', dueDate: '2026-06-01T00:00:00Z' })
    ).toBe(true);
  });

  it('retourne false si dueDate est dans le futur', () => {
    expect(
      isActionOverdueDashboardRow({ status: 'En cours', dueDate: '2026-12-01T00:00:00Z' })
    ).toBe(false);
  });

  it('retourne false sans dueDate ni retard dans le statut', () => {
    expect(isActionOverdueDashboardRow({ status: 'Planifié', dueDate: null })).toBe(false);
  });
});
