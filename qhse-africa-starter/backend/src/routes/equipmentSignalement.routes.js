import { Router } from 'express';
import * as controller from '../controllers/equipmentSignalement.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import {
  createEquipmentSignalementSchema,
  validateEquipmentSignalementSchema
} from '../validation/equipmentSignalementSchemas.js';

const router = Router();

router.get('/', requirePermission('equipment_signalements', 'read'), controller.list);
router.post(
  '/',
  requirePermission('equipment_signalements', 'write'),
  validateBody(createEquipmentSignalementSchema),
  controller.create
);
router.patch(
  '/:id/review',
  requirePermission('equipment_signalements', 'write'),
  validateBody(validateEquipmentSignalementSchema),
  controller.review
);

export default router;
