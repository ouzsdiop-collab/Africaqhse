import { Router } from 'express';
import * as controller from '../controllers/mfa.controller.js';

const router = Router();

router.post('/enroll', controller.startEnrollment);
router.post('/confirm', controller.confirmEnrollment);
router.post('/disable', controller.disable);

export default router;
