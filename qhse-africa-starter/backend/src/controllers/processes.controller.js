import * as processesService from '../services/processes.service.js';
import { buildProcessAnalysis, askProcessAssistant } from '../services/aiSuggestion.service.js';

export async function getAll(req, res, next) {
  try {
    const type = req.query.type ? String(req.query.type).trim() : null;
    const siteId = req.query.siteId ? String(req.query.siteId).trim() : null;
    const rows = await processesService.listProcesses(req.qhseTenantId, { type, siteId });
    const withScores = await Promise.all(
      rows.map(async (row) => {
        const full = await processesService.getProcessById(req.qhseTenantId, row.id);
        const { score, penalties } = await processesService.computeProcessScore(req.qhseTenantId, full);
        return { ...row, score, penalties };
      })
    );
    res.json(withScores);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Identifiant processus requis' });
    const row = await processesService.getProcessById(req.qhseTenantId, id);
    if (!row) return res.status(404).json({ error: 'Processus introuvable' });
    const { score, penalties } = await processesService.computeProcessScore(req.qhseTenantId, row);
    res.json({ ...row, score, penalties });
  } catch (err) {
    next(err);
  }
}

export async function create(req, res, next) {
  try {
    const created = await processesService.createProcess(req.qhseTenantId, req.body || {});
    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
}

export async function patchById(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Identifiant processus requis' });
    const updated = await processesService.updateProcess(req.qhseTenantId, id, req.body || {});
    if (!updated) return res.status(404).json({ error: 'Processus introuvable' });
    res.json(updated);
  } catch (err) {
    next(err);
  }
}

export async function remove(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Identifiant processus requis' });
    const ok = await processesService.deleteProcess(req.qhseTenantId, id);
    if (!ok) return res.status(404).json({ error: 'Processus introuvable' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function addLink(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Identifiant processus requis' });
    const link = await processesService.addProcessLink(req.qhseTenantId, id, req.body || {});
    if (!link) return res.status(404).json({ error: 'Processus introuvable' });
    res.status(201).json(link);
  } catch (err) {
    next(err);
  }
}

export async function removeLink(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    const linkId = String(req.params.linkId || '').trim();
    if (!id || !linkId) return res.status(400).json({ error: 'Identifiants requis' });
    const ok = await processesService.removeProcessLink(req.qhseTenantId, id, linkId);
    if (!ok) return res.status(404).json({ error: 'Lien introuvable' });
    res.status(204).end();
  } catch (err) {
    next(err);
  }
}

export async function listReviews(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Identifiant processus requis' });
    const rows = await processesService.listProcessReviews(req.qhseTenantId, id);
    if (rows === null) return res.status(404).json({ error: 'Processus introuvable' });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function addReview(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Identifiant processus requis' });
    const review = await processesService.createProcessReview(req.qhseTenantId, id, req.body || {}, req.qhseUser?.id || null);
    if (!review) return res.status(404).json({ error: 'Processus introuvable' });
    res.status(201).json(review);
  } catch (err) {
    next(err);
  }
}

export async function assistant(req, res, next) {
  try {
    const question = String(req.body?.question || '').trim();
    if (!question) return res.status(400).json({ error: 'Question requise' });
    const rows = await processesService.listProcesses(req.qhseTenantId, {});
    const withScores = await Promise.all(
      rows.map(async (row) => {
        const full = await processesService.getProcessById(req.qhseTenantId, row.id);
        const { score, penalties } = await processesService.computeProcessScore(req.qhseTenantId, full);
        return { ...row, score, penalties };
      })
    );
    const result = await askProcessAssistant({ question, processes: withScores });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function analyze(req, res, next) {
  try {
    const id = String(req.params.id || '').trim();
    if (!id) return res.status(400).json({ error: 'Identifiant processus requis' });
    const row = await processesService.getProcessById(req.qhseTenantId, id);
    if (!row) return res.status(404).json({ error: 'Processus introuvable' });
    const { score, penalties } = await processesService.computeProcessScore(req.qhseTenantId, row);
    const analysis = await buildProcessAnalysis({ process: row, score, penalties });
    res.json(analysis);
  } catch (err) {
    next(err);
  }
}
