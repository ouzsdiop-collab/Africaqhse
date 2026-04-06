import * as periodicReportingService from '../services/periodicReporting.service.js';

function queryStringParam(req, key) {
  const v = req.query?.[key];
  if (v === undefined || v === null) return null;
  if (Array.isArray(v)) return queryStringParam({ query: { [key]: v[0] } }, key);
  const s = String(v).trim();
  return s === '' ? null : s;
}

/** GET /api/reports/periodic — synthèse sur fenêtre hebdo / mensuelle ou dates custom (reports:read). */
export async function getPeriodic(req, res, next) {
  try {
    const startDate = queryStringParam(req, 'startDate');
    const endDate = queryStringParam(req, 'endDate');
    let period = queryStringParam(req, 'period') || 'weekly';

    if (!startDate && !endDate) {
      if (period !== 'weekly' && period !== 'monthly') {
        return res.status(400).json({
          error: 'Indiquez period=weekly ou period=monthly, ou bien startDate et endDate (ISO ou YYYY-MM-DD).'
        });
      }
    }

    const siteId = queryStringParam(req, 'siteId');
    const assigneeId = queryStringParam(req, 'assigneeId');

    const data = await periodicReportingService.buildPeriodicReport({
      period,
      startDateInput: startDate,
      endDateInput: endDate,
      siteId,
      assigneeId
    });
    res.json(data);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}
