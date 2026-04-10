import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import jwt from 'jsonwebtoken';

const { prismaMock } = vi.hoisted(() => ({
  prismaMock: {
    refreshToken: {
      create: vi.fn(),
      findUnique: vi.fn(),
      delete: vi.fn(),
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
    it('persiste un jeton et retourne la valeur hex', async () => {
      prismaMock.refreshToken.create.mockResolvedValueOnce({});
      const t = await authService.issueRefreshToken('u1');
      expect(t).toMatch(/^[a-f0-9]{64}$/);
      expect(prismaMock.refreshToken.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          userId: 'u1',
          token: t,
          expiresAt: expect.any(Date)
        })
      });
    });
  });

  describe('rotateRefreshToken', () => {
    it('rejette un jeton vide', async () => {
      await expect(authService.rotateRefreshToken('')).rejects.toMatchObject({
        code: 'REFRESH_INVALID'
      });
    });

    it('rejette un jeton inconnu ou expiré', async () => {
      prismaMock.refreshToken.findUnique.mockResolvedValueOnce(null);
      await expect(authService.rotateRefreshToken('abc')).rejects.toMatchObject({
        code: 'REFRESH_INVALID'
      });

      prismaMock.refreshToken.findUnique.mockResolvedValueOnce({
        id: 'rt1',
        userId: 'u1',
        expiresAt: new Date('2000-01-01'),
        user: {
          id: 'u1',
          name: 'N',
          email: 'n@test',
          role: 'ADMIN'
        }
      });
      await expect(authService.rotateRefreshToken('old')).rejects.toMatchObject({
        code: 'REFRESH_INVALID'
      });
    });

    it('rotation : supprime l’ancien, émet nouveaux jetons', async () => {
      vi.stubEnv('JWT_SECRET', '0123456789abcdef');
      vi.stubEnv('NODE_ENV', 'test');

      prismaMock.refreshToken.findUnique.mockResolvedValueOnce({
        id: 'rt-old',
        userId: 'u1',
        expiresAt: new Date('2099-01-01'),
        user: {
          id: 'u1',
          name: 'N',
          email: 'n@test',
          role: 'qhse'
        }
      });
      prismaMock.refreshToken.delete.mockResolvedValueOnce({});
      prismaMock.refreshToken.create.mockResolvedValueOnce({});

      const out = await authService.rotateRefreshToken('valid-token');
      expect(prismaMock.refreshToken.delete).toHaveBeenCalledWith({ where: { id: 'rt-old' } });
      expect(out.refreshToken).toMatch(/^[a-f0-9]{64}$/);
      expect(typeof out.accessToken).toBe('string');
      const payload = jwt.decode(out.accessToken);
      expect(payload).toMatchObject({ sub: 'u1', role: 'QHSE' });
    });
  });

  describe('revokeRefreshToken', () => {
    it('ne fait rien si jeton vide', async () => {
      await authService.revokeRefreshToken('');
      expect(prismaMock.refreshToken.deleteMany).not.toHaveBeenCalled();
    });

    it('supprime les lignes correspondantes', async () => {
      prismaMock.refreshToken.deleteMany.mockResolvedValueOnce({ count: 1 });
      await authService.revokeRefreshToken(' tok ');
      expect(prismaMock.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { token: 'tok' }
      });
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
