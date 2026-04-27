import { z } from 'zod';
import { FIELD_LIMITS } from '../lib/validation.js';

/** Accepte chaîne JSON ou tableau (Express le parse en tableau). */
const photosJsonField = z.preprocess(
  (v) => {
    if (v == null || v === '') return undefined;
    if (Array.isArray(v)) return JSON.stringify(v);
    return v;
  },
  z.union([z.string().max(FIELD_LIMITS.incidentPhotosJson), z.null()]).optional()
);

export const createIncidentSchema = z.object({
  ref: z.string().max(80).optional(),
  type: z.string().min(1).max(120),
  site: z.string().min(1).max(120),
  siteId: z.string().optional(),
  severity: z.string().min(1).max(80),
  description: z.string().max(8000).optional(),
  location: z.string().max(500).optional(),
  responsible: z.string().max(200).optional(),
  causes: z.string().max(4000).optional(),
  causeCategory: z.enum(['humain', 'materiel', 'organisation', 'mixte']).optional(),
  status: z.string().max(120).optional(),
  photosJson: photosJsonField
});

export const patchIncidentSchema = z
  .object({
    status: z.string().max(120).optional(),
    description: z.string().max(8000).optional(),
    responsible: z.string().max(200).optional(),
    causes: z.string().max(4000).optional(),
    causeCategory: z.enum(['humain', 'materiel', 'organisation', 'mixte']).optional(),
    location: z.string().max(500).optional(),
    photosJson: photosJsonField
  })
  .strict();
