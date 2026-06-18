import { z } from 'zod';

const nearMissStatusEnum = z.enum(['open', 'under_review', 'closed']);

export const createNearMissSchema = z.object({
  title: z.string().min(1).max(300),
  description: z.string().max(5000).optional(),
  category: z.string().max(200).optional(),
  occurredAt: z.string().datetime({ offset: true }),
  location: z.string().max(300).optional(),
  immediateActions: z.string().max(5000).optional(),
  lessonsLearned: z.string().max(5000).optional(),
  status: nearMissStatusEnum.optional(),
  siteId: z.string().optional()
});

export const updateNearMissSchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    description: z.union([z.string().max(5000), z.literal(''), z.null()]).optional(),
    category: z.union([z.string().max(200), z.literal(''), z.null()]).optional(),
    occurredAt: z.string().datetime({ offset: true }).optional(),
    location: z.union([z.string().max(300), z.literal(''), z.null()]).optional(),
    immediateActions: z.union([z.string().max(5000), z.literal(''), z.null()]).optional(),
    lessonsLearned: z.union([z.string().max(5000), z.literal(''), z.null()]).optional(),
    status: nearMissStatusEnum.optional(),
    siteId: z.union([z.string(), z.literal(''), z.null()]).optional()
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });
