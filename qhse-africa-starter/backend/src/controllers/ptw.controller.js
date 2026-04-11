import * as permitToWorkService from '../services/permitToWork.service.js';

export async function list(req, res, next) {
  try {
    const siteId =
      typeof req.query.siteId === 'string' && req.query.siteId.trim() ? req.query.siteId.trim() : undefined;
    const status =
      typeof req.query.status === 'string' && req.query.status.trim() ? req.query.status.trim() : undefined;
    const items = await permitToWorkService.listPermitsToWork(req.qhseTenantId, { siteId, status });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const row = await permitToWorkService.createPermitToWork(req.qhseTenantId, req.body ?? {});
    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function patchById(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const row = await permitToWorkService.patchPermitToWork(req.qhseTenantId, id, req.body ?? {});
    res.json(row);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}

export async function sign(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const body = req.body ?? {};
    const row = await permitToWorkService.signPermitToWork(req.qhseTenantId, id, {
      role: String(body.role ?? ''),
      name: String(body.name ?? ''),
      signatureDataUrl: body.signatureDataUrl != null ? String(body.signatureDataUrl) : '',
      userId: body.userId != null ? String(body.userId) : '',
      userLabel: body.userLabel != null ? String(body.userLabel) : ''
    });
    res.json(row);
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: err.message });
    }
    next(err);
  }
}
