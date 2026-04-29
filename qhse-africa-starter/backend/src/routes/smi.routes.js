import { Router } from 'express';
import * as controller from '../controllers/smi.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

// SMI = vue consolidée → même niveau que "reports:read" (lecture).
router.get('/overview', requirePermission('reports', 'read'), controller.getOverview);

export default router;

