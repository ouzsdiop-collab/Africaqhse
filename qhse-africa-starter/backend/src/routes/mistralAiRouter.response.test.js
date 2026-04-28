import { describe, it, expect, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';

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

describe('/api/ai/* — réponses structurées + fallback', () => {
  /** @type {import('express').Express} */
  let app;

  beforeEach(async () => {
    mockRequestJsonCompletion.mockReset();
    const { mistralAiRouter } = await import('./aiSuggestion.routes.js');
    app = express();
    app.use(express.json());
    app.use('/api/ai', mistralAiRouter);
  });

  it('incident-causes: renvoie suggestion + providerMeta (LLM JSON OK)', async () => {
    mockRequestJsonCompletion.mockResolvedValue({
      provider: 'mistral',
      model: 'mistral-small-latest',
      rawText: JSON.stringify({
        summary: 'Incident à risque — actions immédiates à valider.',
        priority: 'critical',
        recommendedActions: [
          {
            action: 'Balisage + séparation engins/piétons sur la zone.',
            responsibleRole: 'Encadrement',
            dueInDays: 3,
            evidenceExpected: ['Photos', 'Briefing signé', 'Plan affiché'],
            closureCriteria: '0 écart sur 2 rondes consécutives.',
            isoReference: null,
            confidence: 0.78
          }
        ],
        confidence: 0.72,
        humanValidationRequired: true
      }),
      error: null
    });

    const res = await request(app).post('/api/ai/incident-causes').send({ type: 'Chute', severity: 'Majeur' });
    expect(res.status).toBe(200);
    expect(typeof res.body?.suggestion).toBe('string');
    expect(res.body.suggestion).toMatch(/1\)/);
    expect(res.body.suggestion).toMatch(/Preuve attendue/i);
    expect(res.body.structured).toMatchObject({
      summary: expect.any(String),
      priority: 'critical',
      humanValidationRequired: true
    });
    expect(Array.isArray(res.body.structured.recommendedActions)).toBe(true);
    expect(Array.isArray(res.body.structured.recommendedActions[0].evidenceExpected)).toBe(true);
    expect(res.body.providerMeta).toMatchObject({
      provider: 'mistral',
      model: 'mistral-small-latest',
      fallbackUsed: false
    });
    expect(typeof res.body.providerMeta.generatedAt).toBe('string');
  });

  it('risk-mitigation: fallback heuristique si JSON invalide (pas de texte brut)', async () => {
    mockRequestJsonCompletion.mockResolvedValue({
      provider: 'mistral',
      model: 'mistral-small-latest',
      rawText: 'Voici des recommandations en texte libre (format invalide).',
      error: null
    });

    const res = await request(app).post('/api/ai/risk-mitigation').send({ title: 'Travail en hauteur' });
    expect(res.status).toBe(200);
    expect(typeof res.body?.suggestion).toBe('string');
    expect(res.body.suggestion).toMatch(/heuristique/i);
    // important: on ne renvoie pas le texte brut non parsé
    expect(res.body.suggestion).not.toMatch(/texte libre/i);
    expect(res.body.providerMeta).toMatchObject({
      provider: 'mistral',
      model: 'mistral-small-latest',
      fallbackUsed: true
    });
  });

  it('audit-questions: fallback heuristique si provider mock (rawText null)', async () => {
    mockRequestJsonCompletion.mockResolvedValue({
      provider: 'mock',
      model: null,
      rawText: null,
      error: null
    });

    const res = await request(app).post('/api/ai/audit-questions').send({ auditType: 'chantier' });
    expect(res.status).toBe(200);
    expect(typeof res.body?.suggestion).toBe('string');
    expect(res.body.suggestion).toMatch(/Grille d'audit/i);
    expect(res.body.providerMeta).toMatchObject({
      provider: 'mock',
      model: null,
      fallbackUsed: true
    });
  });

  it('dashboard-insight: renvoie insight + providerMeta (LLM JSON OK)', async () => {
    mockRequestJsonCompletion.mockResolvedValue({
      provider: 'openai',
      model: 'gpt-4o-mini',
      rawText: JSON.stringify({
        summary: 'Retards d’actions à traiter en priorité.',
        priority: 'critical',
        recommendedActions: [
          {
            action: 'Tenir un point de pilotage retards et arbitrer 3 actions critiques.',
            responsibleRole: 'Direction site',
            dueInDays: 3,
            evidenceExpected: ['CR', 'Liste arbitrages (responsable/échéance)'],
            closureCriteria: 'Actions critiques assignées et replanifiées.',
            isoReference: null,
            confidence: 0.66
          }
        ],
        confidence: 0.65,
        humanValidationRequired: true
      }),
      error: null
    });

    const res = await request(app).post('/api/ai/dashboard-insight').send({ incidents: 2, actionsOverdue: 4 });
    expect(res.status).toBe(200);
    expect(typeof res.body?.insight).toBe('string');
    expect(res.body.insight).toMatch(/Priorité:/);
    expect(res.body.structured).toMatchObject({
      summary: expect.any(String),
      priority: 'critical',
      humanValidationRequired: true
    });
    expect(res.body.providerMeta).toMatchObject({
      provider: 'openai',
      model: 'gpt-4o-mini',
      fallbackUsed: false
    });
  });
});

