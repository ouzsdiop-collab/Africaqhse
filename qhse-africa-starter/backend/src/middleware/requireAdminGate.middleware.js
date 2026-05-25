import { resolveAdminGateTokenSecret, verifyAdminGateToken } from '../lib/adminGateToken.js';

export function requireAdminGate(req, res, next) {
  const auth = String(req.headers.authorization || '');
  if (!auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Accès admin gate requis.', code: 'ADMIN_GATE_TOKEN_MISSING' });
  }
  const token = auth.slice(7).trim();
  if (!token) {
    return res.status(401).json({ error: 'Accès admin gate requis.', code: 'ADMIN_GATE_TOKEN_MISSING' });
  }

  const secret = resolveAdminGateTokenSecret();
  if (!secret) {
    return res.status(503).json({
      error: 'Configuration admin indisponible.',
      code: 'ADMIN_GATE_CONFIG_MISSING'
    });
  }

  try {
    const verified = verifyAdminGateToken(token);
    if (!verified.ok) {
      return res.status(403).json({ error: 'Accès admin expiré. Veuillez ressaisir le code.', code: 'ADMIN_GATE_TOKEN_INVALID' });
    }
    const payload = verified.payload;
    req.adminGate = payload;
    return next();
  } catch {
    return res.status(403).json({ error: 'Accès admin expiré. Veuillez ressaisir le code.', code: 'ADMIN_GATE_TOKEN_INVALID' });
  }
}
