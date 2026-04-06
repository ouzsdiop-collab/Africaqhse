import * as authService from '../services/auth.service.js';

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'E-mail et mot de passe requis' });
    }
    const em = email.trim().toLowerCase();
    if (em === '' || password.length === 0) {
      return res.status(400).json({ error: 'E-mail et mot de passe requis' });
    }
    if (em.length > 254) {
      return res.status(400).json({ error: 'E-mail trop long' });
    }
    if (password.length > 128) {
      return res.status(400).json({ error: 'Mot de passe trop long' });
    }

    const user = await authService.authenticateWithEmailPassword(em, password);
    if (!user) {
      return res.status(401).json({ error: 'Identifiants invalides' });
    }

    const token = authService.issueAccessToken(user);
    res.json({ user, token });
  } catch (err) {
    next(err);
  }
}

export function logout(req, res) {
  res.status(204).send();
}

export function getMe(req, res) {
  if (!req.qhseUser) {
    return res.status(401).json({ error: 'Non authentifié' });
  }
  const { id, name, email, role } = req.qhseUser;
  res.json({
    user: {
      id,
      name,
      email,
      role
    }
  });
}
