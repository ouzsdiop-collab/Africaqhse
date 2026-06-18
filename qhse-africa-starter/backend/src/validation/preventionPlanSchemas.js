import { z } from 'zod';

const riskItemSchema = z.object({
  description: z.string().min(1),
  measure: z.string().optional()
});

export const createPreventionPlanSchema = z.object({
  externalCompanyName: z.string().min(1),
  externalContact: z.string().optional(),
  workDescription: z.string().optional(),
  siteId: z.string().optional(),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
  inspectionDate: z.string().datetime({ offset: true }).optional(),
  risks: z.array(riskItemSchema).optional(),
  permitId: z.string().optional()
});

export const updatePreventionPlanSchema = z
  .object({
    externalCompanyName: z.string().min(1).optional(),
    externalContact: z.union([z.string(), z.literal(''), z.null()]).optional(),
    workDescription: z.union([z.string(), z.literal(''), z.null()]).optional(),
    siteId: z.union([z.string(), z.literal(''), z.null()]).optional(),
    startDate: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional(),
    endDate: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional(),
    inspectionDate: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional(),
    risks: z.array(riskItemSchema).optional(),
    status: z.string().min(1).optional(),
    permitId: z.union([z.string(), z.literal(''), z.null()]).optional()
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });

export const signPreventionPlanSchema = z.object({
  name: z.string().min(1).max(200),
  signatureDataUrl: z.string().max(200_000).optional()
});
