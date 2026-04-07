import { Router } from 'express';
import * as controller from '../controllers/controlledDocuments.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';

const router = Router();

/** Jeton signé — doit être déclaré avant /:id */
router.get('/stream', controller.streamByToken);

router.get('/', requirePermission('controlled_documents', 'read'), controller.list);

router.post(
  '/',
  requirePermission('controlled_documents', 'write'),
  controller.uploadSingleControlledFile,
  controller.create
);

router.get(
  '/:id/export',
  requirePermission('controlled_documents', 'read'),
  controller.exportWatermarked
);

router.get(
  '/:id/download',
  requirePermission('controlled_documents', 'read'),
  controller.downloadAuthenticated
);

router.post(
  '/:id/access-token',
  requirePermission('controlled_documents', 'read'),
  controller.issueAccessToken
);

router.patch(
  '/:id',
  requirePermission('controlled_documents', 'write'),
  controller.patchMeta
);

router.get('/:id', requirePermission('controlled_documents', 'read'), controller.getById);

export default router;
