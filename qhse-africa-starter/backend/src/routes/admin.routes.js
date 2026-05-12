import { Router } from 'express';
import { requireSuperAdmin } from '../middleware/requireSuperAdmin.middleware.js';
import * as controller from '../controllers/admin.controller.js';

/** Toutes les routes : JWT Bearer + rôle SUPER_ADMIN (pas d’impersonation X-User-Id). */
const router = Router();

router.use(requireSuperAdmin);

router.get('/logs', controller.getAdminLogs);
router.get('/clients', controller.listClients);
router.post('/clients', controller.createClient);
router.patch('/clients/:id', controller.patchTenant);
router.post('/clients/:id/users', controller.createTenantUser);
router.post('/clients/:id/reset-password', controller.resetClientPassword);
router.patch('/users/:userId', controller.patchTenantUser);
router.post('/users/:userId/reset-password', controller.resetUserPassword);

export default router;
