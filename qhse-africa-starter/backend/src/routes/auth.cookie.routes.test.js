import { describe, it, expect, beforeAll, beforeEach, vi } from 'vitest';
import request from 'supertest';
import express from 'express';
import cookieParser from 'cookie-parser';

const { mockFindUnique } = vi.hoisted(() => ({
  mockFindUnique: vi.fn()
}));

vi.mock('../db.js', () => ({
  prisma: {
    user: {
      findUnique: (...args) => mockFindUnique(...args)
    }
  }
}));

vi.mock('../services/auth.service.js', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    authenticateWithEmailPassword: vi.fn(async (email, password) => {
      if (String(email).toLowerCase() === 'admin@qhse.local' && password === 'Demo2026!') {
        return {
          id: 'user-test-cookie',
          name: 'Admin Test',
          email: 'admin@qhse.local',
          role: 'ADMIN'
        };
      }
      return null;
    })
  };
});

vi.mock('../lib/rateLimiter.js', () => ({
  authLimiter: (_req, _res, next) => next()
}));

async function buildAuthApp() {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  const { default: authRouter } = await import('./auth.routes.js');
  app.use('/api/auth', authRouter);
  return app;
}

describe('Auth httpOnly refresh cookie', () => {
  let app;

  beforeAll(async () => {
    app = await buildAuthApp();
  });

  beforeEach(() => {
    mockFindUnique.mockImplementation(async ({ where }) => {
      if (where?.id === 'user-test-cookie') {
        return {
          id: 'user-test-cookie',
          name: 'Admin Test',
          email: 'admin@qhse.local',
          role: 'ADMIN'
        };
      }
      return null;
    });
  });

  it('POST /api/auth/login — pas de refreshToken dans le JSON, cookie qhse_refresh', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@qhse.local', password: 'Demo2026!' })
      .expect(200);

    expect(res.body.refreshToken).toBeUndefined();
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.token).toBe(res.body.accessToken);
    const cookies = res.headers['set-cookie'];
    expect(Array.isArray(cookies)).toBe(true);
    expect(cookies.some((c) => String(c).startsWith('qhse_refresh='))).toBe(true);
    expect(cookies.some((c) => /HttpOnly/i.test(c))).toBe(true);
  });

  it('POST /api/auth/refresh — sans body, cookie envoyé → nouveaux jetons sans refresh dans le JSON', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'admin@qhse.local', password: 'Demo2026!' })
      .expect(200);

    const res = await agent.post('/api/auth/refresh').send({}).expect(200);

    expect(res.body.refreshToken).toBeUndefined();
    expect(res.body.accessToken).toBeTruthy();
    expect(res.body.token).toBe(res.body.accessToken);
    const cookies = res.headers['set-cookie'];
    expect(Array.isArray(cookies)).toBe(true);
    expect(cookies.some((c) => String(c).startsWith('qhse_refresh='))).toBe(true);
  });

  it('POST /api/auth/refresh — 401 sans cookie', async () => {
    await request(app).post('/api/auth/refresh').send({}).expect(401);
  });

  it('POST /api/auth/logout — 204 et effacement du cookie côté en-têtes', async () => {
    const agent = request.agent(app);
    await agent
      .post('/api/auth/login')
      .send({ email: 'admin@qhse.local', password: 'Demo2026!' })
      .expect(200);

    const res = await agent.post('/api/auth/logout').send({}).expect(204);
    const setCookie = res.headers['set-cookie'];
    expect(Array.isArray(setCookie)).toBe(true);
    expect(setCookie.some((c) => /qhse_refresh=\s*;|qhse_refresh=;/i.test(String(c)))).toBe(true);
  });
});
