import { Router } from 'express';
import * as controller from '../controllers/incidents.controller.js';
import { validateBody } from '../lib/validation.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { prismaRouteDebug } from '../middleware/prismaRouteDebug.middleware.js';
import { createIncidentSchema, patchIncidentSchema } from '../validation/incidentSchemas.js';

const router = Router();
router.use(prismaRouteDebug('incidents'));

/** Liste des incidents (plus récent en premier) */
router.get('/', requirePermission('incidents', 'read'), controller.getAll);

/** Création */
router.post(
  '/',
  requirePermission('incidents', 'write'),
  validateBody(createIncidentSchema),
  controller.create
);

/** Mise à jour partielle (statut) — ref URL-encodée (ex. INC-201) */
router.patch(
  '/:ref',
  requirePermission('incidents', 'write'),
  validateBody(patchIncidentSchema),
  controller.patchByRef
);

export default router;
