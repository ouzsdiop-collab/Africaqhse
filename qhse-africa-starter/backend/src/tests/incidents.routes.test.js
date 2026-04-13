import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import express from 'express';

async function buildTestApp() {
  const app = express();
  app.use(express.json());

  app.use((req, res, next) => {
    req.qhseUser = {
      id: 'user-test',
      name: 'Test User',
      email: 'test@africaqhse.com',
      role: 'ADMIN',
      tenantId: 'tenant-test'
    };
    req.qhseTenantId = 'tenant-test';
    next();
  });

  const { default: incidentsRouter } = await import('../routes/incidents.routes.js');
  app.use('/api/incidents', incidentsRouter);
  return app;
}

describe('Incidents Routes', () => {
  let app;

  beforeAll(async () => {
    app = await buildTestApp();
  });

  it('POST /api/incidents — 422 si body vide', async () => {
    const res = await request(app).post('/api/incidents').send({}).expect(422);
    expect(res.body.code).toBe('VALIDATION_ERROR');
  });

  it('POST /api/incidents — 422 si champs manquants', async () => {
    const res = await request(app)
      .post('/api/incidents')
      .send({ description: 'Sans type ni gravite' })
      .expect(422);
    expect(res.body.details).toBeDefined();
  });

  it('GET /api/incidents — appelle le service et retourne une liste', async () => {
    const { prisma } = await import('../db.js');
    prisma.incident.findMany.mockResolvedValueOnce([]);

    const res = await request(app).get('/api/incidents').expect(200);

    expect(Array.isArray(res.body)).toBe(true);
  });
});
