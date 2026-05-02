import { describe, it, expect } from 'vitest';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {
  issueAccessToken,
  issueRefreshToken,
  verifyRefreshToken
} from '../services/auth.service.js';

const MOCK_USER = {
  id: 'user-123',
  name: 'Test User',
  email: 'test@qhsecontrol.com',
  role: 'ADMIN'
};

describe('Auth Service', () => {
  describe('issueAccessToken', () => {
    it('retourne un token JWT valide', () => {
      const token = issueAccessToken(MOCK_USER);
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('le token contient sub = user.id', () => {
      const token = issueAccessToken(MOCK_USER);
      const payload = jwt.decode(token);
      expect(payload.sub).toBe(MOCK_USER.id);
    });
  });

  describe('issueRefreshToken / verifyRefreshToken', () => {
    it('cree un refresh token valide', () => {
      const token = issueRefreshToken(MOCK_USER);
      expect(typeof token).toBe('string');
    });

    it('verifyRefreshToken retourne le payload si valide', () => {
      const token = issueRefreshToken(MOCK_USER);
      const payload = verifyRefreshToken(token);
      expect(payload).not.toBeNull();
      expect(payload.sub).toBe(MOCK_USER.id);
      expect(payload.type).toBe('refresh');
    });

    it('verifyRefreshToken retourne null si token invalide', () => {
      const result = verifyRefreshToken('token.invalide.xxx');
      expect(result).toBeNull();
    });

    it('verifyRefreshToken retourne null si type !== refresh', () => {
      const accessToken = issueAccessToken(MOCK_USER);
      const result = verifyRefreshToken(accessToken);
      expect(result).toBeNull();
    });
  });

  describe('hash mot de passe (bcryptjs, aligné auth.service)', () => {
    it('le hash diffère du mot de passe en clair', async () => {
      const hash = await bcrypt.hash('motdepasse123', 10);
      expect(hash).not.toBe('motdepasse123');
      expect(hash.length).toBeGreaterThan(20);
    });

    it('compare retourne true si mot de passe correct', async () => {
      const hash = await bcrypt.hash('motdepasse123', 10);
      const ok = await bcrypt.compare('motdepasse123', hash);
      expect(ok).toBe(true);
    });

    it('compare retourne false si mot de passe incorrect', async () => {
      const hash = await bcrypt.hash('motdepasse123', 10);
      const ok = await bcrypt.compare('mauvais', hash);
      expect(ok).toBe(false);
    });
  });
});
