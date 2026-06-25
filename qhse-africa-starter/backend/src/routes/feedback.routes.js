import { Router } from 'express';
import * as controller from '../controllers/feedback.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.post('/', requirePermission('feedback', 'write'), controller.create);
router.get('/', requirePermission('feedback', 'read'), controller.list);
router.get('/usage', requirePermission('feedback', 'read'), controller.usage);
router.patch('/:id', requirePermission('feedback', 'read'), controller.patchStatus);

export default router;
