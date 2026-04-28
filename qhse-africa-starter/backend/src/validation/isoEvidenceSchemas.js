import { z } from 'zod';

const evidenceType = z.enum(['photo', 'document', 'audit', 'autre']);

export const createIsoEvidenceJsonSchema = z
  .object({
    requirementId: z.string().trim().min(1).max(200),
    type: evidenceType,
    fileUrl: z.string().trim().max(8000).optional(),
    content: z.string().max(100000).optional(),
    meta: z.any().optional()
  })
  .refine((d) => Boolean(d.fileUrl?.trim() || (d.content != null && String(d.content).trim())), {
    message: 'Indiquez fileUrl ou content.'
  });

export const validateIsoEvidenceBodySchema = z.object({
  status: z.enum(['validated', 'rejected'])
});
