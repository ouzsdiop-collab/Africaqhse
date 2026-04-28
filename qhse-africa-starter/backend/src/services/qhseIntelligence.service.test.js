import { describe, it, expect } from 'vitest';
import {
  buildQhseIntelligenceSnapshot,
  computeQhseScore,
  detectAnomalies,
  detectCriticalSituations
} from './qhseIntelligence.service.js';

describe('qhseIntelligence.service', () => {
  it('refuse sans tenantId', () => {
    expect(() => detectCriticalSituations({ tenantId: null })).toThrow(/Contexte organisation requis/);
  });

  it('détecte risque critique sans action associée', () => {
    const out = detectCriticalSituations({
      tenantId: 't1',
      risks: [{ ref: 'RSK-1', title: 'Travail en hauteur', probability: 5, gravity: 4, gp: 20, status: 'open' }],
      actions: [{ title: 'Action générique', status: 'Nouveau', dueDate: null }]
    });
    expect(out.alerts.some((a) => a.type === 'critical_risk_without_action')).toBe(true);
  });

  it("ne génère pas d’alerte risque critique sans action si action.riskId explicite existe", () => {
    const out = detectCriticalSituations({
      tenantId: 't1',
      risks: [{ id: 'risk_1', ref: 'RSK-1', title: 'Travail en hauteur', probability: 5, gravity: 4, gp: 20, status: 'open' }],
      actions: [{ id: 'a1', title: 'Maîtrise travail en hauteur', status: 'À lancer', riskId: 'risk_1' }]
    });
    expect(out.alerts.some((a) => a.type === 'critical_risk_without_action')).toBe(false);
  });

  it('détecte incidents répétés', () => {
    const base = { type: 'Chute', site: 'Site A', severity: 'Majeur', createdAt: new Date().toISOString() };
    const out = detectCriticalSituations({
      tenantId: 't1',
      incidents: [
        { ...base, ref: 'INC-1' },
        { ...base, ref: 'INC-2' },
        { ...base, ref: 'INC-3' }
      ]
    });
    expect(out.alerts.some((a) => a.type === 'repeated_incidents')).toBe(true);
  });

  it('détecte retards massifs', () => {
    const past = new Date(Date.now() - 10 * 86400000).toISOString();
    const actions = Array.from({ length: 12 }).map((_, i) => ({
      id: `a${i}`,
      title: `Action ${i}`,
      status: 'En cours',
      dueDate: past
    }));
    const out = detectCriticalSituations({ tenantId: 't1', actions });
    expect(out.alerts.some((a) => a.type === 'actions_overdue_massive')).toBe(true);
  });

  it('détecte incohérence GP', () => {
    const out = detectAnomalies({
      tenantId: 't1',
      risks: [{ ref: 'RSK-9', probability: 5, gravity: 5, gp: 10 }]
    });
    expect(out.anomalies.some((a) => a.code === 'risk_gp_inconsistent')).toBe(true);
  });

  it('détecte audit < 80', () => {
    const out = detectCriticalSituations({
      tenantId: 't1',
      audits: [{ id: 'au1', score: 75 }]
    });
    expect(out.alerts.some((a) => a.type === 'audit_score_low')).toBe(true);
  });

  it('score baisse avec retards + risques critiques', () => {
    const past = new Date(Date.now() - 5 * 86400000).toISOString();
    const { score } = computeQhseScore({
      tenantId: 't1',
      actions: [{ title: 'A', status: 'En cours', dueDate: past }],
      risks: [{ probability: 5, gravity: 4, gp: 20, status: 'open' }]
    });
    expect(score).toBeLessThan(100);
    expect(score).toBeGreaterThanOrEqual(0);
  });

  it('snapshot renvoie le contrat {alerts, anomalies, score, insights}', () => {
    const out = buildQhseIntelligenceSnapshot({ tenantId: 't1', incidents: [], risks: [], actions: [], audits: [] });
    expect(out).toHaveProperty('alerts');
    expect(out).toHaveProperty('anomalies');
    expect(out).toHaveProperty('score');
    expect(out).toHaveProperty('insights');
    expect(out).toHaveProperty('generatedAt');
    expect(out).toHaveProperty('dataSource');
    expect(typeof out.score).toBe('number');
  });

  it('tenant vide: score 100, alerts/anomalies vides, aucun faux signal', () => {
    const out = buildQhseIntelligenceSnapshot({
      tenantId: 't1',
      incidents: [],
      risks: [],
      actions: [],
      audits: [],
      products: [],
      fdsDocuments: []
    });
    expect(out.score).toBe(100);
    expect(out.alerts).toEqual([]);
    expect(out.anomalies).toEqual([]);
  });

  it('document FDS expiré → alerte', () => {
    const out = detectCriticalSituations({
      tenantId: 't1',
      fdsDocuments: [
        { id: 'doc1', type: 'FDS', expiresAt: new Date(Date.now() - 2 * 86400000).toISOString() }
      ]
    });
    expect(out.alerts.some((a) => a.type === 'fds_expired')).toBe(true);
  });

  it('document FDS bientôt expiré (≤30j) → alerte', () => {
    const out = detectCriticalSituations({
      tenantId: 't1',
      fdsDocuments: [
        { id: 'doc2', type: 'FDS', expiresAt: new Date(Date.now() + 10 * 86400000).toISOString() }
      ]
    });
    expect(out.alerts.some((a) => a.type === 'fds_renew_soon')).toBe(true);
  });

  it('document FDS sans expiresAt → pas d’alerte expiration', () => {
    const out = detectCriticalSituations({
      tenantId: 't1',
      fdsDocuments: [{ id: 'doc3', type: 'FDS', expiresAt: null }]
    });
    expect(out.alerts.some((a) => a.type === 'fds_expired' || a.type === 'fds_renew_soon')).toBe(false);
  });

  it('product avec fdsFileUrl mais sans ControlledDocument → pas d’alerte expiration', () => {
    const out = detectCriticalSituations({
      tenantId: 't1',
      products: [{ id: 'p1', fdsFileUrl: 'fds:x.pdf' }],
      fdsDocuments: []
    });
    expect(out.alerts.some((a) => String(a.type).startsWith('fds_'))).toBe(false);
  });

  it('product nécessite FDS + aucune FDS liée → alerte fds_missing_product', () => {
    const out = detectCriticalSituations({
      tenantId: 't1',
      products: [{ id: 'p1', name: 'Acétone', casNumber: '67-64-1' }],
      fdsDocuments: []
    });
    expect(out.alerts.some((a) => a.type === 'fds_missing_product')).toBe(true);
  });

  it('product avec FDS liée valide → pas d’alerte fds_expired_product/fds_renew_soon_product', () => {
    const out = detectCriticalSituations({
      tenantId: 't1',
      products: [{ id: 'p1', name: 'Acétone', casNumber: '67-64-1' }],
      fdsDocuments: [
        { id: 'doc_p1', type: 'fds', productId: 'p1', expiresAt: new Date(Date.now() + 120 * 86400000).toISOString() }
      ]
    });
    expect(out.alerts.some((a) => a.type === 'fds_expired_product')).toBe(false);
    expect(out.alerts.some((a) => a.type === 'fds_renew_soon_product')).toBe(false);
  });

  it('product avec FDS liée expirée → alerte fds_expired_product', () => {
    const out = detectCriticalSituations({
      tenantId: 't1',
      products: [{ id: 'p1', name: 'Acétone', casNumber: '67-64-1' }],
      fdsDocuments: [
        { id: 'doc_p1', type: 'fds', productId: 'p1', expiresAt: new Date(Date.now() - 2 * 86400000).toISOString() }
      ]
    });
    expect(out.alerts.some((a) => a.type === 'fds_expired_product')).toBe(true);
  });
});

