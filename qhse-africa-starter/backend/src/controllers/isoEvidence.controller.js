import multer from 'multer';
import { sendJsonError } from '../lib/apiErrors.js';
import { isRequireAuthEnabled } from '../lib/securityConfig.js';
import { requireTenantIdOrRespond } from '../lib/tenantScope.js';
import { createIsoEvidenceJsonSchema, validateIsoEvidenceBodySchema } from '../validation/isoEvidenceSchemas.js';
import * as isoEvidenceService from '../services/isoEvidence.service.js';

const MAX_BYTES = Number(process.env.ISO_EVIDENCE_MAX_BYTES) || 20 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES }
});

export function uploadIsoEvidenceOptionalFile(req, res, next) {
  const ct = String(req.headers['content-type'] || '');
  if (!ct.includes('multipart/form-data')) {
    return next();
  }
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
    console.error('[iso/evidence] multer', err);
    return res.status(400).json({ error: 'Envoi du fichier impossible.' });
  });
}

function parseMeta(raw) {
  if (raw == null || raw === '') return {};
  try {
    const o = JSON.parse(String(raw));
    return o && typeof o === 'object' && !Array.isArray(o) ? o : {};
  } catch {
    return {};
  }
}

/**
 * GET /api/iso/evidence?requirementId=
 */
export async function list(req, res, next) {
  try {
    const tenantId = requireTenantIdOrRespond(req, res);
    if (!tenantId) return;

    const q = req.query?.requirementId;
    const requirementId = typeof q === 'string' ? q.trim() : Array.isArray(q) ? String(q[0] || '').trim() : '';
    const rows = await isoEvidenceService.listIsoEvidence(tenantId, {
      ...(requirementId ? { requirementId } : {})
    });
    res.json({ evidences: rows });
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/iso/evidence — JSON ou multipart (champ file optionnel).
 */
export async function create(req, res, next) {
  try {
    const tenantId = requireTenantIdOrRespond(req, res);
    if (!tenantId) return;

    const userId = req.qhseUser?.id;
    if (isRequireAuthEnabled() && !userId) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }
    if (!userId) {
      return res.status(400).json({
        error: 'Identifiant utilisateur requis pour la traçabilité des preuves ISO.'
      });
    }

    const isMulti = String(req.headers['content-type'] || '').includes('multipart/form-data');

    /** @type {{ requirementId: string, type: string, fileUrl?: string, content?: string, meta?: Record<string, unknown> }} */
    let data;
    /** @type {Buffer | null} */
    let fileBuffer = null;
    /** @type {{ originalName?: string, mimeType?: string | null }} */
    let fileMeta = {};

    if (isMulti) {
      const requirementId = String(req.body?.requirementId || '').trim();
      const type = String(req.body?.type || 'document').trim().toLowerCase();
      const fileUrl = req.body?.fileUrl ? String(req.body.fileUrl).trim() : undefined;
      const content = req.body?.content != null ? String(req.body.content) : undefined;
      const meta = parseMeta(req.body?.meta);
      if (!requirementId) {
        return res.status(400).json({ error: 'requirementId requis.' });
      }
      if (req.file?.buffer?.length) {
        fileBuffer = req.file.buffer;
        fileMeta = { originalName: req.file.originalname, mimeType: req.file.mimetype };
      }
      if (!fileBuffer?.length && !fileUrl?.trim() && !content?.trim()) {
        return res.status(400).json({ error: 'Fournissez un fichier, fileUrl ou content.' });
      }
      data = { requirementId, type, ...(fileUrl ? { fileUrl } : {}), ...(content?.trim() ? { content } : {}), meta };
    } else {
      const parsed = createIsoEvidenceJsonSchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        return sendJsonError(res, 422, 'Données invalides', req, {
          code: 'VALIDATION_ERROR',
          fieldErrors: parsed.error.flatten().fieldErrors
        });
      }
      data = { ...parsed.data, meta: parsed.data.meta ?? {} };
    }

    const row = await isoEvidenceService.createIsoEvidence(tenantId, userId, data, fileBuffer, fileMeta);
    res.status(201).json({ ok: true, evidence: row });
  } catch (err) {
    const code = /** @type {{ statusCode?: number }} */ (err)?.statusCode;
    if (code === 400) {
      return res.status(400).json({ error: err.message || 'Requête invalide' });
    }
    next(err);
  }
}

/**
 * PATCH /api/iso/evidence/:id/validate
 */
export async function validate(req, res, next) {
  try {
    const tenantId = requireTenantIdOrRespond(req, res);
    if (!tenantId) return;

    const userId = req.qhseUser?.id;
    if (isRequireAuthEnabled() && !userId) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }
    if (!userId) {
      return res.status(400).json({ error: 'Utilisateur requis.' });
    }

    const id = String(req.params.id ?? '').trim();
    if (!id) {
      return res.status(400).json({ error: 'Identifiant preuve requis.' });
    }

    const parsed = validateIsoEvidenceBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      return sendJsonError(res, 422, 'Données invalides', req, {
        code: 'VALIDATION_ERROR',
        fieldErrors: parsed.error.flatten().fieldErrors
      });
    }

    try {
      const row = await isoEvidenceService.validateIsoEvidence(tenantId, id, userId, parsed.data.status);
      res.json({ ok: true, evidence: row });
    } catch (err) {
      const code = /** @type {{ statusCode?: number }} */ (err)?.statusCode;
      if (code === 404) {
        return res.status(404).json({ error: 'Preuve introuvable.' });
      }
      throw err;
    }
  } catch (err) {
    next(err);
  }
}
