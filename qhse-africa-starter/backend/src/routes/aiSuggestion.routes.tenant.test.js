import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import { TENANT_CONTEXT_REQUIRED_MESSAGE } from '../lib/tenantConstants.js';
import { requireTenantContext } from '../middleware/requireTenantContext.middleware.js';

vi.mock('../lib/rateLimiter.js', () => ({
  aiLimiter: (_req, _res, next) => next()
}));

describe('aiSuggestion routes — tenant obligatoire (middleware global)', () => {
  let app;

  beforeAll(async () => {
    const { default: aiSuggestionRouter } = await import('./aiSuggestion.routes.js');
    app = express();
    app.use(express.json());
    app.use((req, _res, next) => {
      req.qhseTenantId = null;
      req.qhseUser = null;
      next();
    });
    app.use(requireTenantContext);
    app.use('/api/ai-suggestions', aiSuggestionRouter);
  });

  it('répond 403 sans tenant sur GET /api/ai-suggestions/', async () => {
    const res = await request(app).get('/api/ai-suggestions/');
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: TENANT_CONTEXT_REQUIRED_MESSAGE });
  });

  it('répond 403 sans tenant sur POST /api/ai-suggestions/suggest/actions', async () => {
    const res = await request(app)
      .post('/api/ai-suggestions/suggest/actions')
      .send({ incidentId: 'x' });
    expect(res.status).toBe(403);
    expect(res.body).toEqual({ error: TENANT_CONTEXT_REQUIRED_MESSAGE });
  });
});
