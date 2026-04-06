import { randomUUID } from 'crypto';

/**
 * Corrélation requête / logs / support client (X-Request-Id).
 */
export function attachRequestId(req, res, next) {
  const id = randomUUID();
  req.requestId = id;
  res.setHeader('X-Request-Id', id);
  next();
}
