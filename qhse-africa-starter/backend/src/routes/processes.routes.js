import { Router } from 'express';
import * as controller from '../controllers/processes.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.get('/', requirePermission('processes', 'read'), controller.getAll);
router.get('/by-link', requirePermission('processes', 'read'), controller.byLink);
router.get('/:id', requirePermission('processes', 'read'), controller.getById);
router.post('/', requirePermission('processes', 'write'), controller.create);
router.patch('/:id', requirePermission('processes', 'write'), controller.patchById);
router.delete('/:id', requirePermission('processes', 'write'), controller.remove);

router.post('/:id/links', requirePermission('processes', 'write'), controller.addLink);
router.delete('/:id/links/:linkId', requirePermission('processes', 'write'), controller.removeLink);

router.post('/:id/analyze', requirePermission('processes', 'read'), controller.analyze);
router.post('/:id/audit-prep', requirePermission('processes', 'read'), controller.auditPrep);

router.get('/:id/score-history', requirePermission('processes', 'read'), controller.scoreHistory);

router.get('/:id/reviews', requirePermission('processes', 'read'), controller.listReviews);
router.post('/:id/reviews', requirePermission('processes', 'write'), controller.addReview);
router.post('/:id/reviews/suggest', requirePermission('processes', 'write'), controller.suggestReviewConclusion);

export default router;
