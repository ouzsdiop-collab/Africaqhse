import { Router } from 'express';
import * as controller from '../controllers/habilitations.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import {
  createHabilitationSchema,
  updateHabilitationSchema
} from '../validation/habilitationSchemas.js';

const router = Router();

router.get('/alerts', requirePermission('habilitations', 'read'), controller.getAlerts);
router.get('/', requirePermission('habilitations', 'read'), controller.getAll);
router.post(
  '/',
  requirePermission('habilitations', 'write'),
  validateBody(createHabilitationSchema),
  controller.create
);
router.put(
  '/:id',
  requirePermission('habilitations', 'write'),
  validateBody(updateHabilitationSchema),
  controller.update
);
router.delete('/:id', requirePermission('habilitations', 'write'), controller.remove);

export default router;
