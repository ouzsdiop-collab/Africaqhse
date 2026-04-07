import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { computeActionUrgency, urgencyTierFromTotal } from './actionUrgency.js';

describe('actionUrgency', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-15T12:00:00Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('classe en urgent si criticite haute + dueDate depassee', () => {
    const score = computeActionUrgency(
      { dueDate: '2026-06-01T00:00:00Z' },
      'todo',
      { impact: 'reduction_risque_critique', priority: 'haute' }
    );
    expect(urgencyTierFromTotal(score.total)).toBe('urgent');
  });

  it('classe en prioritaire si priorite haute sans retard', () => {
    const score = computeActionUrgency(
      { dueDate: '2026-06-30T00:00:00Z' },
      'todo',
      { impact: 'reduction_risque_eleve', priority: 'haute' }
    );
    expect(urgencyTierFromTotal(score.total)).toBe('prioritaire');
  });

  it('classe en normal sans criticite ni retard', () => {
    const score = computeActionUrgency(
      { dueDate: null },
      'todo',
      { impact: 'amelioration', priority: 'basse' }
    );
    expect(urgencyTierFromTotal(score.total)).toBe('normal');
  });
});
