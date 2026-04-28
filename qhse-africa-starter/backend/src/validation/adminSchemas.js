import { z } from 'zod';

export const adminCreateClientBodySchema = z.object({
  companyName: z.string().trim().min(2, 'Nom entreprise trop court').max(200),
  contactName: z.string().trim().min(2, 'Nom contact trop court').max(120),
  email: z
    .string()
    .trim()
    .email('E-mail invalide')
    .max(254)
    .transform((s) => s.toLowerCase()),
  clientCode: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? undefined : String(v).trim().toLowerCase()),
    z
      .string()
      .min(3, 'Identifiant client : minimum 3 caractères')
      .max(40)
      .regex(/^[a-z0-9-]+$/, 'Lettres minuscules, chiffres et tirets uniquement')
      .optional()
  )
});

export const adminPatchTenantBodySchema = z.object({
  name: z.string().trim().min(2).max(200).optional(),
  status: z.enum(['active', 'trial', 'suspended']).optional(),
  modules: z.record(z.string(), z.boolean()).optional()
});

const tenantUserRoleSchema = z
  .string()
  .trim()
  .min(2)
  .max(32)
  .transform((s) => s.toUpperCase())
  .refine(
    (r) =>
      new Set([
        'CLIENT_ADMIN',
        'ADMIN',
        'QHSE',
        'MANAGER',
        'DIRECTION',
        'TERRAIN',
        'ASSISTANT',
        'AUDITEUR',
        'OPERATEUR',
        'USER'
      ]).has(r),
    { message: 'Rôle non autorisé pour un compte client.' }
  );

export const adminCreateTenantUserBodySchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z
    .string()
    .trim()
    .email()
    .max(254)
    .transform((s) => s.toLowerCase()),
  role: tenantUserRoleSchema
});

export const adminPatchTenantUserBodySchema = z
  .object({
    tenantId: z.string().trim().min(1),
    role: tenantUserRoleSchema.optional(),
    isActive: z.boolean().optional()
  })
  .refine((d) => d.role !== undefined || d.isActive !== undefined, {
    message: 'Indiquez au moins role ou isActive'
  });

export const adminTenantScopedBodySchema = z.object({
  tenantId: z.string().trim().min(1)
});
