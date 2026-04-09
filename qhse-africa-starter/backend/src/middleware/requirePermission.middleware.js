import { can } from '../lib/permissions.js';
import { isRequireAuthEnabled } from '../lib/securityConfig.js';

/**
 * Si REQUIRE_AUTH est actif : 401 sans utilisateur, sinon matrice `can(role, resource, verb)`.
 * Si REQUIRE_AUTH est désactivé : `next()` immédiat — aucune lecture de req.qhseUser ni contrôle de permission.
 * @param {string} resource
 * @param {'read' | 'write'} verb
 */
export function requirePermission(resource, verb) {
  return (req, res, next) => {
    if (!isRequireAuthEnabled()) {
      return next();
    }
    const u = req.qhseUser;
    if (!u) {
      return res.status(401).json({
        error:
          'Authentification requise : connectez-vous avec un jeton Bearer (JWT) valide.'
      });
    }
    if (!can(u.role, resource, verb)) {
      return res.status(403).json({
        error: `Permission refusée pour « ${resource} » (${verb}).`
      });
    }
    next();
  };
}
