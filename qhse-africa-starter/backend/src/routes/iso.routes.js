import { Router } from 'express';
import * as controller from '../controllers/isoEvidence.controller.js';
import * as narrativeController from '../controllers/isoAuditNarrative.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { aiLimiter } from '../lib/rateLimiter.js';

const router = Router();

const read = requirePermission('conformity', 'read');
const write = requirePermission('conformity', 'write');

router.get('/evidence', read, controller.list);
router.post('/evidence', write, controller.uploadIsoEvidenceOptionalFile, controller.create);
router.patch('/evidence/:id/validate', write, controller.validate);

router.post('/audit/narrative', read, aiLimiter, narrativeController.postAuditNarrative);

export default router;
