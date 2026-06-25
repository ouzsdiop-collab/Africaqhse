import * as regulatoryWatchService from '../services/regulatoryWatch.service.js';

function handleServiceError(err, res, next) {
  if (err.statusCode === 400) return res.status(400).json({ error: err.message });
  if (err.statusCode === 403) return res.status(403).json({ error: err.message });
  if (err.statusCode === 404) return res.status(404).json({ error: err.message });
  next(err);
}

export async function getRegulatoryWatchEntries(req, res, next) {
  try {
    const country = typeof req.query.country === 'string' ? req.query.country : undefined;
    res.json(await regulatoryWatchService.findAllRegulatoryWatchEntries(req.qhseTenantId, { country }));
  } catch (err) {
    next(err);
  }
}

export async function getRegulatoryWatchAlerts(req, res, next) {
  try {
    const days = Number(req.query?.daysAhead ?? req.query?.days ?? 30);
    const limit = Number(req.query?.limit ?? 50);
    const alerts = await regulatoryWatchService.getRegulatoryWatchAlerts(req.qhseTenantId, {
      daysAhead: Number.isFinite(days) ? days : 30,
      limit: Number.isFinite(limit) ? limit : 50
    });
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
}

export async function createRegulatoryWatchEntry(req, res, next) {
  try {
    const row = await regulatoryWatchService.createRegulatoryWatchEntry(
      req.qhseTenantId,
      req.body ?? {},
      req.qhseUser?.id
    );
    res.status(201).json(row);
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function updateRegulatoryWatchEntry(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    res.json(await regulatoryWatchService.updateRegulatoryWatchEntry(req.qhseTenantId, id, req.body ?? {}));
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function deleteRegulatoryWatchEntry(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    await regulatoryWatchService.deleteRegulatoryWatchEntry(req.qhseTenantId, id);
    res.status(204).send();
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function summarizeRegulatoryText(req, res, next) {
  try {
    const sourceText = typeof req.body?.sourceText === 'string' ? req.body.sourceText : '';
    res.json(await regulatoryWatchService.summarizeRegulatoryText(sourceText));
  } catch (err) {
    handleServiceError(err, res, next);
  }
}
