import jwt from 'jsonwebtoken';

const ADMIN_GATE_EXPIRES_SECONDS = 45 * 60;

export function resolveAdminGateTokenSecret() {
  const dedicated = String(process.env.QHSE_ADMIN_GATE_TOKEN_SECRET || '').trim();
  if (dedicated) return dedicated;
  return String(process.env.JWT_SECRET || '').trim();
}

export function signAdminGateToken() {
  const secret = resolveAdminGateTokenSecret();
  if (!secret) return null;
  const token = jwt.sign(
    {
      scope: 'admin-gate',
      typ: 'admin-gate'
    },
    secret,
    { expiresIn: `${ADMIN_GATE_EXPIRES_SECONDS}s` }
  );
  return { token, expiresIn: ADMIN_GATE_EXPIRES_SECONDS };
}

export function verifyAdminGateToken(token) {
  const secret = resolveAdminGateTokenSecret();
  if (!secret) return { ok: false, reason: 'missing_secret' };
  try {
    const payload = jwt.verify(token, secret);
    if (!payload || payload.scope !== 'admin-gate') return { ok: false, reason: 'invalid_scope' };
    return { ok: true, payload };
  } catch {
    return { ok: false, reason: 'invalid_token' };
  }
}
