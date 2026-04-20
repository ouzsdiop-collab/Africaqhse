import { z } from 'zod';

export const adminCreateClientBodySchema = z.object({
  companyName: z.string().trim().min(2, 'Nom entreprise trop court').max(200),
  contactName: z.string().trim().min(2, 'Nom contact trop court').max(120),
  email: z
    .string()
    .trim()
    .email('E-mail invalide')
    .max(254)
    .transform((s) => s.toLowerCase()),
  clientCode: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : String(v).trim().toLowerCase()),
    z
      .string()
      .min(3, 'Identifiant client : minimum 3 caractères')
      .max(40)
      .regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement')
      .optional()
  )
});
