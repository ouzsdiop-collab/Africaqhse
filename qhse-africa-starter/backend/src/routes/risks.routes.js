import { Router } from 'express';
import * as controller from '../controllers/risks.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

/** Suggestions catégorie / gravité / probabilité / actions (V1 règles) */
router.post('/analyze', requirePermission('risks', 'read'), controller.analyze);

/** CRUD risques */
router.get('/', requirePermission('risks', 'read'), controller.getAll);
router.get('/stats', requirePermission('risks', 'read'), controller.getStats);
router.get('/:id', requirePermission('risks', 'read'), controller.getById);
router.post('/', requirePermission('risks', 'write'), controller.create);
router.patch('/:id', requirePermission('risks', 'write'), controller.patchById);
router.delete('/:id', requirePermission('risks', 'write'), controller.remove);

export default router;
