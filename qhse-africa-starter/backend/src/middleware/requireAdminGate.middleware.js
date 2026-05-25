import jwt from 'jsonwebtoken';

function getAdminGateTokenSecret() {
  const dedicated = String(process.env.QHSE_ADMIN_GATE_TOKEN_SECRET || '').trim();
  if (dedicated) return dedicated;
  return String(process.env.JWT_SECRET || '').trim();
}

export function requireAdminGate(req, res, next) {
  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès admin gate requis.', code: 'ADMIN_GATE_TOKEN_MISSING' });
  }
  const token = auth.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Accès admin gate requis.', code: 'ADMIN_GATE_TOKEN_MISSING' });
  }

  const secret = getAdminGateTokenSecret();
  if (!secret) {
    return res.status(503).json({
      error: 'Configuration admin indisponible.',
      code: 'ADMIN_GATE_CONFIG_MISSING'
    });
  }

  try {
    const payload = jwt.verify(token, secret);
    if (!payload || payload.scope !== 'admin-gate') {
      return res.status(403).json({ error: 'Accès admin expiré. Veuillez ressaisir le code.', code: 'ADMIN_GATE_TOKEN_INVALID' });
    }
    req.adminGate = payload;
    return next();
  } catch {
    return res.status(403).json({ error: 'Accès admin expiré. Veuillez ressaisir le code.', code: 'ADMIN_GATE_TOKEN_INVALID' });
  }
}
