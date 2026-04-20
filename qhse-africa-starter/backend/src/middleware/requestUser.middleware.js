import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { getJwtSecret } from '../services/auth.service.js';
import * as tenantAuth from '../services/tenantAuth.service.js';
import { DEFAULT_TENANT_ID } from '../lib/tenantConstants.js';
import { isXUserIdAllowed } from '../lib/securityConfig.js';

/**
 * Charge l’utilisateur (JWT : sub + role + tid) et le tenant actif (adhésion vérifiée en base).
 */
export async function attachRequestUser(req, res, next) {
  req.qhseTenant = null;
  req.qhseTenantId = null;

  const authHeader = req.get('authorization') || req.get('Authorization') || '';
  const bearerMatch = /^Bearer\s+(\S+)/i.exec(authHeader);

  if (bearerMatch) {
    const token = bearerMatch[1];
    try {
      const payload = jwt.verify(token, getJwtSecret());
      if (payload.typ === 'pwd_setup') {
        return res.status(403).json({
          error: 'Ce jeton ne permet pas d’accéder à l’API. Utilisez l’écran de changement de mot de passe.',
          code: 'PWD_SETUP_TOKEN_NOT_ALLOWED'
        });
      }
      const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
      if (!sub) {
        return res.status(401).json({
          error: 'Session invalide — reconnectez-vous.'
        });
      }

      const user = await prisma.user.findUnique({
        where: { id: sub },
        select: { id: true, name: true, email: true, role: true, mustChangePassword: true, isActive: true }
      });

      if (!user) {
        return res.status(401).json({ error: 'Session invalide — compte introuvable.' });
      }
      if (!user.isActive) {
        return res.status(403).json({ error: 'Compte désactivé.' });
      }
      if (user.mustChangePassword) {
        return res.status(403).json({
          error: 'Vous devez d’abord définir un nouveau mot de passe.',
          code: 'MUST_CHANGE_PASSWORD'
        });
      }

      const role = String(user.role ?? '').trim().toUpperCase();
      req.qhseUser = {
        id: user.id,
        name: user.name,
        email: user.email,
        role,
        defaultSiteId: null
      };

      let tid = typeof payload.tid === 'string' ? payload.tid.trim() : '';
      if (tid) {
        const tenant = await tenantAuth.assertUserTenantAccess(user.id, tid);
        if (!tenant) {
          return res.status(403).json({
            error: 'Organisation invalide ou accès refusé pour ce jeton. Reconnectez-vous.'
          });
        }
        req.qhseTenantId = tenant.id;
        req.qhseTenant = { id: tenant.id, slug: tenant.slug, name: tenant.name };
      } else {
        const first = await tenantAuth.getFirstTenantForUser(user.id);
        if (!first) {
          return res.status(403).json({
            error: 'Aucune organisation associée à ce compte.'
          });
        }
        req.qhseTenantId = first.id;
        req.qhseTenant = { id: first.id, slug: first.slug, name: first.name };
      }

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
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true, isActive: true }
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

    if (!user.isActive) {
      return res.status(403).json({ error: 'Compte désactivé.' });
    }
    if (user.mustChangePassword) {
      return res.status(403).json({
        error: 'Vous devez d’abord définir un nouveau mot de passe.',
        code: 'MUST_CHANGE_PASSWORD'
      });
    }

    req.qhseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: String(user.role ?? '').trim().toUpperCase(),
      defaultSiteId: null
    };

    let tenant = await tenantAuth.getFirstTenantForUser(user.id);
    if (!tenant) {
      tenant = await tenantAuth.assertUserTenantAccess(user.id, DEFAULT_TENANT_ID);
    }
    if (tenant) {
      req.qhseTenantId = tenant.id;
      req.qhseTenant = { id: tenant.id, slug: tenant.slug, name: tenant.name };
    }
  } catch (err) {
    return next(err);
  }
  next();
}
