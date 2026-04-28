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

vi.mock('../services/aiProvider.service.js', () => ({
  callAiProvider: vi.fn(async () => ({
    provider: 'mock',
    model: null,
    rawText: null,
    error: null
  })),
  requestJsonCompletion: vi.fn(async () => ({
    success: false,
    data: null,
    rawText: null,
    provider: 'mock',
    model: null,
    error: null
  })),
  isExternalAiEnabled: vi.fn(() => false),
  resolveAiProvider: vi.fn(() => 'mock')
}));

describe('POST /api/ai-suggestions/suggest/actions — traçabilité opt-in (persistSuggestion)', () => {
  /** @type {import('express').Express} */
  let app;
  /** @type {(tenantId: string | null) => Promise<void>} */
  let mountApp;

  beforeEach(async () => {
    prisma.aiSuggestion.create.mockReset();
    prisma.aiSuggestion.create.mockResolvedValue({ id: 'sug_actions_1' });

    prisma.incident.findFirst.mockReset();
    prisma.incident.findFirst.mockResolvedValue({
      id: 'inc_1',
      ref: 'INC-001',
      type: 'Chute',
      site: 'Site A',
      severity: 'Majeur',
      status: 'Nouveau',
      description: 'Desc',
      location: 'Zone'
    });

    prisma.risk.findMany.mockReset();
    prisma.risk.findMany.mockResolvedValue([]);

    const { default: aiSuggestionRouter } = await import('./aiSuggestion.routes.js');
    mountApp = async (tenantId) => {
      app = express();
      app.use(express.json());
      app.use((req, _res, next) => {
        req.qhseTenantId = tenantId;
        req.qhseUser = { id: 'user_1' };
        next();
      });
      app.use('/api/ai-suggestions', aiSuggestionRouter);
    };
    await mountApp('tenant_A');
  });

  it('crée AiSuggestion pending_review et renvoie suggestionId', async () => {
    const res = await request(app)
      .post('/api/ai-suggestions/suggest/actions')
      .send({ incidentId: 'inc_1', persistSuggestion: true });

    expect(res.status).toBe(200);
    expect(res.body.suggestionId).toBe('sug_actions_1');
    expect(prisma.aiSuggestion.create).toHaveBeenCalledTimes(1);
    const call = prisma.aiSuggestion.create.mock.calls[0]?.[0];
    expect(call?.data?.tenantId).toBe('tenant_A');
    expect(call?.data?.status).toBe('pending_review');
    expect(call?.data?.type).toBe('incident_corrective_actions');
    expect(call?.data?.targetIncidentId).toBe('inc_1');
    expect(call?.data?.createdByUserId).toBe('user_1');
  });

  it('persistSuggestion absent: ne crée aucune AiSuggestion', async () => {
    const res = await request(app).post('/api/ai-suggestions/suggest/actions').send({ incidentId: 'inc_1' });
    expect(res.status).toBe(200);
    expect(res.body.suggestionId).toBeUndefined();
    expect(prisma.aiSuggestion.create).toHaveBeenCalledTimes(0);
  });

  it('tenantId manquant: persistSuggestion=true ne persiste pas (sûr)', async () => {
    await mountApp(null);
    const res = await request(app)
      .post('/api/ai-suggestions/suggest/actions')
      .send({ incidentId: 'inc_1', persistSuggestion: true });
    expect(res.status).toBe(200);
    expect(res.body.suggestionId).toBeUndefined();
    expect(prisma.aiSuggestion.create).toHaveBeenCalledTimes(0);
  });
});

