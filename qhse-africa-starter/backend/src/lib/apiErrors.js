/**
 * Enveloppe d’erreur API homogène : `{ error, code?, requestId?, ...extra }`.
 */

/**
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string} message
 * @param {import('express').Request} [req]
 * @param {Record<string, unknown>} [extra]
 */
export function sendJsonError(res, status, message, req, extra = {}) {
  /** @type {Record<string, unknown>} */
  const body = { error: message, ...extra };
  if (req?.requestId) body.requestId = req.requestId;
  return res.status(status).json(body);
}
