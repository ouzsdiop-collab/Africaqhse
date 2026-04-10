import { z } from 'zod';

export const createIncidentSchema = z.object({
  ref: z.string().max(80).optional(),
  type: z.string().min(1).max(120),
  site: z.string().min(1).max(120),
  siteId: z.string().optional(),
  severity: z.string().min(1).max(80),
  description: z.string().max(8000).optional(),
  location: z.string().max(500).optional(),
  responsible: z.string().max(200).optional(),
  causes: z.string().max(4000).optional(),
  causeCategory: z.enum(['humain', 'materiel', 'organisation', 'mixte']).optional(),
  status: z.string().max(120).optional()
});

export const patchIncidentSchema = z
  .object({
    status: z.string().max(120).optional(),
    description: z.string().max(8000).optional(),
    responsible: z.string().max(200).optional(),
    causes: z.string().max(4000).optional(),
    causeCategory: z.enum(['humain', 'materiel', 'organisation', 'mixte']).optional()
  })
  .strict();
