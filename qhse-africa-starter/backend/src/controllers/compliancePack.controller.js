import { sendJsonError } from '../lib/apiErrors.js';
import { getCompliancePack } from '../services/compliancePack.service.js';

function parseStandardsQuery(raw) {
  const v = String(raw || '').trim();
  if (!v) return [];
  return v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

export async function getPack(req, res, next) {
  try {
    const countryCode = String(req.query.country || '').trim();
    const standards = parseStandardsQuery(req.query.standards);
    const sector = String(req.query.sector || '').trim();

    if (!countryCode) {
      return sendJsonError(res, 400, 'Paramètre "country" requis.', req, {
        code: 'COMPLIANCE_COUNTRY_REQUIRED'
      });
    }
    if (!standards.length) {
      return sendJsonError(res, 400, 'Paramètre "standards" requis.', req, {
        code: 'COMPLIANCE_STANDARDS_REQUIRED'
      });
    }

    const pack = await getCompliancePack({ countryCode, standards, sector });
    return res.json(pack);
  } catch (e) {
    const sc = typeof e?.statusCode === 'number' ? e.statusCode : null;
    if (sc) {
      return sendJsonError(res, sc, String(e?.message || 'Erreur.'), req, {
        code: String(e?.code || 'COMPLIANCE_PACK_ERROR')
      });
    }
    return next(e);
  }
}

