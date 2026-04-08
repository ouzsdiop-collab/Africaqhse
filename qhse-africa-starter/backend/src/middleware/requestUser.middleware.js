import jwt from 'jsonwebtoken';
import { prisma } from '../db.js';
import { getJwtSecret } from '../services/auth.service.js';
import { isXUserIdAllowed } from '../lib/securityConfig.js';

/**
 * Charge l’utilisateur et le tenant actif (JWT : sub + tid).
 * Rôle effectif = rôle d’adhésion (`UserTenant.role`) pour ce tenant.
 * X-User-Id (démo) : première adhésion de l’utilisateur.
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
      const sub = typeof payload.sub === 'string' ? payload.sub.trim() : '';
      const tid = typeof payload.tid === 'string' ? payload.tid.trim() : '';
      if (!sub || !tid) {
        return res.status(401).json({
          error: 'Session invalide — reconnectez-vous (contexte organisation requis).'
        });
      }

      const membership = await prisma.userTenant.findUnique({
        where: {
          userId_tenantId: { userId: sub, tenantId: tid }
        },
        include: {
          tenant: { select: { id: true, slug: true, name: true } },
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!membership?.user || !membership.tenant) {
        return res.status(401).json({ error: 'Session invalide ou accès organisation révoqué.' });
      }

      req.qhseTenant = {
        id: membership.tenant.id,
        slug: membership.tenant.slug,
        name: membership.tenant.name
      };
      req.qhseTenantId = membership.tenantId;
      req.qhseUser = {
        id: membership.user.id,
        name: membership.user.name,
        email: membership.user.email,
        role: String(membership.role ?? '').trim().toUpperCase(),
        defaultSiteId: membership.defaultSiteId ?? null
      };
      return next();
    } catch {
      return res.status(401).json({ error: 'Session invalide ou expirée' });
    }
  }

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

    const membership = await prisma.userTenant.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: 'asc' },
      include: { tenant: { select: { id: true, slug: true, name: true } } }
    });
    if (!membership || !membership.tenant) {
      req.qhseUser = null;
      return res.status(403).json({
        error: 'Utilisateur sans organisation — exécutez le seed (tenant + adhésions).'
      });
    }

    req.qhseTenant = {
      id: membership.tenant.id,
      slug: membership.tenant.slug,
      name: membership.tenant.name
    };
    req.qhseTenantId = membership.tenantId;
    req.qhseUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: String(membership.role ?? '').trim().toUpperCase(),
      defaultSiteId: membership.defaultSiteId ?? null
    };
  } catch (err) {
    return next(err);
  }
  next();
}
