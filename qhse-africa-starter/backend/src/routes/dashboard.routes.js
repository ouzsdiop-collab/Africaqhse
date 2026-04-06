import { Router } from 'express';
import * as controller from '../controllers/dashboard.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

const dashRead = requirePermission('dashboard', 'read');

router.get('/', dashRead, controller.getStats);
router.get('/stats', dashRead, controller.getStats);

export default router;
