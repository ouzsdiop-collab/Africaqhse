import multer from 'multer';
import * as controlledDocumentService from '../services/controlledDocument.service.js';
import {
  ANONYMOUS_DOCUMENT_ACCESS_USER_ID,
  verifyDocumentAccessToken,
  signDocumentAccessToken
} from '../services/documentToken.service.js';
import { isRequireAuthEnabled } from '../lib/securityConfig.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';
import { prisma } from '../db.js';
import { can } from '../lib/permissions.js';
import {
  assertDocumentSiteAllowed,
  canUserAccessSiteId,
  isEnforceDocumentSiteScopeEnabled
} from '../lib/siteScope.service.js';
import { emitBusinessEvent } from '../services/businessEvents.service.js';

function mayAccessDocumentRow(user, row) {
  if (!isEnforceDocumentSiteScopeEnabled()) return true;
  return canUserAccessSiteId(user, row.siteId);
}

const MAX_BYTES = Number(process.env.CONTROLLED_DOCUMENT_MAX_BYTES) || 25 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES }
});

export function uploadSingleControlledFile(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: `Fichier trop volumineux (max. ${Math.round(MAX_BYTES / 1024 / 1024)} Mo).`
        });
      }
      return res.status(400).json({ error: err.message || 'Upload invalide' });
    }
    console.error('[controlled-documents] multer', err);
    return res.status(400).json({ error: 'Envoi du fichier impossible.' });
  });
}

/**
 * GET /api/controlled-documents/stream?token=
 * Accès fichier via jeton signé court — pas d’URL disque publique.
 */
export async function streamByToken(req, res, next) {
  try {
    const raw = req.query.token;
    const token = typeof raw === 'string' ? raw : Array.isArray(raw) ? raw[0] : '';
    const v = verifyDocumentAccessToken(token);
    if (!v) {
      return res.status(401).json({ error: 'Jeton invalide ou expiré.' });
    }
    const doc = await controlledDocumentService.getControlledDocumentByIdUnscoped(v.documentId);
    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable.' });
    }
    const anonDev =
      v.userId === ANONYMOUS_DOCUMENT_ACCESS_USER_ID && !isRequireAuthEnabled();
    /** @type {{ id: string, role: string } | null} */
    let qhseUser = null;
    if (anonDev) {
      qhseUser = { id: ANONYMOUS_DOCUMENT_ACCESS_USER_ID, role: 'ADMIN' };
    } else {
      const user = await prisma.user.findUnique({
        where: { id: v.userId },
        select: { id: true, role: true, name: true, email: true }
      });
      if (!user) {
        return res.status(401).json({ error: 'Utilisateur invalide.' });
      }
      qhseUser = {
        id: user.id,
        role: String(user?.role ?? '').trim().toUpperCase()
      };
    }
    if (doc.tenantId) {
      if (!v.tenantId || v.tenantId !== doc.tenantId) {
        return res.status(401).json({ error: 'Jeton invalide ou expiré.' });
      }
    }
    if (!controlledDocumentService.canAccessControlledDocument(qhseUser, doc.classification, 'read')) {
      return res.status(403).json({ error: 'Accès refusé pour cette classification.' });
    }
    const { buffer } = await controlledDocumentService.readDocumentBufferFromRow(doc);
    await writeAuditLog({
      tenantId: doc.tenantId ?? v.tenantId,
      userId: anonDev ? null : (qhseUser?.id ?? null),
      resource: 'controlled_document',
      resourceId: doc.id,
      action: 'controlled_document_download',
      metadata: {
        via: 'signed_token',
        mimeType: doc.mimeType,
        name: doc.name,
        siteId: doc.siteId ?? null,
        requestId: req.requestId ?? null
      }
    });
    const mime = doc.mimeType || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(buffer);
  } catch (e) {
    return next(e);
  }
}

/**
 * GET /api/controlled-documents
 */
export async function list(req, res, next) {
  try {
    const u = req.qhseUser;
    if (u && !can(u.role, 'controlled_documents', 'read')) {
      return res.status(403).json({ error: 'Permission refusée.' });
    }
    const filters = controlledDocumentService.parseListFilters(req.query || {});
    const rows = await controlledDocumentService.listControlledDocuments(req.qhseTenantId, filters);
    const visible = rows.filter((row) =>
      controlledDocumentService.canAccessControlledDocument(u, row.classification, 'read')
    );
    await writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'controlled_document',
      resourceId: 'list',
      action: 'controlled_document_list',
      metadata: { filters }
    });
    return res.json(visible);
  } catch (e) {
    return next(e);
  }
}

/**
 * POST /api/controlled-documents
 */
