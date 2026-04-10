import { Router } from 'express';
import { requireAdmin } from '../middleware/requireAdmin.middleware.js';
import * as controller from '../controllers/settings.controller.js';

const router = Router();

router.post('/email-test', requireAdmin(), controller.postEmailTest);
router.get('/email-notifications', requireAdmin(), controller.getEmailNotifications);
router.patch('/email-notifications', requireAdmin(), controller.patchEmailNotifications);

export default router;
