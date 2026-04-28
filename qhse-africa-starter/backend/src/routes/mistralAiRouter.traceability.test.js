import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { prisma } from '../db.js';

vi.mock('../lib/rateLimiter.js', () => ({
  aiLimiter: (_req, _res, next) => next()
}));

vi.mock('../middleware/requirePermission.middleware.js', () => ({
  requirePermission: () => (_req, _res, next) => next()
}));

const mockRequestJsonCompletion = vi.fn();
vi.mock('../services/aiProvider.service.js', () => ({
  requestJsonCompletion: (...args) => mockRequestJsonCompletion(...args)
}));

describe('/api/ai/* — traçabilité opt-in (persistSuggestion)', () => {
  /** @type {import('express').Express} */
  let app;
  /** @type {(tenantId: string | null) => Promise<void>} */
  let mountApp;

  beforeEach(async () => {
    mockRequestJsonCompletion.mockReset();
    prisma.aiSuggestion.create.mockReset();
    prisma.aiSuggestion.create.mockResolvedValue({ id: 'sug_1' });

    const { mistralAiRouter } = await import('./aiSuggestion.routes.js');
    mountApp = async (tenantId) => {
      app = express();
      app.use(express.json());
      app.use((req, _res, next) => {
        req.qhseTenantId = tenantId;
        req.qhseUser = { id: 'user_1' };
        next();
      });
      app.use('/api/ai', mistralAiRouter);
    };
    await mountApp('tenant_A');
  });

  it('incident-causes: crée AiSuggestion pending_review + renvoie suggestionId', async () => {
    const llm = {
      summary: 'Incident — plan d’actions à valider.',
      priority: 'critical',
      recommendedActions: [
        {
          action: 'Balisage zone + séparation flux.',
          responsibleRole: 'Encadrement',
          dueInDays: 3,
          evidenceExpected: ['Photos', 'Briefing signé'],
          closureCriteria: '0 écart sur 2 rondes.',
          isoReference: null,
          confidence: 0.7
        }
      ],
      confidence: 0.65,
      humanValidationRequired: true
    };
    mockRequestJsonCompletion.mockResolvedValue({
      success: true,
      data: { type: 'incident_causes', confidence: 0.65, content: llm },
      provider: 'mistral',
      model: 'mistral-small-latest',
      rawText: JSON.stringify(llm),
      error: null
    });

    const res = await request(app)
      .post('/api/ai/incident-causes')
      .send({ type: 'X', severity: 'Y', persistSuggestion: true, tenantId: 'EVIL' });

    expect(res.status).toBe(200);
    expect(res.body.suggestionId).toBe('sug_1');
    expect(prisma.aiSuggestion.create).toHaveBeenCalledTimes(1);
    const call = prisma.aiSuggestion.create.mock.calls[0]?.[0];
    expect(call?.data?.tenantId).toBe('tenant_A'); // forcé côté serveur
    expect(call?.data?.status).toBe('pending_review');
    expect(call?.data?.type).toBe('incident_root_cause');
  });

  it('risk-mitigation: crée AiSuggestion pending_review + renvoie suggestionId', async () => {
    mockRequestJsonCompletion.mockResolvedValue({
      provider: 'openai',
      model: 'gpt-4o-mini',
      rawText: JSON.stringify({
        summary: 'Risque — mesures de maîtrise à confirmer.',
        priority: 'high',
        recommendedActions: [
          {
            action: 'Isoler le danger à la source (protection technique).',
            responsibleRole: 'Maintenance',
            dueInDays: 14,
            evidenceExpected: ['PV installation', 'Photos'],
            closureCriteria: 'Protection testée + 0 écart.',
            isoReference: null,
            confidence: 0.6
          }
        ],
        confidence: 0.6,
        humanValidationRequired: true
      }),
      error: null
    });

    const res = await request(app)
      .post('/api/ai/risk-mitigation')
      .send({ title: 'R', persistSuggestion: true, tenantId: 'EVIL' });

    expect(res.status).toBe(200);
    expect(res.body.suggestionId).toBe('sug_1');
    const call = prisma.aiSuggestion.create.mock.calls[0]?.[0];
    expect(call?.data?.tenantId).toBe('tenant_A');
    expect(call?.data?.status).toBe('pending_review');
    expect(call?.data?.type).toBe('risk_mitigation');
  });

  it('dashboard-insight: crée AiSuggestion pending_review + renvoie suggestionId', async () => {
    mockRequestJsonCompletion.mockResolvedValue({
      provider: 'mistral',
      model: 'mistral-small-latest',
      rawText: JSON.stringify({
        summary: 'Synthèse hebdo — à valider.',
        priority: 'high',
        recommendedActions: [
          {
            action: 'Point pilotage hebdo retards.',
            responsibleRole: 'Direction site',
            dueInDays: 3,
            evidenceExpected: ['CR', 'Liste arbitrages'],
            closureCriteria: 'Actions critiques assignées.',
            isoReference: null,
            confidence: 0.55
          }
        ],
        confidence: 0.55,
        humanValidationRequired: true
      }),
      error: null
    });

    const res = await request(app)
      .post('/api/ai/dashboard-insight')
      .send({ incidents: 0, actionsOverdue: 0, persistSuggestion: true, tenantId: 'EVIL' });

    expect(res.status).toBe(200);
    expect(res.body.suggestionId).toBe('sug_1');
    const call = prisma.aiSuggestion.create.mock.calls[0]?.[0];
    expect(call?.data?.tenantId).toBe('tenant_A');
    expect(call?.data?.status).toBe('pending_review');
    expect(call?.data?.type).toBe('dashboard_insight');
  });

  it('persistSuggestion absent: ne crée aucune AiSuggestion (compat API)', async () => {
    mockRequestJsonCompletion.mockResolvedValue({
      provider: 'mistral',
      model: 'mistral-small-latest',
      rawText: JSON.stringify({
        summary: 'Synthèse hebdo — à valider.',
        priority: 'high',
        recommendedActions: [
          {
            action: 'Point pilotage hebdo.',
            responsibleRole: 'Direction site',
            dueInDays: 3,
            evidenceExpected: ['CR'],
            closureCriteria: 'Décisions actées.',
            isoReference: null,
            confidence: 0.55
          }
        ],
        confidence: 0.55,
        humanValidationRequired: true
      }),
      error: null
    });

    const res = await request(app)
      .post('/api/ai/dashboard-insight')
      .send({ incidents: 1, actionsOverdue: 0 });

    expect(res.status).toBe(200);
    expect(typeof res.body.insight).toBe('string');
    expect(res.body.suggestionId).toBeUndefined();
    expect(prisma.aiSuggestion.create).toHaveBeenCalledTimes(0);
  });

  it('tenantId manquant: persistSuggestion=true ne persiste pas (sûr)', async () => {
    await mountApp(null);
    mockRequestJsonCompletion.mockResolvedValue({
      provider: 'mistral',
      model: 'mistral-small-latest',
      rawText: JSON.stringify({
        summary: 'Incident — plan d’actions à valider.',
        priority: 'critical',
        recommendedActions: [
          {
            action: 'Balisage zone.',
            responsibleRole: 'Encadrement',
            dueInDays: 3,
            evidenceExpected: ['Photos'],
            closureCriteria: '0 écart.',
            isoReference: null,
            confidence: 0.7
          }
        ],
        confidence: 0.6,
        humanValidationRequired: true
      }),
      error: null
    });

    const res = await request(app)
      .post('/api/ai/incident-causes')
      .send({ type: 'X', severity: 'Y', persistSuggestion: true });

    expect(res.status).toBe(200);
    expect(typeof res.body.suggestion).toBe('string');
    expect(res.body.suggestionId).toBeUndefined();
    expect(prisma.aiSuggestion.create).toHaveBeenCalledTimes(0);
  });
});

