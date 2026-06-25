import { Router } from 'express';
import * as controller from '../controllers/regulatoryWatch.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import {
  createRegulatoryWatchEntrySchema,
  updateRegulatoryWatchEntrySchema,
  summarizeRegulatoryTextSchema
} from '../validation/regulatoryWatchSchemas.js';

const router = Router();

router.get('/', requirePermission('regulatoryWatch', 'read'), controller.getRegulatoryWatchEntries);
router.get('/alerts', requirePermission('regulatoryWatch', 'read'), controller.getRegulatoryWatchAlerts);
router.post(
  '/',
  requirePermission('regulatoryWatch', 'write'),
  validateBody(createRegulatoryWatchEntrySchema),
  controller.createRegulatoryWatchEntry
);
router.post(
  '/summarize',
  requirePermission('regulatoryWatch', 'write'),
  validateBody(summarizeRegulatoryTextSchema),
  controller.summarizeRegulatoryText
);
router.put(
  '/:id',
  requirePermission('regulatoryWatch', 'write'),
  validateBody(updateRegulatoryWatchEntrySchema),
  controller.updateRegulatoryWatchEntry
);
router.delete('/:id', requirePermission('regulatoryWatch', 'write'), controller.deleteRegulatoryWatchEntry);

export default router;
