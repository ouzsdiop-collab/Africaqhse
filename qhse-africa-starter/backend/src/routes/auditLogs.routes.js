import { Router } from 'express';
import * as controller from '../controllers/auditLogs.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.get('/', requirePermission('audit_logs', 'read'), controller.list);

export default router;
