import { z } from 'zod';

export const createControlledDocumentSchema = z
  .object({
    name: z.string().min(1),
    type: z.string().min(1),
    classification: z.enum(['normal', 'sensible', 'confidentiel']),
    siteId: z.string().optional(),
    productId: z.string().optional(),
    expiresAt: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional()
  })
  .passthrough();

export const patchControlledDocumentSchema = z
  .object({
    name: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    classification: z.enum(['normal', 'sensible', 'confidentiel']).optional(),
    productId: z.string().optional().nullable(),
    expiresAt: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional(),
    responsible: z.union([z.string(), z.literal(''), z.null()]).optional()
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });
