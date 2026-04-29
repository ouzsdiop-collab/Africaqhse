/**
 * Accès réservé au rôle global SUPER_ADMIN (création / gestion clients SaaS).
 * Authentification par JWT Bearer uniquement — jamais via X-User-Id (même en dev).
 */
export function requireSuperAdmin(req, res, next) {
  if (req.qhseAuthSource !== 'bearer') {
    return res.status(401).json({
      error:
        'Authentification super-admin : jeton Bearer (JWT) obligatoire. L’en-tête X-User-Id ne suffit pas.',
      code: 'SUPER_ADMIN_BEARER_REQUIRED'
    });
  }
  if (!req.qhseUser?.id) {
    return res.status(401).json({ error: 'Authentification requise.', code: 'UNAUTHORIZED' });
  }
  const r = String(req.qhseUser.role ?? '').trim().toUpperCase();
  if (r !== 'SUPER_ADMIN') {
    return res.status(403).json({
      error: 'Accès réservé au super administrateur.',
      code: 'FORBIDDEN_SUPER_ADMIN'
    });
  }
  next();
}
