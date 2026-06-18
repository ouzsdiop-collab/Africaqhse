import { Router } from 'express';
import * as controller from '../controllers/equipment.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import { createEquipmentSchema, updateEquipmentSchema } from '../validation/equipmentSchemas.js';

const router = Router();

router.get('/alerts', requirePermission('equipment', 'read'), controller.getAlerts);
router.get('/', requirePermission('equipment', 'read'), controller.getAll);
router.post(
  '/',
  requirePermission('equipment', 'write'),
  validateBody(createEquipmentSchema),
  controller.create
);
router.put(
  '/:id',
  requirePermission('equipment', 'write'),
  validateBody(updateEquipmentSchema),
  controller.update
);
router.delete('/:id', requirePermission('equipment', 'write'), controller.remove);

export default router;
