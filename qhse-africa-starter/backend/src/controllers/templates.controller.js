import { sendJsonError } from '../lib/apiErrors.js';
import { getSectorTemplate } from '../services/sectorTemplate.service.js';

export async function getSector(req, res, next) {
  try {
    const t = await getSectorTemplate(req.params.sector);
    return res.json(t);
  } catch (e) {
    const sc = typeof e?.statusCode === 'number' ? e.statusCode : null;
    if (sc) {
      return sendJsonError(res, sc, String(e?.message || 'Erreur.'), req, {
        code: String(e?.code || 'TEMPLATE_ERROR')
      });
    }
    return next(e);
  }
}

