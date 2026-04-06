import { analyzeRiskDescription } from '../services/riskAnalyze.service.js';
import { clampTrimString, FIELD_LIMITS } from '../lib/validation.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';

/**
 * POST /api/risks/analyze — suggestions uniquement (aucune persistance).
 */
export async function analyze(req, res, next) {
  try {
    const raw = req.body?.description;
    const description = clampTrimString(raw, FIELD_LIMITS.riskDescription);
    if (!description) {
      return res.status(400).json({
        error: 'Champ « description » requis (texte non vide, max. 8000 caractères).'
      });
    }
    const result = analyzeRiskDescription(description);
    void writeAuditLog({
      userId: auditUserIdFromRequest(req),
      resource: 'risks',
      resourceId: 'analyze',
      action: 'assist_rules',
      metadata: { length: description.length }
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
