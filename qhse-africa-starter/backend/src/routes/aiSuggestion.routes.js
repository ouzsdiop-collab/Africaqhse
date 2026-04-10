import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import * as controller from '../controllers/aiSuggestion.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import {
  suggestRootCauses,
  suggestCorrectiveActions,
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

/** 20 requêtes / 15 min — suggestions IA (coût / abus). */
const aiSuggestLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Trop de requêtes IA — réessayez dans quelques minutes.' }
});

/**
 * Préfixe monté sur `/api/ai-suggestions` (voir server.js).
 * Équivalent demandé documentaire : `/api/ai/suggest/*` → utiliser `/api/ai-suggestions/suggest/*`.
 */
router.post(
  '/suggest/root-causes',
  write,
  aiSuggestLimiter,
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

router.post('/suggest/actions', write, aiSuggestLimiter, async (req, res, next) => {
  try {
    const incidentId = String(req.body?.incidentId ?? '').trim();
    if (!incidentId) {
      return res.status(400).json({ error: 'incidentId requis' });
    }
    const data = await suggestCorrectiveActions({
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
});

router.post('/suggest/risk-level', write, aiSuggestLimiter, async (req, res, next) => {
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
router.post('/generate', write, controller.postGenerate);
router.post('/analyze-document', write, controller.postAnalyzeDocument);
router.post('/propose-actions', write, controller.postProposeActions);
router.patch('/:id/review', write, controller.patchReview);
router.get('/:id', read, controller.getById);

mistralAiRouter.post('/incident-causes', incidentsRead, aiSuggestLimiter, async (req, res, next) => {
  try {
    const suggestion = await suggestIncidentCauses(req.body);
    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
});

mistralAiRouter.post('/risk-mitigation', risksRead, aiSuggestLimiter, async (req, res, next) => {
  try {
    const suggestion = await suggestRiskMitigation(req.body);
    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
});

mistralAiRouter.post('/audit-questions', auditsRead, aiSuggestLimiter, async (req, res, next) => {
  try {
    const suggestion = await suggestAuditQuestions(req.body.auditType);
    res.json({ suggestion });
  } catch (err) {
    next(err);
  }
});

mistralAiRouter.post('/dashboard-insight', incidentsRead, aiSuggestLimiter, async (req, res, next) => {
  try {
    const insight = await generateDashboardInsight(req.body);
    res.json({ insight });
  } catch (err) {
    next(err);
  }
});

export default router;
