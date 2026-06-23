import rateLimit from 'express-rate-limit';

/**
 * En CI (suite e2e), une seule IP enchaîne des dizaines de specs Playwright en
 * quelques minutes, chacune chargeant plusieurs endpoints (dashboard, near-misses,
 * environnement...) ; les limites strictes de prod y déclenchent des 429 — y compris
 * sur /api/auth/login une fois le budget épuisé — qui font échouer les tests
 * indéfiniment jusqu'à la fin du run (fenêtre de 15 min > durée du job).
 */
const isCi = Boolean(process.env.CI);

/**
 * Limite globale API (réglable par env). Santé exclue.
 */
export const globalApiLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_MAX) || (isCi ? 100_000 : 400),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
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
  max: Number(process.env.RATE_LIMIT_AUTH_MAX) || (isCi ? 1000 : 40),
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false }
});

/** Import documentaire — prévisualisation / upload (POST avec fichier). */
export const importUploadLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_UPLOAD_MAX) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skipSuccessfulRequests: false
});

/** Documents contrôlés — création avec pièce jointe. */
export const controlledDocumentUploadLimiter = rateLimit({
  windowMs: Number(process.env.RATE_LIMIT_UPLOAD_WINDOW_MS) || 15 * 60 * 1000,
  max: Number(process.env.RATE_LIMIT_UPLOAD_MAX) || 60,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skipSuccessfulRequests: false
});

/** Imports (/api/imports/*) — limite POST confirm/preview (ne touche pas les autres routes). */
export const importsWriteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  validate: { xForwardedForHeader: false },
  skipSuccessfulRequests: false,
  handler(req, res) {
    res.status(429).json({
      error: "Trop de requêtes d’import. Patientez quelques minutes puis réessayez."
    });
  }
});
