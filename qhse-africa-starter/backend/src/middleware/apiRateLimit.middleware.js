import rateLimit from 'express-rate-limit';

/**
 * Limite globale API (réglable par env). Santé exclue.
 */
export const globalApiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || 400,
  standardHeaders: true,
  legacyHeaders: false,
  skip(req) {
    const u = req.originalUrl || req.url || '';
    const p = req.path || '';
    return u.includes('/api/health') || p === '/health' || p.endsWith('/health');
  }
});

/**
 * Renforce POST /api/auth/login contre le bruteforce.
 */
export const authLoginLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_AUTH_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || 40,
  standardHeaders: true,
  legacyHeaders: false
});

/** Import documentaire — prévisualisation / upload (POST avec fichier). */
export const importUploadLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_UPLOAD_MAX) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});

/** Documents contrôlés — création avec pièce jointe. */
export const controlledDocumentUploadLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_UPLOAD_MAX) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: false
});
