import { Router } from 'express';
import * as controller from '../controllers/automation.controller.js';
import { requireAutomationTrigger } from '../middleware/automationTrigger.middleware.js';

const router = Router();

router.get('/status', requireAutomationTrigger, controller.getStatus);
router.post('/run', requireAutomationTrigger, controller.postRun);

export default router;
