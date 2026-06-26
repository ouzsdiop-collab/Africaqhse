import * as service from '../services/equipmentSignalement.service.js';
import { parseListLimit } from '../lib/validation.js';

const REVIEW_ROLES = new Set(['SUPER_ADMIN', 'ADMIN', 'CLIENT_ADMIN', 'QHSE']);

export async function list(req, res, next) {
  try {
    const { equipmentId, siteId, status } = req.query;
    const items = await service.listEquipmentSignalements(req.qhseTenantId, {
      equipmentId: typeof equipmentId === 'string' ? equipmentId : undefined,
      siteId: typeof siteId === 'string' ? siteId : undefined,
      status: typeof status === 'string' ? status : undefined,
      limit: parseListLimit(req.query.limit)
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const row = await service.createEquipmentSignalement(
      req.qhseTenantId,
      req.body ?? {},
      req.qhseUser?.id ?? null
    );
    res.status(201).json(row);
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    if (err.statusCode === 404) return res.status(404).json({ error: err.message });
    next(err);
  }
}

export async function review(req, res, next) {
  try {
    const role = String(req.qhseUser?.role ?? '').toUpperCase();
    if (req.qhseUser && !REVIEW_ROLES.has(role)) {
      return res.status(403).json({ error: 'Validation réservée au QHSE/Admin.' });
    }
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const row = await service.reviewEquipmentSignalement(
      req.qhseTenantId,
      id,
      req.body ?? {},
      req.qhseUser?.id ?? null
    );
    res.json(row);
  } catch (err) {
    if (err.statusCode === 400) return res.status(400).json({ error: err.message });
    if (err.statusCode === 404) return res.status(404).json({ error: err.message });
    next(err);
  }
}
