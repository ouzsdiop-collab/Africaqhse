/**
 * Accès réservé au rôle global SUPER_ADMIN (création / gestion clients SaaS).
 */
export function requireSuperAdmin(req, res, next) {
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
