import { Router } from 'express';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.middleware.js';
import * as controller from '../controllers/admin.controller.js';

const router = Router();

router.use(requireSuperAdmin);

router.get('/clients', controller.listClients);
router.post('/clients', controller.createClient);
router.post('/clients/:id/reset-password', controller.resetClientPassword);

export default router;
