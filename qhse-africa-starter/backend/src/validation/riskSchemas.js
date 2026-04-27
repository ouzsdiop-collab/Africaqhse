import { z } from 'zod';

export const createRiskSchema = z.object({
  ref: z.string().max(80).optional(),
  title: z.string().min(2).max(240),
  description: z.string().max(8000).optional(),
  category: z.string().max(100).optional(),
  probability: z.number().int().min(1).max(5).default(1),
  severity: z.number().int().min(1).max(5).default(1),
  gravity: z.number().int().min(1).max(5).optional(),
  owner: z.string().max(200).optional(),
  siteId: z.string().optional(),
  /** Aligné sur risks.controller (open, ouvert, en_traitement, clos, closed, …). */
  status: z.string().max(80).default('open')
});

export const patchRiskSchema = z
  .object({
    title: z.string().min(2).max(240).optional(),
    description: z.string().max(8000).optional(),
    category: z.string().max(100).optional(),
    probability: z.number().int().min(1).max(5).optional(),
    severity: z.number().int().min(1).max(5).optional(),
    gravity: z.number().int().min(1).max(5).optional(),
    owner: z.string().max(200).optional(),
    status: z.string().max(80).optional(),
    siteId: z.union([z.string(), z.null()]).optional()
  })
  .strict();
