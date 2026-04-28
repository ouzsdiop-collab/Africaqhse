import { z } from 'zod';

export const createActionSchema = z.object({
  title: z.string().min(2).max(500),
  /** Alias UI / API historique */
  detail: z.string().max(8000).optional(),
  description: z.string().max(8000).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  /** Aligné Prisma / pilotage FR (« À lancer », « En cours », …) — pas seulement open/in_progress. */
  status: z.string().min(1).max(120).default('À lancer'),
  dueDate: z.string().datetime({ offset: true }).optional().nullable(),
  responsible: z.string().max(200).optional(),
  owner: z.string().max(200).optional(),
  assigneeId: z.string().optional(),
  siteId: z.string().optional(),
  incidentId: z.string().optional(),
  riskId: z.string().optional()
});

export const patchActionSchema = z
  .object({
    title: z.string().min(2).max(500).optional(),
    /** Statuts métier FR / Kanban (aligné `actions.controller` + Prisma). */
    status: z.string().min(1).max(120).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
    dueDate: z.string().datetime({ offset: true }).optional().nullable(),
    responsible: z.string().max(200).optional(),
    assigneeId: z.string().optional(),
    riskId: z.string().optional().nullable()
  })
  .strict();
