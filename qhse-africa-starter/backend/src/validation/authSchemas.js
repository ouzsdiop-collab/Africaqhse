import { z } from 'zod';

export const loginBodySchema = z.object({
  email: z
    .string({ required_error: 'E-mail requis' })
    .trim()
    .min(1, 'E-mail requis')
    .max(254, 'E-mail trop long')
    .email('E-mail invalide'),
  password: z
    .string({ required_error: 'Mot de passe requis' })
    .min(1, 'Mot de passe requis')
    .max(128, 'Mot de passe trop long'),
  tenantSlug: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : v),
    z.string().trim().max(120).optional()
  )
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