export async function create(req, res, next) {
  try {
    const u = req.qhseUser;
    if (u && !can(u.role, 'controlled_documents', 'write')) {
      return res.status(403).json({ error: 'Permission refusée.' });
    }
    if (!req.file?.buffer) {
      return res.status(400).json({ error: 'Aucun fichier (champ attendu : file).' });
    }
    const body = req.body || {};
    const classification = controlledDocumentService.normalizeClassification(body.classification);
    if (!controlledDocumentService.canAccessControlledDocument(u, classification, 'write')) {
      return res.status(403).json({ error: 'Vous ne pouvez pas créer un document avec cette classification.' });
    }
    const rawSite =
      body.siteId != null && String(body.siteId).trim() !== ''
        ? String(body.siteId).trim()
        : null;
    assertDocumentSiteAllowed(u, rawSite);
    const name =
      (typeof body.name === 'string' && body.name.trim()) || req.file.originalname || 'document';
    const type = (typeof body.type === 'string' && body.type.trim()) || 'other';
    const row = await controlledDocumentService.createControlledDocument(req.file.buffer, {
      tenantId: req.qhseTenantId,
      name,
      type,
      classification,
      siteId: rawSite,
      createdByUserId: auditUserIdFromRequest(req),
      mimeType: req.file.mimetype || null,
      auditId: body.auditId || null,
      fdsProductRef: body.fdsProductRef || null,
      isoRequirementRef: body.isoRequirementRef || null,
      riskRef: body.riskRef || null,
      complianceTag: body.complianceTag || null,
      expiresAt: body.expiresAt || null,
      responsible: body.responsible || null
    });
    await writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'controlled_document',
      resourceId: row.id,
      action: 'controlled_document_create',
      metadata: {
        type: row.type,
        classification: row.classification,
        siteId: row.siteId,
        auditId: row.auditId
      }
    });
    return res.status(201).json(controlledDocumentService.toPublicControlledDocument(row));
  } catch (e) {
    return next(e);
  }
}

/**
 * PATCH /api/controlled-documents/:id
 * Métadonnées : expiresAt, responsible, name, type (pas le fichier).
 */
export async function patchMeta(req, res, next) {
  try {
    const u = req.qhseUser;
    if (u && !can(u.role, 'controlled_documents', 'write')) {
      return res.status(403).json({ error: 'Permission refusée.' });
    }
    const doc = await controlledDocumentService.getControlledDocumentById(req.qhseTenantId, req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable.' });
    }
    if (!controlledDocumentService.canAccessControlledDocument(u, doc.classification, 'write')) {
      return res.status(403).json({ error: 'Accès refusé pour cette classification.' });
    }
    assertDocumentSiteAllowed(u, doc.siteId);
    const body = req.body || {};
    const updated = await controlledDocumentService.updateControlledDocumentMeta(req.qhseTenantId, req.params.id, {
      expiresAt: body.expiresAt,
      responsible: body.responsible,
      name: body.name,
      type: body.type
    });
    await writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'controlled_document',
      resourceId: updated.id,
      action: 'controlled_document_update_meta',
      metadata: {
        expiresAt: updated.expiresAt,
        responsible: updated.responsible,
        name: updated.name
      }
    });
    return res.json(controlledDocumentService.toPublicControlledDocument(updated));
  } catch (e) {
    if (e && e.statusCode === 400) {
      return res.status(400).json({ error: e.message });
    }
    return next(e);
  }
}

/**
 * GET /api/controlled-documents/:id
 */
export async function getById(req, res, next) {
  try {
    const u = req.qhseUser;
    const doc = await controlledDocumentService.getControlledDocumentById(req.qhseTenantId, req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable.' });
    }
    if (!controlledDocumentService.canAccessControlledDocument(u, doc.classification, 'read')) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    assertDocumentSiteAllowed(u, doc.siteId);
    await writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'controlled_document',
      resourceId: doc.id,
      action: 'controlled_document_consult',
      metadata: {
        name: doc.name,
        classification: doc.classification,
        siteId: doc.siteId ?? null,
        requestId: req.requestId ?? null
      }
    });
    return res.json(controlledDocumentService.toPublicControlledDocument(doc));
  } catch (e) {
    return next(e);
  }
}

/**
 * POST /api/controlled-documents/:id/access-token
 */
