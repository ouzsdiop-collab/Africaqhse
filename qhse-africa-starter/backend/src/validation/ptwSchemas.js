import { z } from 'zod';

/** Création PTW — champs métiers passent en JSON `payload` côté service ; schéma permissif + clés connues. */
export const createPtwSchema = z
  .object({
    type: z.string().min(1),
    status: z.string().optional(),
    siteId: z.string().optional(),
    assignedTo: z.string().optional(),
    validFrom: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional(),
    validUntil: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional(),
    team: z.string().optional(),
    description: z.string().optional(),
    zone: z.string().optional(),
    date: z.string().optional(),
    checklist: z.array(z.string()).optional(),
    epi: z.array(z.string()).optional(),
    safetyConditions: z.array(z.string()).optional(),
    riskAnalysis: z.string().optional(),
    validationMode: z.string().optional(),
    signatures: z.array(z.record(z.unknown())).optional()
  })
  .passthrough();

export const patchPtwSchema = z
  .object({
    type: z.string().min(1).optional(),
    status: z.string().optional(),
    siteId: z.union([z.string(), z.literal(''), z.null()]).optional(),
    assignedTo: z.union([z.string(), z.literal(''), z.null()]).optional(),
    validFrom: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional(),
    validUntil: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional(),
    signatures: z.array(z.record(z.unknown())).optional()
  })
  .passthrough()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });

export const signPtwSchema = z.object({
  role: z.string().min(1),
  name: z.string().min(1),
  signatureDataUrl: z.string().optional(),
  userId: z.string().optional(),
  userLabel: z.string().optional()
});
