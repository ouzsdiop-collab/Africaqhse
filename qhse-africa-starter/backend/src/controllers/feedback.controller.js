import * as feedbackService from '../services/feedback.service.js';
import * as userActivityService from '../services/userActivity.service.js';

function handleServiceError(err, res, next) {
  if (err.statusCode === 400) return res.status(400).json({ error: err.message });
  if (err.statusCode === 404) return res.status(404).json({ error: err.message });
  next(err);
}

export async function create(req, res, next) {
  try {
    const userId = req.qhseUser?.id ?? null;
    const row = await feedbackService.createFeedback(req.qhseTenantId, userId, req.body ?? {});
    res.status(201).json(row);
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function list(req, res, next) {
  try {
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const items = await feedbackService.findAllFeedback(req.qhseTenantId, {
      status,
      limit: req.query.limit
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function usage(req, res, next) {
  try {
    const items = await userActivityService.findAllUserActivity(req.qhseTenantId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function patchStatus(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const status = typeof req.body?.status === 'string' ? req.body.status.trim() : '';
    const row = await feedbackService.updateFeedbackStatus(req.qhseTenantId, id, status);
    res.json(row);
  } catch (err) {
    handleServiceError(err, res, next);
  }
}
