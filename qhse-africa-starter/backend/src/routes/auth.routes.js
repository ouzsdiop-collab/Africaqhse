import { Router } from 'express';
import { authLimiter, passwordResetLimiter } from '../lib/rateLimiter.js';
import * as controller from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', authLimiter, controller.login);
router.post(
  '/change-temporary-password',
  passwordResetLimiter,
  controller.changeTemporaryPassword
);
router.post('/forgot-password', passwordResetLimiter, controller.forgotPassword);
router.post('/reset-password', passwordResetLimiter, controller.resetPassword);
router.post('/switch-tenant', controller.postSwitchTenant);
router.post('/logout', controller.logoutHandler);

router.post('/refresh', authLimiter, controller.refreshHandler);

router.get('/me', controller.getMe);

export default router;
