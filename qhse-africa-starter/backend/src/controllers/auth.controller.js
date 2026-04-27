import * as authService from '../services/auth.service.js';
import * as tenantAuth from '../services/tenantAuth.service.js';
import { prisma } from '../db.js';
import {
  loginBodySchema,
  forgotPasswordBodySchema,
  resetPasswordBodySchema,
  changeTemporaryPasswordBodySchema
} from '../validation/authSchemas.js';
import { sendJsonError } from '../lib/apiErrors.js';
import * as emailService from '../services/email.service.js';

/** Nom du cookie httpOnly pour le refresh JWT (aligné ÉTAPE 1 H3-14). */
export const QHSE_REFRESH_COOKIE = 'qhse_refresh';

/**
 * `lax` par défaut : meilleure compatibilité front et API sur des sous-domaines distincts (ex. Railway)
 * tout en restant raisonnable côté CSRF. `none` + Secure si `AUTH_REFRESH_COOKIE_SAMESITE=none`
 * (cross-site explicite, ex. domaines complètement différents).
 */
function refreshCookieOptions() {
  const raw = String(process.env.AUTH_REFRESH_COOKIE_SAMESITE ?? '')
    .trim()
    .toLowerCase();
  const sameSite = raw === 'strict' ? 'strict' : raw === 'none' ? 'none' : 'lax';
  const secureEnv = String(process.env.AUTH_REFRESH_COOKIE_SECURE ?? '').trim().toLowerCase();
  const secure =
    secureEnv === 'true' || secureEnv === '1'
      ? true
      : secureEnv === 'false' || secureEnv === '0'
        ? false
        : sameSite === 'none'
          ? true
          : process.env.NODE_ENV === 'production';
  const domainRaw = String(process.env.AUTH_REFRESH_COOKIE_DOMAIN ?? '').trim();
  return {
    httpOnly: true,
    secure,
    sameSite,
    maxAge: 30 * 24 * 60 * 60 * 1000,
    path: '/',
    ...(domainRaw ? { domain: domainRaw } : {})
  };
}

function clearRefreshCookieOptions() {
  const raw = String(process.env.AUTH_REFRESH_COOKIE_SAMESITE ?? '')
    .trim()
    .toLowerCase();
  const sameSite = raw === 'strict' ? 'strict' : raw === 'none' ? 'none' : 'lax';
  const secureEnv = String(process.env.AUTH_REFRESH_COOKIE_SECURE ?? '').trim().toLowerCase();
  const secure =
    secureEnv === 'true' || secureEnv === '1'
      ? true
      : secureEnv === 'false' || secureEnv === '0'
        ? false
        : sameSite === 'none'
          ? true
          : process.env.NODE_ENV === 'production';
  const domainRaw = String(process.env.AUTH_REFRESH_COOKIE_DOMAIN ?? '').trim();
  return {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    ...(domainRaw ? { domain: domainRaw } : {})
  };
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
    const { identifier, password, tenantSlug } = parsed.data;

    const authResult = await authService.authenticateWithIdentifierAndPassword(identifier, password);
    if (!authResult) {
      return sendJsonError(res, 401, 'Identifiants invalides', req, { code: 'AUTH_INVALID' });
    }
    if ('code' in authResult && authResult.code === 'PROVISIONAL_EXPIRED') {
      return sendJsonError(
        res,
        403,
        'Le mot de passe provisoire a expiré. Contactez votre administrateur pour une réinitialisation.',
        req,
        { code: 'PROVISIONAL_PASSWORD_EXPIRED' }
      );
    }

    const user = authResult;
    const role = String(user.role ?? '').trim().toUpperCase();
    const resolved = await tenantAuth.resolveTenantForLogin(user.id, tenantSlug);

    if (!resolved) {
      return sendJsonError(res, 403, 'Aucune organisation associée à ce compte.', req, {
        code: 'NO_TENANT'
      });
    }

    if (resolved.mode === 'pick') {
      return res.status(409).json({
        error: 'Choisissez une organisation pour continuer.',
        code: 'TENANT_CHOICE_REQUIRED',
        tenants: resolved.tenants
      });
    }

    const { tenant } = resolved;

    if (user.mustChangePassword) {
      const changePasswordToken = authService.issuePasswordSetupToken(user.id, tenant.id);
      const tenants = await tenantAuth.listTenantsForUser(user.id);
      return res.json({
        success: true,
        mustChangePassword: true,
        changePasswordToken,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role
        },
        tenant,
        tenants
      });
    }

    const accessToken = authService.issueAccessToken(user, tenant.id);
    const refreshToken = authService.issueRefreshToken(user, tenant.id);

    res.cookie(QHSE_REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    const tenants = await tenantAuth.listTenantsForUser(user.id);

    await prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
      .catch(() => {});

    res.json({
      accessToken,
      expiresIn: 3600,
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role
      },
      tenant,
      tenants
    });
  } catch (err) {
    next(err);
  }
}

