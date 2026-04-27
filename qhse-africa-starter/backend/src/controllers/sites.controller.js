import * as sitesService from '../services/sites.service.js';

export async function getAll(req, res, next) {
  try {
    const items = await sitesService.findAllSites(req.qhseTenantId);
    res.json(items);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    if (!id) {
      return res.status(400).json({ error: 'Identifiant requis' });
    }
    const site = await sitesService.findSiteById(req.qhseTenantId, id);
    if (!site) {
      return res.status(404).json({ error: 'Site introuvable' });
    }
    res.json(site);
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const { name, code, address } = req.body || {};
    const created = await sitesService.createSite(req.qhseTenantId, { name, code, address });
    res.status(201).json(created);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.statusCode === 403) {
      return res.status(403).json({ error: err.message });
    }
    if (err.code === 'P2002') {
      return res.status(409).json({ error: 'Code site déjà utilisé' });
    }
    next(err);
  }
}
