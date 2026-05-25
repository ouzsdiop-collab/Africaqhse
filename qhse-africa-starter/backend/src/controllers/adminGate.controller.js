import { timingSafeEqual } from 'crypto';
import { sendJsonError } from '../lib/apiErrors.js';
import { adminGateLoginBodySchema } from '../validation/adminGateSchemas.js';
import {
  listClients,
  createClient,
  patchTenant,
  createTenantUser,
  patchTenantUser,
  resetUserPassword
} from './admin.controller.js';
import { signAdminGateToken, resolveAdminGateTokenSecret } from '../lib/adminGateToken.js';

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

  const expected = String(process.env.QHSE_ADMIN_GATE_CODE || '').trim();
  const receivedCode = String(parsed.data.code || '').trim();
  const envConfigured = expected.length > 0;

  console.info(`[ADMIN_GATE] env configured: ${envConfigured}`);
  console.info(`[ADMIN_GATE] code length received: ${receivedCode.length}`);
  console.info(`[ADMIN_GATE] expected length: ${expected.length}`);

  if (!envConfigured) {
    return sendJsonError(res, 503, 'Configuration admin indisponible.', req, {
      code: 'ADMIN_GATE_CONFIG_MISSING'
    });
  }

  if (!safeCodeEquals(receivedCode, expected)) {
    return sendJsonError(res, 403, 'Code d’accès incorrect.', req, {
      code: 'ADMIN_GATE_INVALID_CODE'
    });
  }

  const tokenSecretConfigured = Boolean(resolveAdminGateTokenSecret());
  if (!tokenSecretConfigured) {
    return sendJsonError(res, 503, 'Configuration admin indisponible.', req, {
      code: 'ADMIN_GATE_CONFIG_MISSING'
    });
  }
  const signed = signAdminGateToken();
  if (!signed?.token) {
    return sendJsonError(res, 503, 'Configuration admin indisponible.', req, {
      code: 'ADMIN_GATE_CONFIG_MISSING'
    });
  }
  return res.json({ ok: true, token: signed.token, expiresIn: signed.expiresIn });
}

export const listGateClients = listClients;
export const createGateClient = createClient;
export const patchGateClient = patchTenant;
export const createGateTenantUser = createTenantUser;
export const patchGateTenantUser = patchTenantUser;
export const resetGateUserPassword = resetUserPassword;
