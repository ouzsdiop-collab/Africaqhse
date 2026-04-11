import { z } from 'zod';

const optionalDateTime = z
  .union([z.string().datetime({ offset: true }), z.literal(''), z.null()])
  .optional();

const habilitationStatusEnum = z.enum(['active', 'expired', 'suspended']);

export const createHabilitationSchema = z.object({
  userId: z.string().min(1),
  type: z.string().min(1),
  validFrom: optionalDateTime,
  validUntil: optionalDateTime,
  siteId: z.string().optional(),
  level: z.string().optional(),
  status: habilitationStatusEnum.optional()
});

const patchDateTime = z
  .union([z.string().datetime({ offset: true }), z.literal(''), z.null()])
  .optional();

export const updateHabilitationSchema = z
  .object({
    userId: z.string().min(1).optional(),
    type: z.string().min(1).optional(),
    level: z.union([z.string(), z.literal(''), z.null()]).optional(),
    status: habilitationStatusEnum.optional(),
    validFrom: patchDateTime,
    validUntil: patchDateTime,
    siteId: z.union([z.string(), z.literal(''), z.null()]).optional()
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });
