import { Router } from 'express';
import { authLoginLimiter } from '../middleware/apiRateLimit.middleware.js';
import { requireAdminGate } from '../middleware/requireAdminGate.middleware.js';
import {
  loginAdminGate,
  listGateClients,
  createGateClient,
  patchGateClient,
  createGateTenantUser,
  patchGateTenantUser,
  resetGateUserPassword
} from '../controllers/adminGate.controller.js';

const router = Router();

router.post('/login', authLoginLimiter, loginAdminGate);
router.get('/clients', requireAdminGate, listGateClients);
router.post('/clients', requireAdminGate, createGateClient);
router.patch('/clients/:id', requireAdminGate, patchGateClient);
router.post('/clients/:id/users', requireAdminGate, createGateTenantUser);
router.patch('/users/:userId', requireAdminGate, patchGateTenantUser);
router.post('/users/:userId/reset-password', requireAdminGate, resetGateUserPassword);

export default router;
