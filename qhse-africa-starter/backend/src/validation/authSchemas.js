import { z } from 'zod';

/** Connexion : e-mail (champ legacy `email`) ou identifiant unique `identifier` (e-mail ou clientCode). */
export const loginBodySchema = z
  .object({
    identifier: z.string().trim().max(200).optional(),
    email: z.string().trim().max(254).optional(),
    password: z
      .string({ required_error: 'Mot de passe requis' })
      .min(1, 'Mot de passe requis')
      .max(128, 'Mot de passe trop long'),
    tenantSlug: z.preprocess(
      (v) => (v === '' || v === null || v === undefined ? undefined : v),
      z.string().trim().max(120).optional()
    )
  })
  .superRefine((data, ctx) => {
    const raw = String(data.identifier ?? data.email ?? '').trim();
    if (!raw) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'E-mail ou identifiant requis',
        path: ['identifier']
      });
      return;
    }
    const usedIdentifierKey =
      data.identifier != null && String(data.identifier).trim() !== '';
    if (raw.includes('@')) {
      const er = z.string().email('E-mail invalide').safeParse(raw);
      if (!er.success) {
        for (const iss of er.error.issues) {
          ctx.addIssue({ ...iss, path: ['email'] });
        }
      }
    } else {
      if (!usedIdentifierKey && data.email != null && String(data.email).trim() !== '') {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'E-mail invalide',
          path: ['email']
        });
        return;
      }
      const code = raw.toLowerCase();
      if (code.length < 3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Identifiant trop court',
          path: ['identifier']
        });
      }
      if (!/^[a-z0-9-]+$/.test(code)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Identifiant client : lettres minuscules, chiffres et tirets uniquement',
          path: ['identifier']
        });
      }
    }
  })
  .transform((data) => {
    const raw = String(data.identifier ?? data.email ?? '').trim();
    const identifier = raw.toLowerCase();
    return {
      identifier,
      password: data.password,
      tenantSlug: data.tenantSlug,
      /** Rétrocompat : même valeur que `identifier` lorsque c’est un e-mail. */
      email: identifier.includes('@') ? identifier : undefined
    };
  });

export const changeTemporaryPasswordBodySchema = z.object({
  changePasswordToken: z.string().trim().min(20, 'Jeton requis'),
  newPassword: z
    .string({ required_error: 'Mot de passe requis' })
    .min(1, 'Mot de passe requis')
    .max(128, 'Mot de passe trop long'),
  confirmPassword: z.string().trim().max(128).optional()
});

export const forgotPasswordBodySchema = z.object({
  email: z
    .string({ required_error: 'E-mail requis' })
    .trim()
    .min(1, 'E-mail requis')
    .max(254, 'E-mail trop long')
    .email('E-mail invalide')
    .transform((s) => s.toLowerCase())
});

export const resetPasswordBodySchema = z.object({
  token: z.string().trim().min(16, 'Jeton requis'),
  password: z
    .string({ required_error: 'Mot de passe requis' })
    .min(1, 'Mot de passe requis')
    .max(128, 'Mot de passe trop long')
});
