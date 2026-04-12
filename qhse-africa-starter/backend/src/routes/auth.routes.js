import { Router } from 'express';
import { authLimiter } from '../lib/rateLimiter.js';
import * as controller from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authLimiter, controller.login);
router.post('/switch-tenant', controller.postSwitchTenant);
router.post('/logout', controller.logoutHandler);

router.post('/refresh', authLimiter, controller.refreshHandler);

router.get('/me', controller.getMe);

export default router;
