import { Router } from 'express';
import * as controller from '../controllers/reporting.controller.js';
import * as periodicController from '../controllers/periodicReporting.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.get('/summary', requirePermission('reports', 'read'), controller.getSummary);
router.get(
  '/iso-45001-pilotage-premium',
  requirePermission('reports', 'read'),
  controller.getIso45001PilotagePremium
);
router.get('/iso-premium', requirePermission('reports', 'read'), controller.getIsoPremium);
router.get(
  '/periodic',
  requirePermission('reports', 'read'),
  periodicController.getPeriodic
);

export default router;
