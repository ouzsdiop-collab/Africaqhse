import { Router } from 'express';
import { aiLimiter } from '../lib/rateLimiter.js';
import * as controller from '../controllers/aiSuggestion.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import {
  suggestRootCauses,
  suggestCorrectiveActions,
  suggestDashboardPilotageActions,
  assessRiskLevel
} from '../services/aiSuggestion.service.js';
import {
  suggestIncidentCauses,
  suggestRiskMitigation,
  suggestAuditQuestions,
  generateDashboardInsight
} from '../services/aiSuggestions.service.js';

const router = Router();

/** Monté sur `/api/ai` (Mistral direct) — ne pas confondre avec `/api/ai-suggestions`. */
export const mistralAiRouter = Router();

const read = requirePermission('ai_suggestions', 'read');
const write = requirePermission('ai_suggestions', 'write');

const incidentsRead = requirePermission('incidents', 'read');
const risksRead = requirePermission('risks', 'read');
const auditsRead = requirePermission('audits', 'read');

/**
 * Préfixe monté sur `/api/ai-suggestions` (voir server.js).
 * Équivalent demandé documentaire : `/api/ai/suggest/*` → utiliser `/api/ai-suggestions/suggest/*`.
 */
router.post(
  '/suggest/root-causes',
  write,
  aiLimiter,
  async (req, res, next) => {
    try {
      const incidentId = String(req.body?.incidentId ?? '').trim();
      if (!incidentId) {
        return res.status(400).json({ error: 'incidentId requis' });
      }
      const data = await suggestRootCauses({
        incidentId,
        tenantId: req.qhseTenantId
      });
      res.json(data);
    } catch (e) {
      if (e?.statusCode === 404) {
        return res.status(404).json({ error: e.message || 'Non trouvé' });
      }
      next(e);
    }
  }
);

router.post('/suggest/actions', write, aiLimiter, async (req, res, next) => {
  try {
    const incidentId = String(req.body?.incidentId ?? '').trim();
    const dc = req.body?.dashboardContext;
    const persistSuggestion = req.body?.persistSuggestion === true;
    if (
      dc &&
      typeof dc === 'object' &&
      !Array.isArray(dc) &&
      Object.keys(dc).length > 0 &&
      !incidentId
    ) {
      const data = await suggestDashboardPilotageActions({
        dashboardContext: dc,
        tenantId: req.qhseTenantId
      });
      return res.json(data);
    }
    if (!incidentId) {
      return res.status(400).json({ error: 'incidentId ou dashboardContext requis' });
    }
    const data = await suggestCorrectiveActions({
      incidentId,
      tenantId: req.qhseTenantId,
      persistSuggestion,
      userId: req.qhseUser?.id ?? null
    });
    res.json(data);
  } catch (e) {
    if (e?.statusCode === 404) {
      return res.status(404).json({ error: e.message || 'Non trouvé' });
    }
    next(e);
  }
});

router.post('/suggest/risk-level', write, aiLimiter, async (req, res, next) => {
  try {
    const riskId = String(req.body?.riskId ?? '').trim();
    if (!riskId) {
      return res.status(400).json({ error: 'riskId requis' });
    }
    const data = await assessRiskLevel({
      riskId,
      tenantId: req.qhseTenantId
    });
    res.json(data);
  } catch (e) {
    if (e?.statusCode === 404) {
      return res.status(404).json({ error: e.message || 'Non trouvé' });
    }
    next(e);
  }
});

router.get('/', read, controller.list);
router.post('/generate', write, aiLimiter, controller.postGenerate);
router.post('/analyze-document', write, aiLimiter, controller.postAnalyzeDocument);
router.post('/propose-actions', write, aiLimiter, controller.postProposeActions);
router.patch('/:id/review', write, controller.patchReview);
router.get('/:id', read, controller.getById);

mistralAiRouter.post('/incident-causes', incidentsRead, aiLimiter, async (req, res, next) => {
  try {
    const persistSuggestion = req.body?.persistSuggestion === true;
    const data = await suggestIncidentCauses({
      ...(req.body || {}),
      // anti-fuite: on force le tenant/user depuis le contexte serveur
      tenantId: req.qhseTenantId ?? null,
      userId: req.qhseUser?.id ?? null,
      persistSuggestion
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

mistralAiRouter.post('/risk-mitigation', risksRead, aiLimiter, async (req, res, next) => {
  try {
    const persistSuggestion = req.body?.persistSuggestion === true;
    const data = await suggestRiskMitigation({
      ...(req.body || {}),
      tenantId: req.qhseTenantId ?? null,
      userId: req.qhseUser?.id ?? null,
      persistSuggestion
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

mistralAiRouter.post('/audit-questions', auditsRead, aiLimiter, async (req, res, next) => {
  try {
    const data = await suggestAuditQuestions(req.body.auditType);
    res.json(data);
  } catch (err) {
    next(err);
  }
});

mistralAiRouter.post('/dashboard-insight', incidentsRead, aiLimiter, async (req, res, next) => {
  try {
    const persistSuggestion = req.body?.persistSuggestion === true;
    const data = await generateDashboardInsight({
      ...(req.body || {}),
      tenantId: req.qhseTenantId ?? null,
      userId: req.qhseUser?.id ?? null,
      persistSuggestion
    });
    res.json(data);
  } catch (err) {
    next(err);
  }
});

export default router;
