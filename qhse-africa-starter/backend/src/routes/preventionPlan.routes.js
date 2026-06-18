import { Router } from 'express';
import * as controller from '../controllers/preventionPlan.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import {
  createPreventionPlanSchema,
  updatePreventionPlanSchema,
  signPreventionPlanSchema
} from '../validation/preventionPlanSchemas.js';

const router = Router();

router.get('/', requirePermission('preventionPlans', 'read'), controller.getPreventionPlans);
router.post(
  '/',
  requirePermission('preventionPlans', 'write'),
  validateBody(createPreventionPlanSchema),
  controller.createPreventionPlan
);
router.put(
  '/:id',
  requirePermission('preventionPlans', 'write'),
  validateBody(updatePreventionPlanSchema),
  controller.updatePreventionPlan
);
router.post(
  '/:id/sign/:party',
  requirePermission('preventionPlans', 'write'),
  validateBody(signPreventionPlanSchema),
  controller.signPreventionPlan
);
router.delete('/:id', requirePermission('preventionPlans', 'write'), controller.deletePreventionPlan);

export default router;
