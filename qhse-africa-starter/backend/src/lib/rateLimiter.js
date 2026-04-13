import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
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
