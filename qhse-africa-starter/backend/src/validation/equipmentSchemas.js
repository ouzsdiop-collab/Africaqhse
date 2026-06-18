import { z } from 'zod';

const optionalDateTime = z
  .union([z.string().datetime({ offset: true }), z.literal(''), z.null()])
  .optional();

const equipmentStatusEnum = z.enum(['in_service', 'out_of_service', 'in_repair', 'retired']);

export const createEquipmentSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  siteId: z.string().optional(),
  assignedUserId: z.string().optional(),
  serialNumber: z.string().optional(),
  status: equipmentStatusEnum.optional(),
  lastControlDate: optionalDateTime,
  nextControlDate: optionalDateTime
});

const patchDateTime = z
  .union([z.string().datetime({ offset: true }), z.literal(''), z.null()])
  .optional();

export const updateEquipmentSchema = z
  .object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    siteId: z.union([z.string(), z.literal(''), z.null()]).optional(),
    assignedUserId: z.union([z.string(), z.literal(''), z.null()]).optional(),
    serialNumber: z.union([z.string(), z.literal(''), z.null()]).optional(),
    status: equipmentStatusEnum.optional(),
    lastControlDate: patchDateTime,
    nextControlDate: patchDateTime
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });
