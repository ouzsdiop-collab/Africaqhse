/**
 * Routes réservées au rôle ADMIN (JWT / session chargée par attachRequestUser).
 */
export function requireAdmin() {
  return (req, res, next) => {
    const u = req.qhseUser;
    if (!u) {
      return res.status(401).json({
        error: 'Authentification requise : connectez-vous avec un compte administrateur.'
      });
    }
    if (String(u.role).trim().toUpperCase() !== 'ADMIN') {
      return res.status(403).json({ error: 'Accès réservé au rôle ADMIN.' });
    }
    next();
  };
}
