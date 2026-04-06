import { Router } from 'express';
import * as controller from '../controllers/audits.controller.js';
import * as reportsController from '../controllers/reports.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

/** Avant GET / pour éviter toute ambiguïté avec d’éventuelles routes génériques. */
router.post(
  '/:id/send-report',
  requirePermission('reports', 'write'),
  reportsController.sendAuditReportEmail
);
router.get(
  '/:id/report',
  requirePermission('reports', 'read'),
  reportsController.getAuditReport
);
router.get('/', requirePermission('audits', 'read'), controller.getAll);
router.post('/', requirePermission('audits', 'write'), controller.create);
router.patch(
  '/:id',
  requirePermission('audits', 'write'),
  controller.patch
);

export default router;
