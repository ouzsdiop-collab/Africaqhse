import { z } from 'zod';

export const patchConformitySchema = z
  .object({
    status: z.enum(['conforme', 'partiel', 'non_conforme']),
    siteId: z.union([z.string().min(1), z.literal(''), z.null()]).optional()
  })
  .strict();
