import { Router } from 'express';
import { authLimiter } from '../lib/rateLimiter.js';
import * as controller from '../controllers/auth.controller.js';
import {
  issueRefreshToken,
  verifyRefreshToken,
  issueAccessToken
} from '../services/auth.service.js';
import { prisma } from '../db.js';

const router = Router();

router.post('/login', authLimiter, controller.login);
router.post('/switch-tenant', controller.postSwitchTenant);
router.post('/logout', controller.logoutHandler);

router.post('/refresh', authLimiter, async (req, res, next) => {
  try {
    const token =
      req.cookies?.refreshToken ||
      req.body?.refreshToken ||
      req.get('x-refresh-token');

    if (!token) {
      return res.status(401).json({ error: 'Refresh token manquant.' });
    }

    const payload = verifyRefreshToken(token);
    if (!payload) {
      return res.status(401).json({ error: 'Refresh token invalide ou expire.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Compte introuvable.' });
    }

    const accessToken = issueAccessToken(user);
    const newRefreshToken = issueRefreshToken(user);

    res.json({
      accessToken,
      refreshToken: newRefreshToken,
      expiresIn: 3600
    });
  } catch (err) {
    next(err);
  }
});

router.get('/me', controller.getMe);

export default router;
