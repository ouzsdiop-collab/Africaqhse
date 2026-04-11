import { z } from 'zod';

export const createSiteSchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
  address: z.string().optional()
});
