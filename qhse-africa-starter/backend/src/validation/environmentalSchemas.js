import { z } from 'zod';

const environmentalTypeEnum = z.enum(['waste', 'water', 'energy']);

export const createEnvironmentalRecordSchema = z.object({
  type: environmentalTypeEnum,
  category: z.string().max(200).optional(),
  quantity: z.number().finite(),
  unit: z.string().min(1).max(50),
  periodDate: z.string().datetime({ offset: true }),
  siteId: z.string().optional(),
  notes: z.string().max(5000).optional()
});

export const updateEnvironmentalRecordSchema = z
  .object({
    type: environmentalTypeEnum.optional(),
    category: z.union([z.string().max(200), z.literal(''), z.null()]).optional(),
    quantity: z.number().finite().optional(),
    unit: z.string().min(1).max(50).optional(),
    periodDate: z.string().datetime({ offset: true }).optional(),
    siteId: z.union([z.string(), z.literal(''), z.null()]).optional(),
    notes: z.union([z.string().max(5000), z.literal(''), z.null()]).optional()
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });
