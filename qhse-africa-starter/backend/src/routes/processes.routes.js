import { Router } from 'express';
import * as controller from '../controllers/processes.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.get('/', requirePermission('processes', 'read'), controller.getAll);
router.get('/:id', requirePermission('processes', 'read'), controller.getById);
router.post('/', requirePermission('processes', 'write'), controller.create);
router.patch('/:id', requirePermission('processes', 'write'), controller.patchById);
router.delete('/:id', requirePermission('processes', 'write'), controller.remove);

router.post('/:id/links', requirePermission('processes', 'write'), controller.addLink);
router.delete('/:id/links/:linkId', requirePermission('processes', 'write'), controller.removeLink);

router.post('/assistant', requirePermission('processes', 'read'), controller.assistant);

router.post('/:id/analyze', requirePermission('processes', 'read'), controller.analyze);

router.get('/:id/reviews', requirePermission('processes', 'read'), controller.listReviews);
router.post('/:id/reviews', requirePermission('processes', 'write'), controller.addReview);

export default router;
