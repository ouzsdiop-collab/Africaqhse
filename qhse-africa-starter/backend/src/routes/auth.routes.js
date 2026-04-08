import { Router } from 'express';
import * as controller from '../controllers/auth.controller.js';

const router = Router();

router.post('/login', controller.login);
router.post('/switch-tenant', controller.postSwitchTenant);
router.post('/logout', controller.logout);
router.get('/me', controller.getMe);

export default router;
