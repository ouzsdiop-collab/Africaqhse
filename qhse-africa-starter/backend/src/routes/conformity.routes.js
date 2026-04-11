import { Router } from 'express';
import * as controller from '../controllers/conformity.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import { patchConformitySchema } from '../validation/conformitySchemas.js';

const router = Router();

const read = requirePermission('conformity', 'read');
const write = requirePermission('conformity', 'write');

router.get('/', read, controller.list);
router.patch(
  '/:requirementId',
  write,
  validateBody(patchConformitySchema),
  controller.patchByRequirementId
);

export default router;
