/** Aligné sur `backend/src/lib/validation.js` — garder les messages identiques. */

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

/**
 * @param {unknown} password
 * @returns {{ ok: true } | { ok: false, error: string }}
 */
export function validatePasswordPolicy(password) {
  const p = String(password ?? '');
  if (p.length < PASSWORD_MIN_LENGTH) {
    return {
      ok: false,
      error: `Mot de passe trop court (minimum ${PASSWORD_MIN_LENGTH} caractères)`
    };
  }
  if (p.length > PASSWORD_MAX_LENGTH) {
    return { ok: false, error: 'Mot de passe trop long' };
  }
  if (!/\p{L}/u.test(p)) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins une lettre' };
  }
  if (!/\d/.test(p)) {
    return { ok: false, error: 'Le mot de passe doit contenir au moins un chiffre' };
  }
  return { ok: true };
}
