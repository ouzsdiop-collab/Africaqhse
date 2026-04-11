import { Router } from 'express';
import * as controller from '../controllers/sites.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import { createSiteSchema } from '../validation/siteSchemas.js';

const router = Router();

router.get('/', requirePermission('sites', 'read'), controller.getAll);
router.post(
  '/',
  requirePermission('sites', 'write'),
  validateBody(createSiteSchema),
  controller.create
);
router.get('/:id', requirePermission('sites', 'read'), controller.getById);

export default router;
