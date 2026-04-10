import { Router } from 'express';
import * as controller from '../controllers/audits.controller.js';
import * as reportsController from '../controllers/reports.controller.js';
import { prisma } from '../db.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';
import * as auditAutoReport from '../services/auditAutoReport.service.js';
import { validateBody } from '../lib/validation.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { prismaRouteDebug } from '../middleware/prismaRouteDebug.middleware.js';
import { createAuditSchema, patchAuditSchema } from '../validation/auditSchemas.js';

const router = Router();
router.use(prismaRouteDebug('audits'));

/** Avant GET / pour éviter toute ambiguïté avec d’éventuelles routes génériques. */
router.post(
  '/:id/send-report',
  requirePermission('reports', 'write'),
  reportsController.sendAuditReportEmail
);
router.get(
  '/:id/report',
  requirePermission('reports', 'read'),
  reportsController.getAuditReport
);
async function sendAuditPdfHandler(req, res, next) {
  try {
    const param = String(req.params.id || '').trim();
    if (!param) {
      return res.status(400).json({ error: 'Identifiant requis' });
    }
    const tf = prismaTenantFilter(req.qhseTenantId);
    const meta = await prisma.audit.findFirst({
      where: { ...tf, OR: [{ id: param }, { ref: param }] },
      select: { id: true, ref: true }
    });
    if (!meta) {
      return res.status(404).json({ error: 'Audit introuvable' });
    }
    const buffer = await auditAutoReport.generateAuditPdfReport(meta.id, req.qhseTenantId);
    const safeRef = String(meta.ref).replace(/[^a-zA-Z0-9._-]/g, '_');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="audit-${safeRef}.pdf"`);
    res.send(buffer);
  } catch (err) {
    if (err?.statusCode === 404) {
      return res.status(404).json({ error: err.message || 'Audit introuvable' });
    }
    if (err?.statusCode === 400) {
      return res.status(400).json({ error: err.message || 'Requête invalide' });
    }
    next(err);
  }
}

router.get('/:id/report/pdf', requirePermission('audits', 'read'), sendAuditPdfHandler);
router.get('/:id/pdf', requirePermission('audits', 'read'), sendAuditPdfHandler);
router.get('/', requirePermission('audits', 'read'), controller.getAll);
router.post(
  '/',
  requirePermission('audits', 'write'),
  validateBody(createAuditSchema),
  controller.create
);
router.patch(
  '/:id',
  requirePermission('audits', 'write'),
  validateBody(patchAuditSchema),
  controller.patch
);

export default router;
