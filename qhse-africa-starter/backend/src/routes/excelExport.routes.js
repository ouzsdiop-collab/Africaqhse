import { Router } from 'express';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';
import * as svc from '../services/excelExport.service.js';

const router = Router();
const XLSX_MIME = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

/**
 * @param {import('express').Response} res
 * @param {Buffer} buffer
 * @param {string} filename
 */
function sendExcel(res, buffer, filename) {
  res.set({
    'Content-Type': XLSX_MIME,
    'Content-Disposition': `attachment; filename="${filename}-${new Date().toISOString().slice(0, 10)}.xlsx"`,
    'Content-Length': buffer.length
  });
  res.send(buffer);
}

router.get('/incidents', requirePermission('incidents', 'read'), async (req, res, next) => {
  try {
    const raw = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, raw);
    sendExcel(res, await svc.exportIncidentsExcel(req.qhseTenantId, siteId), 'incidents');
  } catch (e) {
    next(e);
  }
});

router.get('/risks', requirePermission('risks', 'read'), async (req, res, next) => {
  try {
    const raw = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, raw);
    sendExcel(res, await svc.exportRisksExcel(req.qhseTenantId, siteId), 'risques');
  } catch (e) {
    next(e);
  }
});

router.get('/actions', requirePermission('actions', 'read'), async (req, res, next) => {
  try {
    const raw = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, raw);
    sendExcel(res, await svc.exportActionsExcel(req.qhseTenantId, siteId), 'actions');
  } catch (e) {
    next(e);
  }
});

router.get('/audits', requirePermission('audits', 'read'), async (req, res, next) => {
  try {
    const raw = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, raw);
    sendExcel(res, await svc.exportAuditsExcel(req.qhseTenantId, siteId), 'audits');
  } catch (e) {
    next(e);
  }
});

export default router;
