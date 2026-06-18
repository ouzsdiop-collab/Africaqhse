import * as preventionPlanService from '../services/preventionPlan.service.js';

function handleServiceError(err, res, next) {
  if (err.statusCode === 400) return res.status(400).json({ error: err.message });
  if (err.statusCode === 403) return res.status(403).json({ error: err.message });
  if (err.statusCode === 404) return res.status(404).json({ error: err.message });
  next(err);
}

export async function getPreventionPlans(req, res, next) {
  try {
    const siteId = typeof req.query.siteId === 'string' ? req.query.siteId : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    res.json(await preventionPlanService.findAllPreventionPlans(req.qhseTenantId, { siteId, status }));
  } catch (err) {
    next(err);
  }
}

export async function createPreventionPlan(req, res, next) {
  try {
    const row = await preventionPlanService.createPreventionPlan(req.qhseTenantId, req.body ?? {});
    res.status(201).json(row);
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function updatePreventionPlan(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    res.json(await preventionPlanService.updatePreventionPlan(req.qhseTenantId, id, req.body ?? {}));
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function signPreventionPlan(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const party = typeof req.params.party === 'string' ? req.params.party.trim() : '';
    res.json(await preventionPlanService.signPreventionPlan(req.qhseTenantId, id, party, req.body ?? {}));
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function deletePreventionPlan(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    await preventionPlanService.deletePreventionPlan(req.qhseTenantId, id);
    res.status(204).send();
  } catch (err) {
    handleServiceError(err, res, next);
  }
}
