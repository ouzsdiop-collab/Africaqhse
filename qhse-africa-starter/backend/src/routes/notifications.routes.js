import { Router } from 'express';
import * as controller from '../controllers/notifications.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.get('/', requirePermission('notifications', 'read'), controller.getAll);

export default router;