export async function logoutHandler(req, res, next) {
  try {
    const fromCookie = req.cookies?.[QHSE_REFRESH_COOKIE];
    const fromBody =
      typeof req.body?.refreshToken === 'string' ? req.body.refreshToken.trim() : '';
    const raw = fromCookie || fromBody;
    if (raw) {
      await authService.revokeRefreshToken(raw);
    }
    res.clearCookie(QHSE_REFRESH_COOKIE, clearRefreshCookieOptions());
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/refresh — lit le refresh uniquement depuis le cookie httpOnly.
 */
export async function refreshHandler(req, res, next) {
  try {
    const refreshToken = req.cookies?.[QHSE_REFRESH_COOKIE];
    if (!refreshToken || typeof refreshToken !== 'string') {
      return res.status(401).json({ error: 'Token manquant' });
    }

    const payload = authService.verifyRefreshToken(refreshToken);
    if (!payload || typeof payload.sub !== 'string') {
      return res.status(401).json({ error: 'Refresh token invalide ou expire.' });
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, name: true, email: true, role: true, mustChangePassword: true, isActive: true }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Compte introuvable ou désactivé.' });
    }
    if (user.mustChangePassword) {
      res.clearCookie(QHSE_REFRESH_COOKIE, clearRefreshCookieOptions());
      return res.status(403).json({
        error: 'Vous devez d’abord définir un nouveau mot de passe.',
        code: 'MUST_CHANGE_PASSWORD'
      });
    }

    let activeTenantId = typeof payload.tid === 'string' ? payload.tid.trim() : '';
    if (activeTenantId) {
      const t = await tenantAuth.assertUserTenantAccess(user.id, activeTenantId);
      if (!t) {
        const first = await tenantAuth.getFirstTenantForUser(user.id);
        if (!first) {
          return res.status(401).json({ error: 'Aucune organisation valide pour ce compte.' });
        }
        activeTenantId = first.id;
      }
    } else {
      const first = await tenantAuth.getFirstTenantForUser(user.id);
      if (!first) {
        return res.status(401).json({ error: 'Aucune organisation pour ce compte.' });
      }
      activeTenantId = first.id;
    }

    const accessToken = authService.issueAccessToken(user, activeTenantId);
    const newRefreshToken = authService.issueRefreshToken(user, activeTenantId);

    res.cookie(QHSE_REFRESH_COOKIE, newRefreshToken, refreshCookieOptions());

    res.json({
      accessToken,
      expiresIn: 3600,
      token: accessToken
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/switch-tenant — réémet access + refresh pour l’organisation choisie.
 */
export async function postSwitchTenant(req, res, next) {
  try {
    if (!req.qhseUser?.id) {
      return res.status(401).json({ error: 'Non authentifié' });
    }
    const slug = String(req.body?.tenantSlug ?? '')
      .trim()
      .toLowerCase();
    if (!slug) {
      return res.status(400).json({ error: 'tenantSlug requis' });
    }

    const tenant = await prisma.tenant.findUnique({
      where: { slug },
      select: { id: true, slug: true, name: true }
    });
    if (!tenant) {
      return res.status(404).json({ error: 'Organisation introuvable.' });
    }

    const allowed = await tenantAuth.assertUserTenantAccess(req.qhseUser.id, tenant.id);
    if (!allowed) {
      return res.status(403).json({ error: 'Accès refusé pour cette organisation.' });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: req.qhseUser.id },
      select: { mustChangePassword: true, isActive: true }
    });
    if (!dbUser?.isActive) {
      return res.status(403).json({ error: 'Compte désactivé.' });
    }
    if (dbUser.mustChangePassword) {
      return res.status(403).json({
        error: 'Définissez d’abord votre mot de définitif avant de changer d’organisation.',
        code: 'MUST_CHANGE_PASSWORD'
      });
    }

    const role = String(req.qhseUser.role ?? '').trim().toUpperCase();
    const userPayload = {
      id: req.qhseUser.id,
      name: req.qhseUser.name,
      email: req.qhseUser.email,
      role
    };

    const accessToken = authService.issueAccessToken(userPayload, tenant.id);
    const refreshToken = authService.issueRefreshToken({ id: req.qhseUser.id }, tenant.id);

    res.cookie(QHSE_REFRESH_COOKIE, refreshToken, refreshCookieOptions());

    const tenants = await tenantAuth.listTenantsForUser(req.qhseUser.id);

    res.json({
      user: {
        id: req.qhseUser.id,
        name: req.qhseUser.name,
        email: req.qhseUser.email,
        role
      },
      tenant,
      tenants,
      token: accessToken,
      accessToken
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
    const tenants = await tenantAuth.listTenantsForUser(id);
    res.json({
      user: {
        id,
        name,
        email,
        role,
        mustChangePassword: false
      },
      tenant: req.qhseTenant,
      tenants
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/change-temporary-password — après login avec mot de passe provisoire.
 */
export async function changeTemporaryPassword(req, res, next) {
  try {
    const parsed = changeTemporaryPasswordBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Données invalides', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }
    const { changePasswordToken, newPassword, confirmPassword } = parsed.data;
    if (confirmPassword != null && confirmPassword !== '' && confirmPassword !== newPassword) {
      return sendJsonError(res, 422, 'Les mots de passe ne correspondent pas.', req, {
        code: 'PASSWORD_MISMATCH'
      });
    }

    const result = await authService.fulfillMandatoryPasswordChange(changePasswordToken, newPassword);
    if (!result.ok) {
      if (result.code === 'password_policy' && result.message) {
        return res.status(422).json({ error: result.message, code: 'PASSWORD_POLICY' });
      }
      /** @type {Record<string, [number, string]>} */
      const map = {
        invalid_setup_token: [400, 'Session de changement invalide ou expirée. Reconnectez-vous.'],
        account_inactive: [403, 'Compte désactivé.'],
        no_change_required: [400, 'Aucun changement obligatoire en cours pour ce compte.'],
        tenant_mismatch: [400, 'Jeton incohérent avec l’organisation.']
      };
      const m = map[result.code] || [400, 'Changement impossible.'];
      return res.status(m[0]).json({ error: m[1], code: result.code.toUpperCase() });
    }

    const { user } = result;
    const resolved = await tenantAuth.resolveTenantForLogin(user.id, undefined);
    if (!resolved || resolved.mode !== 'ok') {
      return res.status(500).json({ error: 'Organisation introuvable après mise à jour.' });
    }
    const { tenant } = resolved;
    const accessToken = authService.issueAccessToken(user, tenant.id);
    const refreshToken = authService.issueRefreshToken(user, tenant.id);
    res.cookie(QHSE_REFRESH_COOKIE, refreshToken, refreshCookieOptions());
    const tenants = await tenantAuth.listTenantsForUser(user.id);
    const role = String(user.role ?? '').trim().toUpperCase();

    await prisma.user
      .update({
        where: { id: user.id },
        data: { lastLoginAt: new Date() }
      })
      .catch(() => {});

    res.json({
      success: true,
      accessToken,
      expiresIn: 3600,
      token: accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role
      },
      tenant,
      tenants
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/forgot-password — réponse uniforme (pas d’énumération des comptes).
 */
export async function forgotPassword(req, res, next) {
  try {
    const parsed = forgotPasswordBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Adresse e-mail invalide', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }
    const email = parsed.data.email;

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, email: true }
    });

    if (user?.passwordHash) {
      const created = await authService.createPasswordResetToken(user.id);
      if (created?.rawToken) {
        const base = emailService.getFrontendBaseUrl();
        const resetUrl = `${base}/#reset-password?token=${encodeURIComponent(created.rawToken)}`;
        try {
          await emailService.sendPasswordResetEmail(user.email, resetUrl);
        } catch (e) {
          console.error('[auth] Envoi e-mail réinitialisation impossible :', e?.message || e);
        }
      }
    }

    res.json({
      ok: true,
      message:
        'Si un compte existe pour cette adresse, un e-mail de réinitialisation a été envoyé (valide 1 h).'
    });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/auth/reset-password
 */
export async function resetPassword(req, res, next) {
  try {
    const parsed = resetPasswordBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Données invalides', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }
    const { token, password } = parsed.data;
    const result = await authService.consumePasswordResetToken(token, password);
    if (!result.ok) {
      if (result.code === 'password_policy' && result.message) {
        return res.status(422).json({ error: result.message, code: 'PASSWORD_POLICY' });
      }
      return res.status(400).json({
        error: 'Lien invalide ou expiré. Demandez une nouvelle réinitialisation.',
        code: 'RESET_INVALID'
      });
    }
    res.json({ ok: true, message: 'Mot de passe mis à jour. Vous pouvez vous connecter.' });
  } catch (err) {
    next(err);
  }
}
