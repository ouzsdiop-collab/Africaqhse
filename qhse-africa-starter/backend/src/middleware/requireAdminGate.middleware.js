import { resolveAdminGateTokenSecret, verifyAdminGateToken } from '../lib/adminGateToken.js';

export function requireAdminGate(req, res, next) {
  const auth = String(req.get('authorization') || req.headers.authorization || '');
  console.info(`[ADMIN_GATE] backend auth header present: ${Boolean(auth)}`);
  if (!auth.startsWith('Bearer ')) {
    console.info('[ADMIN_GATE] backend reject reason: missing_authorization');
    return res.status(401).json({ error: 'Accès admin gate requis.', code: 'ADMIN_GATE_TOKEN_MISSING' });
  }
  const token = auth.slice(7).trim();
  console.info(`[ADMIN_GATE] backend bearer token present: ${Boolean(token)}`);
  console.info(`[ADMIN_GATE] backend token length: ${token ? token.length : 0}`);
  if (!token) {
    console.info('[ADMIN_GATE] backend reject reason: empty_bearer');
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
    console.info(`[ADMIN_GATE] verify result: ${verified.ok ? 'ok' : verified.reason || 'invalid'}`);
    if (!verified.ok) {
      const reason = verified.reason === 'invalid_scope'
        ? 'invalid_scope'
        : verified.reason === 'missing_secret'
          ? 'invalid_token'
          : 'invalid_or_expired';
      console.info(`[ADMIN_GATE] backend reject reason: ${reason}`);
      return res.status(403).json({ error: 'Accès admin expiré. Veuillez ressaisir le code.', code: 'ADMIN_GATE_TOKEN_INVALID' });
    }
    const payload = verified.payload;
    req.adminGate = payload;
    return next();
  } catch {
    return res.status(403).json({ error: 'Accès admin expiré. Veuillez ressaisir le code.', code: 'ADMIN_GATE_TOKEN_INVALID' });
  }
}
