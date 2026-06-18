import { Router } from 'express';
import * as controller from '../controllers/nearMiss.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import { createNearMissSchema, updateNearMissSchema } from '../validation/nearMissSchemas.js';

const router = Router();

router.get('/', requirePermission('near-misses', 'read'), controller.getAll);
router.post(
  '/',
  requirePermission('near-misses', 'write'),
  validateBody(createNearMissSchema),
  controller.create
);
router.put(
  '/:id',
  requirePermission('near-misses', 'write'),
  validateBody(updateNearMissSchema),
  controller.update
);
router.delete('/:id', requirePermission('near-misses', 'write'), controller.remove);

export default router;
