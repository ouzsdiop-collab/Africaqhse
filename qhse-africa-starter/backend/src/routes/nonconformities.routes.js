import { Router } from 'express';
import * as controller from '../controllers/nonconformities.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.get('/', requirePermission('nonconformities', 'read'), controller.getAll);
router.post('/', requirePermission('nonconformities', 'write'), controller.create);

export default router;
