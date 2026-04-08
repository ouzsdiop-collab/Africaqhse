import * as authService from '../services/auth.service.js';
import { loginBodySchema } from '../validation/authSchemas.js';
import { sendJsonError } from '../lib/apiErrors.js';

export async function login(req, res, next) {
  try {
    const parsed = loginBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Données de connexion invalides', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }
    const { email, password, tenantSlug } = parsed.data;
    const em = email.toLowerCase();

    const user = await authService.authenticateWithEmailPassword(em, password);
    if (!user) {
      return sendJsonError(res, 401, 'Identifiants invalides', req, { code: 'AUTH_INVALID' });
    }

    const resolved = await authService.resolveActiveMembership(
      user.id,
      tenantSlug ?? undefined
    );
    if (resolved.kind === 'no_membership') {
      return sendJsonError(
        res,
        403,
        'Aucune organisation associée à ce compte — contactez l’administrateur.',
        req,
        { code: 'NO_MEMBERSHIP' }
      );
    }
    if (resolved.kind === 'unknown_tenant') {
      return sendJsonError(res, 400, 'Organisation inconnue ou non autorisée.', req, {
        code: 'UNKNOWN_TENANT',
        tenants: resolved.tenants
      });
    }
    if (resolved.kind === 'tenant_required') {
      return sendJsonError(
        res,
        409,
        'Précisez l’organisation (slug) — plusieurs comptes disponibles.',
        req,
        { code: 'TENANT_REQUIRED', tenants: resolved.tenants }
      );
    }

    const m = resolved.membership;
    const role = String(m.role ?? '').trim().toUpperCase();
    const token = authService.issueAccessToken(
      { id: user.id, name: user.name, email: user.email, role },
      m.tenantId
    );

    const all = await authService.listUserTenants(user.id);
    const tenantsPayload = all.map((x) => ({
      id: x.tenant.id,
      slug: x.tenant.slug,
      name: x.tenant.name,
      role: String(x.role ?? '').trim().toUpperCase()
    }));

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role
      },
      tenant: {
        id: m.tenant.id,
        slug: m.tenant.slug,
        name: m.tenant.name
      },
      tenants: tenantsPayload,
      token
    });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.status(204).send();
}

/**
 * POST /api/auth/switch-tenant — nouveau JWT pour une autre adhésion (corps : { tenantSlug }).
 */
export async function postSwitchTenant(req, res, next) {
  try {
    if (!req.qhseUser?.id) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    const { tenantSlug } = req.body || {};
    const resolved = await authService.resolveActiveMembership(req.qhseUser.id, tenantSlug);
    if (resolved.kind === 'no_membership') {
      return res.status(403).json({
        error: 'Aucune organisation associée à ce compte.'
      });
    }
    if (resolved.kind === 'unknown_tenant') {
      return res.status(400).json({
        error: 'Organisation inconnue ou non autorisée.',
        tenants: resolved.tenants
      });
    }
    if (resolved.kind === 'tenant_required') {
      return res.status(409).json({
        error: 'Précisez l’organisation (slug) — plusieurs comptes disponibles.',
        tenants: resolved.tenants
      });
    }
    const m = resolved.membership;
    const role = String(m.role ?? '').trim().toUpperCase();
    const token = authService.issueAccessToken(
      {
        id: req.qhseUser.id,
        name: req.qhseUser.name,
        email: req.qhseUser.email,
        role
      },
      m.tenantId
    );
    const all = await authService.listUserTenants(req.qhseUser.id);
    const tenantsPayload = all.map((x) => ({
      id: x.tenant.id,
      slug: x.tenant.slug,
      name: x.tenant.name,
      role: String(x.role ?? '').trim().toUpperCase()
    }));
    res.json({
      user: {
        id: req.qhseUser.id,
        name: req.qhseUser.name,
        email: req.qhseUser.email,
        role
      },
      tenant: {
        id: m.tenant.id,
        slug: m.tenant.slug,
        name: m.tenant.name
      },
      tenants: tenantsPayload,
      token
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(req, res, next) {
  try {
    if (!req.qhseUser || !req.qhseTenant) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    const { id, name, email, role } = req.qhseUser;
    const all = await authService.listUserTenants(id);
    const tenantsPayload = all.map((x) => ({
      id: x.tenant.id,
      slug: x.tenant.slug,
      name: x.tenant.name,
      role: String(x.role ?? '').trim().toUpperCase()
    }));
    res.json({
      user: {
        id,
        name,
        email,
        role
      },
      tenant: req.qhseTenant,
      tenants: tenantsPayload
    });
  } catch (err) {
    next(err);
  }
}
