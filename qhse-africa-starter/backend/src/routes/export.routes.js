import { Router } from 'express';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';
import * as svc from '../services/csvExport.service.js';

const router = Router();
const CSV_MIME = 'text/csv; charset=utf-8';

/**
 * @param {import('express').Response} res
 * @param {Buffer} buffer
 * @param {string} filename
 */
function sendCsv(res, buffer, filename) {
  const day = new Date().toISOString().slice(0, 10);
  res.set({
    'Content-Type': CSV_MIME,
    'Content-Disposition': `attachment; filename="${filename}-${day}.csv"`,
    'Content-Length': buffer.length
  });
  res.send(buffer);
}

router.get('/incidents', requirePermission('incidents', 'read'), async (req, res, next) => {
  try {
    const raw = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, raw);
    sendCsv(res, await svc.exportIncidentsCsv(req.qhseTenantId, siteId), 'incidents');
  } catch (e) {
    next(e);
  }
});

router.get('/risks', requirePermission('risks', 'read'), async (req, res, next) => {
  try {
    const raw = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, raw);
    sendCsv(res, await svc.exportRisksCsv(req.qhseTenantId, siteId), 'risques');
  } catch (e) {
    next(e);
  }
});

router.get('/actions', requirePermission('actions', 'read'), async (req, res, next) => {
  try {
    const raw = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, raw);
    sendCsv(res, await svc.exportActionsCsv(req.qhseTenantId, siteId), 'actions');
  } catch (e) {
    next(e);
  }
});

router.get('/audits', requirePermission('audits', 'read'), async (req, res, next) => {
  try {
    const raw = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, raw);
    sendCsv(res, await svc.exportAuditsCsv(req.qhseTenantId, siteId), 'audits');
  } catch (e) {
    next(e);
  }
});

export default router;
