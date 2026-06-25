import { z } from 'zod';

export const createSiteSchema = z.object({
  name: z.string().min(2),
  code: z.string().optional(),
  address: z.string().optional()
});

export const updateSiteSchema = z.object({
  name: z.string().min(2).optional(),
  code: z.string().nullable().optional(),
  address: z.string().nullable().optional()
});
