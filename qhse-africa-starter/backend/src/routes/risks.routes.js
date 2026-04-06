import { Router } from 'express';
import * as controller from '../controllers/risks.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

/** Suggestions catégorie / gravité / probabilité / actions (V1 règles) */
router.post('/analyze', requirePermission('risks', 'read'), controller.analyze);

export default router;
