import { beforeEach, describe, expect, it, vi } from 'vitest';
import { qhseNavigate } from './qhseNavigate.js';
import { consumeDashboardIntent } from './dashboardNavigationIntent.js';

const storageMap = new Map();

describe('qhseNavigate contextual routing', () => {
  beforeEach(() => {
    storageMap.clear();
    vi.stubGlobal('localStorage', {
      getItem: (k) => (storageMap.has(k) ? storageMap.get(k) : null),
      setItem: (k, v) => storageMap.set(k, String(v)),
      removeItem: (k) => storageMap.delete(k),
      clear: () => storageMap.clear(),
      key: (i) => Array.from(storageMap.keys())[i] ?? null,
      get length() {
        return storageMap.size;
      }
    });
    vi.stubGlobal('window', { location: { hash: '' } });
  });

  it('pushes overdue context for actions', () => {
    qhseNavigate('actions', { actionsColumnFilter: 'overdue', source: 'test_kpi' });
    expect(globalThis.window.location.hash).toBe('actions');
    const intent = consumeDashboardIntent();
    expect(intent?.actionsColumnFilter).toBe('overdue');
    expect(intent?.source).toBe('test_kpi');
  });

  it('pushes critical incidents context', () => {
    qhseNavigate('incidents', { incidentSeverityFilter: 'critique', dashboardIncidentPeriodPreset: '30' });
    expect(globalThis.window.location.hash).toBe('incidents');
    const intent = consumeDashboardIntent();
    expect(intent?.incidentSeverityFilter).toBe('critique');
    expect(intent?.dashboardIncidentPeriodPreset).toBe('30');
  });

  it('pushes critical risk banner context', () => {
    qhseNavigate('risks', { riskBannerKpi: 'critique' });
    expect(globalThis.window.location.hash).toBe('risks');
    const intent = consumeDashboardIntent();
    expect(intent?.riskBannerKpi).toBe('critique');
  });
});
