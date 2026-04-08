/**
 * Une ligne JSON par requête terminée (corrélation `requestId`, durée, statut).
 * Activé si `LOG_HTTP=1` ou `true` ; désactivé explicitement avec `LOG_HTTP=0`.
 */
export function httpRequestLog(req, res, next) {
  if (!isHttpLogEnabled()) return next();
  const t0 = Date.now();
  const method = req.method;
  const pathRaw = req.originalUrl || req.url || '';
  const path = pathRaw.split('?')[0] || pathRaw;

  res.on('finish', () => {
    const payload = {
      level: 'info',
      msg: 'http_request',
      method,
      path,
      status: res.statusCode,
      ms: Date.now() - t0,
      requestId: req.requestId,
      userId: req.qhseUser?.id ?? null
    };
    console.log(JSON.stringify(payload));
  });
  next();
}

function isHttpLogEnabled() {
  const v = process.env.LOG_HTTP;
  if (v === '0' || v === 'false') return false;
  if (v === '1' || v === 'true') return true;
  return false;
}
