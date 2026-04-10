import { Router } from 'express';
import * as controller from '../controllers/users.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { isRequireAuthEnabled } from '../lib/securityConfig.js';

const router = Router();

/**
 * Permet à un utilisateur authentifié de PATCH son propre compte pour l’onboarding uniquement,
 * sans exiger users:write (rôles lecture seule).
 */
function requireUserPatchPermission(req, res, next) {
  if (!isRequireAuthEnabled()) return next();
  const u = req.qhseUser;
  if (!u || typeof u.id !== 'string') {
    return res.status(401).json({
      error:
        'Authentification requise : connectez-vous avec un jeton Bearer (JWT) valide.'
    });
  }
  const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
  if (id !== u.id.trim()) {
    return requirePermission('users', 'write')(req, res, next);
  }
  const body = req.body && typeof req.body === 'object' && !Array.isArray(req.body) ? req.body : {};
  const keys = Object.keys(body);
  const allowed = new Set(['onboardingCompleted', 'onboardingStep']);
  const onlyOnboarding = keys.length > 0 && keys.every((k) => allowed.has(k));
  if (onlyOnboarding) return next();
  return requirePermission('users', 'write')(req, res, next);
}

router.get('/', requirePermission('users', 'read'), controller.getAll);
router.post('/', requirePermission('users', 'write'), controller.create);
router.patch('/:id', requireUserPatchPermission, controller.patchById);
router.delete('/:id', requirePermission('users', 'write'), controller.remove);
router.get('/:id', requirePermission('users', 'read'), controller.getById);

export default router;
