import { z } from 'zod';

export const createNonConformitySchema = z.object({
  title: z.string().min(3),
  auditRef: z.string().min(1),
  detail: z.string().optional(),
  siteId: z.string().optional()
});
