import { Router } from 'express';
import * as controller from '../controllers/habilitations.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.get('/', requirePermission('habilitations', 'read'), controller.getAll);
router.post('/', requirePermission('habilitations', 'write'), controller.create);
router.put('/:id', requirePermission('habilitations', 'write'), controller.update);
router.delete('/:id', requirePermission('habilitations', 'write'), controller.remove);

export default router;
