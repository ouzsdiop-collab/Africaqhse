import { Router } from 'express';
import * as controller from '../controllers/nonconformities.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import { createNonConformitySchema } from '../validation/nonConformitySchemas.js';

const router = Router();

router.get('/', requirePermission('nonconformities', 'read'), controller.getAll);
router.post(
  '/',
  requirePermission('nonconformities', 'write'),
  validateBody(createNonConformitySchema),
  controller.create
);

export default router;
