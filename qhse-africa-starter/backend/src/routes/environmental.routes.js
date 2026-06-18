import { Router } from 'express';
import * as controller from '../controllers/environmental.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import {
  createEnvironmentalRecordSchema,
  updateEnvironmentalRecordSchema
} from '../validation/environmentalSchemas.js';

const router = Router();

router.get('/summary', requirePermission('environmental', 'read'), controller.getSummary);
router.get('/', requirePermission('environmental', 'read'), controller.getAll);
router.post(
  '/',
  requirePermission('environmental', 'write'),
  validateBody(createEnvironmentalRecordSchema),
  controller.create
);
router.put(
  '/:id',
  requirePermission('environmental', 'write'),
  validateBody(updateEnvironmentalRecordSchema),
  controller.update
);
router.delete('/:id', requirePermission('environmental', 'write'), controller.remove);

export default router;
