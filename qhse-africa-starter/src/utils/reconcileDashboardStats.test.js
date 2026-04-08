import { describe, it, expect } from 'vitest';
import {
  reconcileDashboardStatsWithLists,
  deriveDashboardStatsFromLists,
  asDashboardCount
} from './reconcileDashboardStats.js';

describe('reconcileDashboardStatsWithLists', () => {
  it('remplace les zéros API par les dérivés listes quand tout est à 0 côté agrégats', () => {
    const api = {
      incidents: 0,
      actions: 0,
      overdueActions: 0,
      nonConformities: 0,
      criticalIncidents: [],
      overdueActionItems: []
    };
    const incidents = [{ severity: 'Critique', ref: 'X' }];
    const actions = [];
    const ncs = [];
    const out = reconcileDashboardStatsWithLists(api, incidents, actions, ncs);
    expect(out.incidents).toBe(1);
    expect(out.criticalIncidents.length).toBeGreaterThan(0);
  });

  it('prend le max entre API et listes', () => {
    const api = { incidents: 5, actions: 2, overdueActions: 0, nonConformities: 1 };
    const out = reconcileDashboardStatsWithLists(api, [], [], []);
    expect(out.incidents).toBe(5);
  });
});

describe('deriveDashboardStatsFromLists', () => {
  it('compte les incidents et NC ouvertes', () => {
    const d = deriveDashboardStatsFromLists(
      [{ severity: 'moyen' }],
      [],
      [{ status: 'Ouverte' }, { status: 'Clos' }]
    );
    expect(d.incidents).toBe(1);
    expect(d.nonConformities).toBe(1);
  });
});

describe('asDashboardCount', () => {
  it('normalise les valeurs non numériques', () => {
    expect(asDashboardCount(undefined)).toBe(0);
    expect(asDashboardCount('3')).toBe(3);
  });
});
