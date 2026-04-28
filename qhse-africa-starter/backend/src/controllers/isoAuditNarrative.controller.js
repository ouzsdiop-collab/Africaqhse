import { generateIsoAuditNarrativeWithSource } from '../services/isoAuditNarrative.service.js';

/**
 * POST /api/iso/audit/narrative
 * Body: { report: object } — même forme que le rapport audit agrégé côté client.
 */
export async function postAuditNarrative(req, res, next) {
  try {
    const report = req.body?.report;
    if (!report || typeof report !== 'object') {
      return res.status(400).json({
        success: false,
        error: 'Corps invalide : attendu { report: object }'
      });
    }
    const { narrative, source } = await generateIsoAuditNarrativeWithSource(
      /** @type {Record<string, unknown>} */ (report)
    );
    return res.json({
      success: true,
      narrative,
      source
    });
  } catch (e) {
    next(e);
  }
}
