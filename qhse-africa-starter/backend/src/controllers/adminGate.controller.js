import { timingSafeEqual } from 'crypto';
import { sendJsonError } from '../lib/apiErrors.js';
import { adminGateLoginBodySchema } from '../validation/adminGateSchemas.js';

function safeCodeEquals(a, b) {
  const ab = Buffer.from(String(a), 'utf8');
  const bb = Buffer.from(String(b), 'utf8');
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export async function loginAdminGate(req, res) {
  const parsed = adminGateLoginBodySchema.safeParse(req.body ?? {});
  if (!parsed.success) {
    return sendJsonError(res, 422, 'Données invalides', req, {
      code: 'VALIDATION_ERROR',
      fieldErrors: parsed.error.flatten().fieldErrors
    });
  }

  const expected = String(process.env.QHSE_ADMIN_GATE_CODE || '');
  if (!expected.trim()) {
    return sendJsonError(res, 503, 'Configuration admin indisponible.', req, {
      code: 'ADMIN_GATE_CONFIG_MISSING'
    });
  }

  if (!safeCodeEquals(parsed.data.code, expected)) {
    return sendJsonError(res, 401, 'Code d’accès incorrect.', req, {
      code: 'ADMIN_GATE_INVALID_CODE'
    });
  }

  return res.json({ ok: true });
}
