import { Router } from 'express';
import * as controller from '../controllers/imports.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

router.get(
  '/',
  requirePermission('imports', 'read'),
  controller.listHistory
);

router.get(
  '/:id',
  requirePermission('imports', 'read'),
  controller.getHistoryById
);

router.post(
  '/preview',
  requirePermission('imports', 'write'),
  controller.uploadSingleFile,
  controller.preview
);

router.post(
  '/confirm',
  requirePermission('imports', 'write'),
  controller.confirm
);

export default router;
