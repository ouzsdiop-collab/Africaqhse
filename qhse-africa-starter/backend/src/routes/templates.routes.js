import { Router } from 'express';
import * as controller from '../controllers/templates.controller.js';

const router = Router();

/**
 * Templates métiers (data packs) — chargés à la demande.
 * GET /api/templates/sectors/:sector
 */
router.get('/sectors/:sector', controller.getSector);

export default router;

