import * as mfaService from '../services/mfa.service.js';
import { sendJsonError } from '../lib/apiErrors.js';

function requireUser(req, res) {
  const u = req.qhseUser;
  if (!u?.id) {
    sendJsonError(res, 401, 'Authentification requise.', req, { code: 'AUTH_REQUIRED' });
    return null;
  }
  return u;
}

/** POST /api/mfa/enroll — démarre l'enrôlement, retourne le secret + l'URI à encoder en QR code. */
export async function startEnrollment(req, res, next) {
  try {
    const u = requireUser(req, res);
    if (!u) return;
    const result = await mfaService.startMfaEnrollment(u.id, u.email);
    res.json(result);
  } catch (err) {
    if (err.statusCode === 400) return sendJsonError(res, 400, err.message, req, { code: 'MFA_ALREADY_ENABLED' });
    next(err);
  }
}

/** POST /api/mfa/confirm — confirme l'enrôlement avec un premier code TOTP, active le MFA. */
export async function confirmEnrollment(req, res, next) {
  try {
    const u = requireUser(req, res);
    if (!u) return;
    const token = String(req.body?.token ?? '').trim();
    if (!token) {
      return sendJsonError(res, 422, 'Code requis.', req, { code: 'VALIDATION_ERROR' });
    }
    const result = await mfaService.confirmMfaEnrollment(u.id, token);
    if (!result.ok) {
      return sendJsonError(res, 401, 'Code invalide.', req, { code: 'MFA_INVALID_TOKEN' });
    }
    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** POST /api/mfa/disable — désactive le MFA pour le compte authentifié. */
export async function disable(req, res, next) {
  try {
    const u = requireUser(req, res);
    if (!u) return;
    await mfaService.disableMfa(u.id);
    res.json({ ok: true });
  } catch (err) {
    next(err);
  }
}
