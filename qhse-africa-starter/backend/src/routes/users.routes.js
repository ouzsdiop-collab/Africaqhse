import { Router } from 'express';
import * as controller from '../controllers/users.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.get('/', requirePermission('users', 'read'), controller.getAll);
router.post('/', requirePermission('users', 'write'), controller.create);
router.patch('/:id', requirePermission('users', 'write'), controller.patchById);
router.delete('/:id', requirePermission('users', 'write'), controller.remove);
router.get('/:id', requirePermission('users', 'read'), controller.getById);

export default router;
