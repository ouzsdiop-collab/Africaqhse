import { z } from 'zod';

export const adminGateLoginBodySchema = z.object({
  code: z.string().trim().min(1, 'Code requis')
});
