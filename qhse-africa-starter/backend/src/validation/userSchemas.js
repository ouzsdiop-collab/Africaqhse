import { z } from 'zod';

const userRoleEnum = z.enum([
  'ADMIN',
  'QHSE',
  'DIRECTION',
  'MANAGER',
  'OPERATEUR',
  'AUDITEUR',
  'TERRAIN'
]);

const optionalPassword = z.union([z.string().min(8), z.literal('')]).optional();

export const createUserSchema = z.object({
  name: z.string().min(1),
  email: z
    .string()
    .email()
    .max(254)
    .transform((s) => s.trim().toLowerCase()),
  role: userRoleEnum,
  password: optionalPassword
});

export const patchUserSchema = z
  .object({
    name: z.string().min(1).optional(),
    role: userRoleEnum.optional(),
    password: optionalPassword,
    onboardingCompleted: z.boolean().optional(),
    onboardingStep: z.number().int().min(0).max(5).optional()
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });
