import { can } from '../lib/permissions.js';
import { isRequireAuthEnabled } from '../lib/securityConfig.js';

/**
 * Si req.qhseUser est défini, applique la matrice ; sinon selon la politique (dev vs prod).
 * @param {string} resource
 * @param {'read' | 'write'} verb
 */
export function requirePermission(resource, verb) {
  return (req, res, next) => {
    const u = req.qhseUser;
    if (!u) {
      if (isRequireAuthEnabled()) {
        return res.status(401).json({
          error:
            'Authentification requise : connectez-vous avec un jeton Bearer (JWT) valide.'
        });
      }
      return next();
    }
    if (!can(u.role, resource, verb)) {
      return res.status(403).json({
        error: `Permission refusée pour « ${resource} » (${verb}).`
      });
    }
    next();
  };
}
