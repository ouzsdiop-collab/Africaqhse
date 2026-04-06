import { Router } from 'express';
import * as controller from '../controllers/aiSuggestion.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

const read = requirePermission('ai_suggestions', 'read');
const write = requirePermission('ai_suggestions', 'write');

router.get('/', read, controller.list);
router.post('/generate', write, controller.postGenerate);
router.post('/analyze-document', write, controller.postAnalyzeDocument);
router.post('/propose-actions', write, controller.postProposeActions);
router.patch('/:id/review', write, controller.patchReview);
router.get('/:id', read, controller.getById);

export default router;
