/**
 * Contrats API — le front existant consomme surtout du JSON brut ({ error } | entités).
 * Ces helpers gardent ce comportement tout en centralisant les extensions (requestId).
 */

/**
 * @param {import('express').Response} res
 * @param {unknown} data
 */
export function sendJson(res, data) {
  return res.json(data);
}

/**
 * @param {import('express').Response} res
 * @param {number} status
 * @param {string} message
 * @param {string} [code]
 */
export function sendErrorJson(res, status, message, code) {
  /** @type {Record<string, string>} */
  const body = { error: message };
  if (code) body.code = code;
  return res.status(status).json(body);
}