export async function issueAccessToken(req, res, next) {
  try {
    const u = req.qhseUser;
    const doc = await controlledDocumentService.getControlledDocumentById(req.qhseTenantId, req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable.' });
    }
    if (!controlledDocumentService.canAccessControlledDocument(u, doc.classification, 'read')) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    const auditUid = auditUserIdFromRequest(req);
    let tokenUserId = auditUid;
    if (!tokenUserId) {
      if (isRequireAuthEnabled()) {
        return res.status(401).json({ error: 'Authentification requise pour émettre un jeton.' });
      }
      tokenUserId = ANONYMOUS_DOCUMENT_ACCESS_USER_ID;
    }
    const expiresIn =
      typeof req.body?.expiresIn === 'string' && /^\d+[mhd]$/i.test(req.body.expiresIn)
        ? req.body.expiresIn
        : '10m';
    const token = signDocumentAccessToken(
      {
        documentId: doc.id,
        userId: tokenUserId,
        purpose: 'download',
        tenantId: req.qhseTenantId
      },
      expiresIn
    );
    const streamPath = `/api/controlled-documents/stream?token=${encodeURIComponent(token)}`;
    await writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUid,
      resource: 'controlled_document',
      resourceId: doc.id,
      action: 'controlled_document_issue_token',
      metadata: { expiresIn }
    });
    return res.json({
      token,
      streamPath,
      expiresIn,
      /** Indication client : préfixer avec l’origine HTTPS de l’API. */
      hint: 'Utilisez streamPath sur la même origine que l’API (HTTPS en production).'
    });
  } catch (e) {
    return next(e);
  }
}

/**
 * GET /api/controlled-documents/:id/download
 * Téléchargement direct authentifié (sans jeton).
 */
export async function downloadAuthenticated(req, res, next) {
  try {
    const u = req.qhseUser;
    const doc = await controlledDocumentService.getControlledDocumentById(req.qhseTenantId, req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable.' });
    }
    if (!controlledDocumentService.canAccessControlledDocument(u, doc.classification, 'read')) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    assertDocumentSiteAllowed(u, doc.siteId);
    const { buffer } = await controlledDocumentService.readDocumentBufferForId(req.qhseTenantId, doc.id);
    await writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'controlled_document',
      resourceId: doc.id,
      action: 'controlled_document_download',
      metadata: {
        via: 'bearer',
        mimeType: doc.mimeType,
        name: doc.name,
        siteId: doc.siteId ?? null,
        requestId: req.requestId ?? null
      }
    });
    const mime = doc.mimeType || 'application/octet-stream';
    res.setHeader('Content-Type', mime);
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(doc.name)}`);
    res.setHeader('Cache-Control', 'private, no-store');
    return res.send(buffer);
  } catch (e) {
    return next(e);
  }
}

/**
 * GET /api/controlled-documents/:id/export
 * Export avec filigrane (PDF) ou en-tête de traçabilité (autres types).
 */
export async function exportWatermarked(req, res, next) {
  try {
    const u = req.qhseUser;
    const doc = await controlledDocumentService.getControlledDocumentById(req.qhseTenantId, req.params.id);
    if (!doc) {
      return res.status(404).json({ error: 'Document introuvable.' });
    }
    if (!controlledDocumentService.canAccessControlledDocument(u, doc.classification, 'read')) {
      return res.status(403).json({ error: 'Accès refusé.' });
    }
    assertDocumentSiteAllowed(u, doc.siteId);
    const { buffer } = await controlledDocumentService.readDocumentBufferForId(req.qhseTenantId, doc.id);
    const userLabel = u
      ? `${u.name || u.id} (${u.email || ''})`.trim()
      : 'Anonyme (auth désactivée)';
    const built = await controlledDocumentService.buildWatermarkedExportBuffer(buffer, doc, {
      userLabel
    });
    await writeAuditLog({
      tenantId: req.qhseTenantId,
      userId: auditUserIdFromRequest(req),
      resource: 'controlled_document',
      resourceId: doc.id,
      action: 'controlled_document_export',
      metadata: {
        name: doc.name,
        watermarked: true,
        mimeType: built.mimeType,
        userLabel,
        siteId: doc.siteId ?? null,
        requestId: req.requestId ?? null
      }
    });
    void emitBusinessEvent('controlled_document.export', {
      tenantId: req.qhseTenantId,
      documentId: doc.id,
      userId: auditUserIdFromRequest(req),
      classification: doc.classification,
      siteId: doc.siteId ?? null
    });
    res.setHeader('Content-Type', built.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename*=UTF-8''${encodeURIComponent(built.fileName)}`
    );
    res.setHeader('Cache-Control', 'private, no-store');
    if (built.watermarkHeader) {
      res.setHeader('X-QHSE-Export-Watermark', built.watermarkHeader);
    }
    return res.send(built.buffer);
  } catch (e) {
    return next(e);
  }
}
