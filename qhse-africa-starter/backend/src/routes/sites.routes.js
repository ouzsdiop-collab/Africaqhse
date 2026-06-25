import { Router } from 'express';
import * as controller from '../controllers/sites.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import { createSiteSchema, updateSiteSchema } from '../validation/siteSchemas.js';

const router = Router();

router.get('/', requirePermission('sites', 'read'), controller.getAll);
router.post(
  '/',
  requirePermission('sites', 'write'),
  validateBody(createSiteSchema),
  controller.create
);
router.get('/:id', requirePermission('sites', 'read'), controller.getById);
router.get('/:id/overview', requirePermission('sites', 'read'), controller.getOverview);
router.put(
  '/:id',
  requirePermission('sites', 'write'),
  validateBody(updateSiteSchema),
  controller.update
);
router.delete('/:id', requirePermission('sites', 'write'), controller.remove);

export default router;
