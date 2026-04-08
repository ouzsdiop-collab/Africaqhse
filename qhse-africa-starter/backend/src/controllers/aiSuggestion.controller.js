import { prisma } from '../db.js';
import {
  generateSuggestion,
  analyzeDocument,
  proposeActions,
  reviewSuggestion,
  AI_SUGGESTION_STATUS
} from '../services/aiSuggestion.service.js';
import { parseListLimit } from '../lib/validation.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';

function userIdFromReq(req) {
  return req.qhseUser?.id ?? null;
}

export async function list(req, res, next) {
  try {
    if (!req.qhseTenantId) {
      return res.status(401).json({ error: 'Contexte organisation requis.' });
    }
    const limit = parseListLimit(req.query.limit);
    const status =
      typeof req.query.status === 'string' && req.query.status.trim()
        ? req.query.status.trim()
        : undefined;
    const rows = await prisma.aiSuggestion.findMany({
      where: {
        tenantId: req.qhseTenantId,
        ...(status ? { status } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        validatedByUser: { select: { id: true, name: true, email: true } }
      }
    });
    res.json(rows);
  } catch (err) {
    next(err);
  }
}

export async function getById(req, res, next) {
  try {
    if (!req.qhseTenantId) {
      return res.status(401).json({ error: 'Contexte organisation requis.' });
    }
    const id = String(req.params.id ?? '').trim();
    if (!id) {
      return res.status(400).json({ error: 'Identifiant requis' });
    }
    const row = await prisma.aiSuggestion.findFirst({
      where: { id, tenantId: req.qhseTenantId },
      include: {
        createdByUser: { select: { id: true, name: true, email: true } },
        validatedByUser: { select: { id: true, name: true, email: true } },
        targetIncident: { select: { id: true, ref: true } },
        targetAction: { select: { id: true, title: true } },
        targetAudit: { select: { id: true, ref: true } },
        importHistory: { select: { id: true, fileName: true } }
      }
    });
    if (!row) {
      return res.status(404).json({ error: 'Suggestion introuvable' });
    }
    res.json(row);
  } catch (err) {
    next(err);
  }
}

export async function postGenerate(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const type = typeof body.type === 'string' ? body.type : 'generic';
    const context = body.context && typeof body.context === 'object' ? body.context : {};
    const uid = userIdFromReq(req);

    const row = await generateSuggestion({
      tenantId: req.qhseTenantId,
      type,
      context,
      targetIncidentId: body.targetIncidentId ?? null,
      targetActionId: body.targetActionId ?? null,
      targetAuditId: body.targetAuditId ?? null,
      importHistoryId: body.importHistoryId ?? null,
      riskRef: body.riskRef ?? null,
      userId: uid
    });

    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'ai_suggestions',
      resourceId: row.id,
      action: 'generate',
      metadata: { type: row.type }
    });

    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function postAnalyzeDocument(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const text = typeof body.text === 'string' ? body.text : '';
    if (!text.trim()) {
      return res.status(400).json({ error: 'Champ « text » requis (extrait document).' });
    }
    const fileName = typeof body.fileName === 'string' ? body.fileName : '';
    const uid = userIdFromReq(req);

    const row = await analyzeDocument({
      tenantId: req.qhseTenantId,
      text,
      fileName,
      importHistoryId: body.importHistoryId ?? null,
      userId: uid
    });

    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'ai_suggestions',
      resourceId: row.id,
      action: 'analyze_document',
      metadata: { importHistoryId: row.importHistoryId }
    });

    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function postProposeActions(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const uid = userIdFromReq(req);
    const note = typeof body.note === 'string' ? body.note : '';

    const row = await proposeActions({
      tenantId: req.qhseTenantId,
      targetIncidentId: body.targetIncidentId ?? null,
      targetAuditId: body.targetAuditId ?? null,
      userId: uid,
      note
    });

    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'ai_suggestions',
      resourceId: row.id,
      action: 'propose_actions',
      metadata: {}
    });

    res.status(201).json(row);
  } catch (err) {
    next(err);
  }
}

export async function patchReview(req, res, next) {
  try {
    const id = String(req.params.id ?? '').trim();
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const status = typeof body.status === 'string' ? body.status.trim() : '';
    const editedContent = body.editedContent;
    const validatorId = userIdFromReq(req);

    if (!id) {
      return res.status(400).json({ error: 'Identifiant requis' });
    }
    if (!validatorId) {
      return res.status(400).json({ error: 'Validation réservée à un utilisateur authentifié.' });
    }

    const row = await reviewSuggestion({
      tenantId: req.qhseTenantId,
      id,
      status,
      validatedByUserId: validatorId,
      editedContent: status === AI_SUGGESTION_STATUS.EDITED ? editedContent : undefined
    });

    void writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'ai_suggestions',
      resourceId: id,
      action: 'review',
      metadata: { status: row.status }
    });

    res.json(row);
  } catch (err) {
    if (err.statusCode === 400) {
      return res.status(400).json({ error: err.message });
    }
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Suggestion introuvable' });
    }
    next(err);
  }
}
