import { z } from 'zod';

export const createRegulatoryWatchEntrySchema = z.object({
  title: z.string().min(1).max(300),
  country: z.string().min(2).max(2),
  category: z.string().max(200).optional(),
  officialUrl: z.string().max(2000).optional(),
  sourceText: z.string().max(200_000).optional(),
  summary: z.string().max(20_000).optional(),
  keyObligations: z.array(z.string().min(1).max(2000)).optional(),
  effectiveDate: z.string().datetime({ offset: true }).optional()
});

export const updateRegulatoryWatchEntrySchema = z
  .object({
    title: z.string().min(1).max(300).optional(),
    country: z.string().min(2).max(2).optional(),
    category: z.union([z.string().max(200), z.literal(''), z.null()]).optional(),
    officialUrl: z.union([z.string().max(2000), z.literal(''), z.null()]).optional(),
    sourceText: z.union([z.string().max(200_000), z.literal(''), z.null()]).optional(),
    summary: z.union([z.string().max(20_000), z.literal(''), z.null()]).optional(),
    keyObligations: z.array(z.string().min(1).max(2000)).optional(),
    effectiveDate: z.union([z.string().datetime({ offset: true }), z.literal(''), z.null()]).optional()
  })
  .strict()
  .refine((o) => Object.keys(o).length > 0, { message: 'Au moins un champ requis' });

export const summarizeRegulatoryTextSchema = z.object({
  sourceText: z.string().min(1).max(200_000)
});
