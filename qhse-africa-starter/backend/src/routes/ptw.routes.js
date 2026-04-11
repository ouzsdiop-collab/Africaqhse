import { Router } from 'express';
import * as controller from '../controllers/ptw.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import { createPtwSchema, patchPtwSchema, signPtwSchema } from '../validation/ptwSchemas.js';

const router = Router();

const read = requirePermission('ptw', 'read');
const write = requirePermission('ptw', 'write');

router.get('/', read, controller.list);
router.post('/', write, validateBody(createPtwSchema), controller.create);
router.patch('/:id/sign', write, validateBody(signPtwSchema), controller.sign);
router.patch('/:id', write, validateBody(patchPtwSchema), controller.patchById);

export default router;
