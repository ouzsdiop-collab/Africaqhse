import { analyzeComplianceAssist } from '../services/complianceAssist.service.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';

/**
 * POST /api/compliance/analyze-assist
 * Corps : { requirement, controlledDocuments?, siteId? }
 */
export async function postAnalyzeAssist(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const result = await analyzeComplianceAssist({
      requirement: body.requirement,
      controlledDocuments: body.controlledDocuments,
      siteId: body.siteId
    });
    const reqId =
      body.requirement && typeof body.requirement === 'object' && body.requirement.id != null
        ? String(body.requirement.id)
        : 'assist';
    void writeAuditLog({
      userId: auditUserIdFromRequest(req),
      resource: 'compliance',
      resourceId: reqId,
      action: 'analyze_assist',
      metadata: { siteId: body.siteId ?? null }
    });
    res.json(result);
  } catch (err) {
    if (err && err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}
