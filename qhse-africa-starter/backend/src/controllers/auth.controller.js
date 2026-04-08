import * as authService from '../services/auth.service.js';
import { loginBodySchema } from '../validation/authSchemas.js';
import { sendJsonError } from '../lib/apiErrors.js';

function tenantsPayloadForUser(role) {
  return [
    {
      id: authService.MONO_ORG.id,
      slug: authService.MONO_ORG.slug,
      name: authService.MONO_ORG.name,
      role: String(role ?? '').trim().toUpperCase()
    }
  ];
}

export async function login(req, res, next) {
  try {
    const parsed = loginBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Données de connexion invalides', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }
    const { email, password } = parsed.data;
    const em = email.toLowerCase();

    const user = await authService.authenticateWithEmailPassword(em, password);
    if (!user) {
      return sendJsonError(res, 401, 'Identifiants invalides', req, { code: 'AUTH_INVALID' });
    }

    const role = String(user.role ?? '').trim().toUpperCase();
    const token = authService.issueAccessToken(user);

    res.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role
      },
      tenant: authService.MONO_ORG,
      tenants: tenantsPayloadForUser(role),
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
 * POST /api/auth/switch-tenant — V1 : réémet un jeton (aucun changement d’organisation).
 */
export async function postSwitchTenant(req, res, next) {
  try {
    if (!req.qhseUser?.id) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    const role = String(req.qhseUser.role ?? '').trim().toUpperCase();
    const token = authService.issueAccessToken({
      id: req.qhseUser.id,
      name: req.qhseUser.name,
      email: req.qhseUser.email,
      role
    });
    res.json({
      user: {
        id: req.qhseUser.id,
        name: req.qhseUser.name,
        email: req.qhseUser.email,
        role
      },
      tenant: authService.MONO_ORG,
      tenants: tenantsPayloadForUser(role),
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
    res.json({
      user: {
        id,
        name,
        email,
        role
      },
      tenant: req.qhseTenant,
      tenants: tenantsPayloadForUser(role)
    });
  } catch (err) {
    next(err);
  }
}
