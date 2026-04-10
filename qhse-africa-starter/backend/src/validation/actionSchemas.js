import { z } from 'zod';

export const createActionSchema = z.object({
  title: z.string().min(2).max(500),
  description: z.string().max(8000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  status: z.enum(['open', 'in_progress', 'done', 'cancelled']).default('open'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  responsible: z.string().max(200).optional(),
  owner: z.string().max(200).optional(),
  assigneeId: z.string().optional(),
  siteId: z.string().optional()
});

export const patchActionSchema = z
  .object({
    title: z.string().min(2).max(500).optional(),
    status: z.enum(['open', 'in_progress', 'done', 'cancelled']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    dueDate: z.string().datetime({ offset: true }).optional().nullable(),
    responsible: z.string().max(200).optional(),
    assigneeId: z.string().optional()
  })
  .strict();
