import * as habilitationsService from '../services/habilitations.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';

export async function getAll(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const expRaw = req.query.expiringWithinDays;
    if (expRaw != null && String(expRaw).trim() !== '') {
      const days = Number(expRaw);
      const items = await habilitationsService.getExpiringHabilitations(
        req.qhseTenantId,
        Number.isFinite(days) ? days : 30
      );
      return res.json(items);
    }
    const items = await habilitationsService.findAllHabilitations(req.qhseTenantId, siteId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function getAlerts(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const days = Number(req.query?.daysAhead ?? req.query?.days ?? 30);
    const limit = Number(req.query?.limit ?? 50);
    const alerts = await habilitationsService.getHabilitationAlerts(req.qhseTenantId, {
      daysAhead: Number.isFinite(days) ? days : 30,
      limit: Number.isFinite(limit) ? limit : 50,
      siteId
    });
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const row = await habilitationsService.createHabilitation(req.qhseTenantId, req.body ?? {});
    res.status(201).json(row);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    next(err);
  }
}

export async function update(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    const row = await habilitationsService.updateHabilitation(req.qhseTenantId, id, req.body ?? {});
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

export async function remove(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    await habilitationsService.deleteHabilitation(req.qhseTenantId, id);
    res.status(204).send();
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
