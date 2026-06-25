import * as environmentalService from '../services/environmental.service.js';
import { parseSiteIdQuery } from '../lib/siteQueryParam.js';
import { coalesceQuerySiteIdForList } from '../services/sites.service.js';
import { parseListLimit } from '../lib/validation.js';

function queryStringFirst(value) {
  if (value === undefined || value === null) return null;
  if (Array.isArray(value)) return queryStringFirst(value[0]);
  if (typeof value === 'string') return value;
  return String(value);
}

export async function getAll(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const type = queryStringFirst(req.query.type);
    const from = queryStringFirst(req.query.from);
    const to = queryStringFirst(req.query.to);
    const items = await environmentalService.findAllEnvironmentalRecords(req.qhseTenantId, {
      siteId,
      type,
      from,
      to,
      limit: parseListLimit(req.query.limit)
    });
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function getSummary(req, res, next) {
  try {
    const rawSiteId = parseSiteIdQuery(req);
    const siteId = await coalesceQuerySiteIdForList(req.qhseTenantId, rawSiteId);
    const from = queryStringFirst(req.query.from);
    const to = queryStringFirst(req.query.to);
    const summary = await environmentalService.getEnvironmentalSummary(req.qhseTenantId, {
      siteId,
      from,
      to
    });
    res.json({ summary });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const row = await environmentalService.createEnvironmentalRecord(req.qhseTenantId, req.body ?? {});
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
    const row = await environmentalService.updateEnvironmentalRecord(req.qhseTenantId, id, req.body ?? {});
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
    await environmentalService.deleteEnvironmentalRecord(req.qhseTenantId, id);
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
