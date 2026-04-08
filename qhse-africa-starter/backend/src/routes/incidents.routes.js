import { Router } from 'express';
import * as controller from '../controllers/incidents.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { prismaRouteDebug } from '../middleware/prismaRouteDebug.middleware.js';

const router = Router();
router.use(prismaRouteDebug('incidents'));

/** Liste des incidents (plus récent en premier) */
router.get('/', requirePermission('incidents', 'read'), controller.getAll);

/** Création — validation dans le controller (ref, type, site, severity) */
router.post('/', requirePermission('incidents', 'write'), controller.create);

/** Mise à jour partielle (statut) — ref URL-encodée (ex. INC-201) */
router.patch(
  '/:ref',
  requirePermission('incidents', 'write'),
  controller.patchByRef
);

export default router;
