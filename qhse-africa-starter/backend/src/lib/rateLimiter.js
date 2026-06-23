import rateLimit from 'express-rate-limit';

/**
 * En CI (suite e2e), une seule IP enchaîne des dizaines de connexions sur les
 * mêmes comptes démo (plusieurs specs Playwright + retries) en quelques minutes ;
 * la limite stricte de prod y déclenche des 429 qui font échouer les tests sans
 * rapport avec le code testé.
 */
const isCi = Boolean(process.env.CI);

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isCi ? 1000 : 10,
  message: { error: 'Trop de tentatives. Reessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

/** Réinitialisation mot de passe — limite plus stricte (anti-énumération / spam). */
export const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Trop de demandes. Reessayez dans 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 200,
  message: { error: 'Limite de requetes atteinte.' },
  standardHeaders: true,
  legacyHeaders: false
});

export const aiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 20,
  message: { error: 'Limite IA atteinte. Patientez 1 minute.' },
  standardHeaders: true,
  legacyHeaders: false
});
