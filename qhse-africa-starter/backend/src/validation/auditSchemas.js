import { z } from 'zod';

export const createAuditSchema = z.object({
  ref: z.string().max(80).optional(),
  title: z.string().min(2).max(300),
  type: z.string().max(120).optional(),
  siteId: z.string().optional(),
  site: z.string().max(120).optional(),
  plannedDate: z.string().datetime({ offset: true }).optional().nullable(),
  status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).default('planned'),
  score: z.number().min(0).max(100).optional(),
  notes: z.string().max(8000).optional()
});

export const patchAuditSchema = z
  .object({
    title: z.string().min(2).max(300).optional(),
    status: z.enum(['planned', 'in_progress', 'completed', 'cancelled']).optional(),
    score: z.number().min(0).max(100).optional(),
    plannedDate: z.string().datetime({ offset: true }).optional().nullable(),
    notes: z.string().max(8000).optional()
  })
  .strict();
