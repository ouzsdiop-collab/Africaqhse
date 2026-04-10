import { Router } from 'express';
import * as controller from '../controllers/actions.controller.js';
import { validateBody } from '../lib/validation.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { prismaRouteDebug } from '../middleware/prismaRouteDebug.middleware.js';
import { createActionSchema, patchActionSchema } from '../validation/actionSchemas.js';

const router = Router();
router.use(prismaRouteDebug('actions'));

/** Avant GET / pour ne pas intercepter « assign » comme id (non utilisé ici, bon réflexe). */
router.patch(
  '/:id/assign',
  requirePermission('actions', 'write'),
  controller.assign
);

/** Pilotage : mise à jour statut (ex. drag & drop Kanban) */
router.patch(
  '/:id',
  requirePermission('actions', 'write'),
  validateBody(patchActionSchema),
  controller.patchById
);

/** Liste : optionnel ?assigneeId=… et/ou ?unassigned=1 (sans query = tout, rétrocompatible) */
router.get('/', requirePermission('actions', 'read'), controller.getAll);

/** Création — title, status requis ; owner ou assigneeId ; dueDate optionnel (ISO) */
router.post(
  '/',
  requirePermission('actions', 'write'),
  validateBody(createActionSchema),
  controller.create
);

export default router;
