import { Router } from 'express';
import { authLoginLimiter } from '../middleware/apiRateLimit.middleware.js';
import { loginAdminGate } from '../controllers/adminGate.controller.js';

const router = Router();

router.post('/login', authLoginLimiter, loginAdminGate);

export default router;
