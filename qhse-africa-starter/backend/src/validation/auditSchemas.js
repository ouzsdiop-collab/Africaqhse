import { z } from 'zod';

/**
 * Score audit 0–100, arrondi en entier (Prisma `Int`) — pas de 500 sur décimal.
 */
export const auditScoreSchema = z.preprocess(
  (v) => (v === null || v === '' || v === undefined ? undefined : v),
  z.coerce
    .number({
      invalid_type_error: 'score doit être un nombre'
    })
    .refine((n) => Number.isFinite(n) && n >= 0 && n <= 100, {
      message: 'score doit être entre 0 et 100'
    })
    .transform((n) => Math.min(100, Math.max(0, Math.round(n))))
);

/** Score obligatoire (create). */
const auditScoreRequiredSchema = z.preprocess(
  (v) => (v === null || v === '' ? undefined : v),
  z.coerce
    .number({
      invalid_type_error: 'score doit être un nombre'
    })
    .refine((n) => Number.isFinite(n) && n >= 0 && n <= 100, {
      message: 'score doit être entre 0 et 100'
    })
    .transform((n) => Math.min(100, Math.max(0, Math.round(n))))
);

export const createAuditSchema = z
  .object({
    ref: z.string().min(1).max(80),
    site: z.string().min(1).max(120),
    siteId: z.union([z.string(), z.null()]).optional(),
    score: auditScoreRequiredSchema,
    status: z.string().min(1).max(120),
    checklist: z.any().optional(),
    participantEmails: z.array(z.string()).nullish()
  })
  .strict();

export const patchAuditSchema = z
  .object({
    status: z.string().min(1).max(120).optional(),
    score: auditScoreSchema.optional(),
    site: z.string().min(1).max(120).optional(),
    checklist: z.any().optional(),
    siteId: z.union([z.string(), z.null()]).optional()
  })
  .strict();
