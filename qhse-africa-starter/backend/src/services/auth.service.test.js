import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    refreshToken: {
      deleteMany: vi.fn()
    },
    user: {
      findUnique: vi.fn()
    }
  }
}));

vi.mock('../db.js', () => ({ prisma: prismaMock }));

const { bcryptCompare } = vi.hoisted(() => ({
  bcryptCompare: vi.fn()
}));

vi.mock('bcryptjs', () => ({
  default: {
    compare: bcryptCompare
  }
}));

import * as authService from './auth.service.js';

describe('auth.service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  describe('authenticateWithEmailPassword', () => {
    it('retourne l’utilisateur avec un bon mot de passe', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        name: 'N',
        email: 'a@test.com',
        role: 'qhse',
        passwordHash: 'hash'
      });
      bcryptCompare.mockResolvedValueOnce(true);

      const out = await authService.authenticateWithEmailPassword('  A@Test.COM ', 'secret');

      expect(out).toEqual({
        id: 'u1',
        name: 'N',
        email: 'a@test.com',
        role: 'QHSE'
      });
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'a@test.com' },
        select: expect.any(Object)
      });
    });

    it('retourne null avec un mauvais mot de passe', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        passwordHash: 'hash',
        name: 'N',
        email: 'a@test.com',
        role: 'ADMIN'
      });
      bcryptCompare.mockResolvedValueOnce(false);

      expect(
        await authService.authenticateWithEmailPassword('a@test.com', 'wrong')
      ).toBeNull();
    });

    it('retourne null si l’utilisateur n’existe pas', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce(null);
      expect(
        await authService.authenticateWithEmailPassword('nobody@test.com', 'x')
      ).toBeNull();
      expect(bcryptCompare).not.toHaveBeenCalled();
    });

    it('retourne null si pas de passwordHash', async () => {
      prismaMock.user.findUnique.mockResolvedValueOnce({
        id: 'u1',
        name: 'N',
        email: 'a@test.com',
        role: 'ADMIN',
        passwordHash: null
      });
      expect(await authService.authenticateWithEmailPassword('a@test.com', 'x')).toBeNull();
    });
  });

  describe('issueAccessToken', () => {
    it('signe un JWT avec sub et role normalisés', () => {
      vi.stubEnv('JWT_SECRET', '0123456789abcdef');
      vi.stubEnv('NODE_ENV', 'test');

      const token = authService.issueAccessToken({
        id: 'user-42',
        name: 'X',
        email: 'x@test',
        role: 'admin'
      });

      const payload = jwt.decode(token);
      expect(payload).toMatchObject({
        sub: 'user-42',
        role: 'ADMIN'
      });
      expect(typeof payload.exp).toBe('number');
    });

    it('inclut tid lorsque tenantId est fourni', () => {
      vi.stubEnv('JWT_SECRET', '0123456789abcdef');
      vi.stubEnv('NODE_ENV', 'test');
      const token = authService.issueAccessToken(
        { id: 'u1', name: 'N', email: 'n@test', role: 'ADMIN' },
        'tenant_xyz'
      );
      const payload = jwt.decode(token);
      expect(payload).toMatchObject({ sub: 'u1', role: 'ADMIN', tid: 'tenant_xyz' });
    });
  });

  describe('getJwtSecret', () => {
    it('lève en production sans secret valide', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('JWT_SECRET', '');
      expect(() => authService.getJwtSecret()).toThrow(
        'JWT_SECRET requis en production (minimum 16 caractères).'
      );
    });

    it('retourne le secret si assez long', () => {
      vi.stubEnv('NODE_ENV', 'production');
      vi.stubEnv('JWT_SECRET', '0123456789abcdef');
      expect(authService.getJwtSecret()).toBe('0123456789abcdef');
    });
  });

  describe('issueRefreshToken', () => {
    it('retourne un JWT refresh (stateless, sans persistance DB)', () => {
      vi.stubEnv('JWT_SECRET', '0123456789abcdef');
      vi.stubEnv('NODE_ENV', 'test');

      const user = {
        id: 'u1',
        name: 'N',
        email: 'n@test',
        role: 'ADMIN'
      };
      const t = authService.issueRefreshToken(user);
      expect(typeof t).toBe('string');
      expect(t.split('.')).toHaveLength(3);
      const payload = jwt.decode(t);
      expect(payload).toMatchObject({ sub: 'u1', type: 'refresh' });
    });

    it('inclut tid sur le refresh lorsque tenantId est fourni', () => {
      vi.stubEnv('JWT_SECRET', '0123456789abcdef');
      vi.stubEnv('NODE_ENV', 'test');
      const t = authService.issueRefreshToken({ id: 'u1' }, 't1');
      const payload = jwt.decode(t);
      expect(payload).toMatchObject({ sub: 'u1', type: 'refresh', tid: 't1' });
    });
  });

  describe('verifyRefreshToken', () => {
    it('retourne le payload si le jeton est un refresh valide', () => {
      vi.stubEnv('JWT_SECRET', '0123456789abcdef');
      vi.stubEnv('NODE_ENV', 'test');
      const token = authService.issueRefreshToken({
        id: 'u1',
        name: 'N',
        email: 'n@test',
        role: 'ADMIN'
      });
      const payload = authService.verifyRefreshToken(token);
      expect(payload).not.toBeNull();
      expect(payload.sub).toBe('u1');
      expect(payload.type).toBe('refresh');
    });

    it('retourne null si le jeton est invalide ou est un access token', () => {
      vi.stubEnv('JWT_SECRET', '0123456789abcdef');
      vi.stubEnv('NODE_ENV', 'test');
      expect(authService.verifyRefreshToken('not.a.jwt')).toBeNull();
      const access = authService.issueAccessToken({
        id: 'u1',
        name: 'N',
        email: 'n@test',
        role: 'ADMIN'
      });
      expect(authService.verifyRefreshToken(access)).toBeNull();
    });
  });

  describe('revokeRefreshToken', () => {
    it('no-op stateless : ne touche pas à la base', async () => {
      await authService.revokeRefreshToken('');
      await authService.revokeRefreshToken('any-token');
      expect(prismaMock.refreshToken.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('cleanupExpiredRefreshTokens', () => {
    it('retourne le nombre supprimé', async () => {
      prismaMock.refreshToken.deleteMany.mockResolvedValueOnce({ count: 3 });
      const out = await authService.cleanupExpiredRefreshTokens();
      expect(out).toEqual({ deleted: 3 });
    });
  });
});
