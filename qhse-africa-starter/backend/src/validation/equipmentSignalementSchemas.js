import { z } from 'zod';

const severityEnum = z.enum(['low', 'medium', 'high']);
const categoryEnum = z.enum(['oil_level', 'anomaly_noise', 'leak_heat', 'broken_part', 'other']);

const attachmentSchema = z.object({
  kind: z.enum(['photo', 'voice']),
  dataUrl: z.string().min(1),
  capturedAt: z.string().optional()
});

export const createEquipmentSignalementSchema = z.object({
  equipmentId: z.string().min(1),
  category: categoryEnum,
  severity: severityEnum.optional(),
  description: z.string().max(2000).optional(),
  attachments: z.array(attachmentSchema).max(10).optional()
});

export const validateEquipmentSignalementSchema = z.object({
  status: z.enum(['validated', 'needs_info', 'rejected']),
  qhseComment: z.string().max(2000).optional()
});
