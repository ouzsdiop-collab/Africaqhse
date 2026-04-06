import { Router } from 'express';
import * as controller from '../controllers/complianceAssist.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();
const complianceRead = requirePermission('compliance', 'read');

router.post('/analyze-assist', complianceRead, controller.postAnalyzeAssist);

export default router;
