import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z.string().min(1),
  category: z.string().optional(),
  durationHours: z.number().positive().optional(),
  mandatory: z.boolean().optional(),
  recurrenceMonths: z.number().int().positive().optional()
});

export const updateCourseSchema = z
  .object({
    title: z.string().min(1).optional(),
    category: z.union([z.string(), z.literal(''), z.null()]).optional(),
    durationHours: z.union([z.number().positive(), z.null()]).optional(),
    mandatory: z.boolean().optional(),
    recurrenceMonths: z.union([z.number().int().positive(), z.null()]).optional()
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });

export const createSessionSchema = z.object({
  courseId: z.string().min(1),
  date: z.string().datetime({ offset: true }),
  siteId: z.string().optional(),
  location: z.string().optional(),
  trainer: z.string().optional()
});

export const updateSessionSchema = z
  .object({
    date: z.string().datetime({ offset: true }).optional(),
    siteId: z.union([z.string(), z.literal(''), z.null()]).optional(),
    location: z.union([z.string(), z.literal(''), z.null()]).optional(),
    trainer: z.union([z.string(), z.literal(''), z.null()]).optional()
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });

export const createEnrollmentSchema = z.object({
  sessionId: z.string().min(1),
  userId: z.string().min(1)
});

export const updateEnrollmentSchema = z
  .object({
    attended: z.boolean().optional(),
    score: z.union([z.number(), z.null()]).optional(),
    certificateUrl: z.union([z.string(), z.literal(''), z.null()]).optional(),
    completedAt: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional()
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });
