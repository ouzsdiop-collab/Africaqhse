import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { getJwtSecret, MONO_ORG } from '../services/auth.service.js';
import { isXUserIdAllowed } from '../lib/securityConfig.js';

/**
 * Charge l’utilisateur (JWT : sub + role). V1 mono-tenant : pas de table tenants / adhésions.
 */
export async function attachRequestUser(req, res, next) {
  req.qhseTenant = MONO_ORG;
  req.qhseTenantId = null;

  const authHeader = req.get('authorization') || req.get('Authorization') || '';
  const bearerMatch = /^Bearer\s+(\S+)/i.exec(authHeader);

  if (bearerMatch) {
    const token = bearerMatch[1];
    try {
      const payload = jwt.verify(token, getJwtSecret());
      const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
      if (!sub) {
        return res.status(401).json({
          error: 'Session invalide — reconnectez-vous.'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, name: true, email: true, role: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'Session invalide — compte introuvable.' });
      }

      const role = String(user.role ?? '').trim().toUpperCase();
      req.qhseUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        defaultSiteId: null
      };
      return next();
    } catch {
      return res.status(401).json({ error: 'Session invalide ou expirée' });
    }
  }

  /* X-User-Id ignoré si isXUserIdAllowed() est false (ex. production), même si l’en-tête est envoyé. */
  if (!isXUserIdAllowed()) {
    req.qhseUser = null;
    return next();
  }

  const raw = req.get('x-user-id');
  const id = typeof raw === 'string' ? raw.trim() : '';
  if (!id) {
    req.qhseUser = null;
    return next();
  }
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: { id: true, name: true, email: true, role: true }
    });
    if (!user) {
      req.qhseUser = null;
      const path = (req.originalUrl || '').split('?')[0];
      const usersBootstrap =
        req.method === 'GET' &&
        (path === '/api/users' || /^\/api\/users\/[^/]+$/.test(path));
      if (!usersBootstrap) {
        return res.status(403).json({
          error: 'Profil inconnu — choisissez un utilisateur valide dans l’application.'
        });
      }
      return next();
    }

    req.qhseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: String(user.role ?? '').trim().toUpperCase(),
      defaultSiteId: null
    };
  } catch (err) {
    return next(err);
  }
  next();
}
