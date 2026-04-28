import { describe, it, expect } from 'vitest';
import { extractNarrativeMetrics, buildDeterministicNarrative } from './isoAuditNarrative.service.js';

describe('isoAuditNarrative.service', () => {
  it('extractNarrativeMetrics compte les tableaux et retards', () => {
    const m = extractNarrativeMetrics({
      score: { pct: 72, legacyPct: 80, operationalPct: 65 },
      conformingPoints: [{}, {}],
      partialGaps: [{}],
      nonConformities: [],
      missingEvidence: [{}, {}, {}],
      priorityActions: [{ overdue: true }, { overdue: false }],
      criticalRisks: [{}],
      meta: { requirementCount: 10, openIncidentsHint: 1 }
    });
    expect(m.nConformes).toBe(2);
    expect(m.nPartiels).toBe(1);
    expect(m.nMissingEvidence).toBe(3);
    expect(m.nOverdueActions).toBe(1);
    expect(m.nCriticalRisks).toBe(1);
    expect(m.nOpenIncidents).toBe(1);
    expect(m.scorePct).toBe(72);
  });

  it('buildDeterministicNarrative produit résumé et listes', () => {
    const n = buildDeterministicNarrative({
      scorePct: 55,
      legacyPct: 60,
      operationalPct: 50,
      nConformes: 3,
      nPartiels: 1,
      nNonConformes: 2,
      nMissingEvidence: 1,
      nOpenActions: 4,
      nOverdueActions: 1,
      nCriticalRisks: 0,
      nOpenIncidents: 0,
      nRequirements: 12
    });
    expect(n.summary).toMatch(/55/);
    expect(n.strengths.length).toBeGreaterThan(0);
    expect(n.weaknesses.length).toBeGreaterThan(0);
    expect(n.priorityActions.length).toBeGreaterThan(0);
    expect(n.confidence).toBe(1);
  });
});
