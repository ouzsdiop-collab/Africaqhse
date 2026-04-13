import { Router } from 'express';
import multer from 'multer';
import * as controller from '../controllers/controlledDocuments.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { controlledDocumentUploadLimiter } from '../middleware/apiRateLimit.middleware.js';
import { validateBody } from '../lib/validation.js';
import {
  createControlledDocumentSchema,
  patchControlledDocumentSchema
} from '../validation/controlledDocumentSchemas.js';
import { prisma } from '../db.js';
import { parseFdsDocument } from '../services/documentClassification.service.js';
import { normalizeTenantId } from '../lib/tenantScope.js';

const router = Router();

const FDS_MAX_BYTES = Number(process.env.CONTROLLED_DOCUMENT_MAX_BYTES) || 25 * 1024 * 1024;
const fdsUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FDS_MAX_BYTES }
});

function fdsMulterSingle(req, res, next) {
  fdsUpload.single('file')(req, res, (err) => {
    if (!err) return next();
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: `Fichier trop volumineux (max. ${Math.round(FDS_MAX_BYTES / 1024 / 1024)} Mo).`
        });
      }
      return res.status(400).json({ error: err.message || 'Upload invalide' });
    }
    console.error('[controlled-documents] fds multer', err);
    return res.status(400).json({ error: 'Envoi du fichier impossible.' });
  });
}

/**
 * @param {unknown} v
 * @returns {string[]}
 */
function parseJsonStringArray(v) {
  if (v == null) return [];
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (typeof v === 'string') {
    const t = v.trim();
    if (!t) return [];
    try {
      const j = JSON.parse(t);
      if (Array.isArray(j)) return j.map((x) => String(x).trim()).filter(Boolean);
    } catch {
      /* fallthrough */
    }
    return t
      .split(/[\n,;]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

/** Jeton signé — doit être déclaré avant /:id */
router.get('/stream', controller.streamByToken);

router.get('/', requirePermission('controlled_documents', 'read'), controller.list);

router.post(
  '/',
  controlledDocumentUploadLimiter,
  requirePermission('controlled_documents', 'write'),
  controller.uploadSingleControlledFile,
  validateBody(createControlledDocumentSchema),
  controller.create
);

router.get(
  '/products/fds',
  requirePermission('controlled_documents', 'read'),
  async (req, res, next) => {
    try {
      const tenantId = normalizeTenantId(req.qhseTenantId);
      const siteIdRaw = req.query.siteId;
      const siteId =
        typeof siteIdRaw === 'string' && siteIdRaw.trim() ? siteIdRaw.trim() : undefined;
      const where = { tenantId, ...(siteId ? { siteId } : {}) };
      const rows = await prisma.product.findMany({
        where,
        orderBy: { updatedAt: 'desc' },
        take: 300,
        include: { siteRecord: { select: { id: true, name: true } } }
      });
      res.json(rows);
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/products/fds/parse',
  controlledDocumentUploadLimiter,
  requirePermission('controlled_documents', 'write'),
  fdsMulterSingle,
  async (req, res, next) => {
    try {
      const tenantId = normalizeTenantId(req.qhseTenantId);
      if (String(req.body?.confirm || '') === '1' && req.body?.productId) {
        const id = String(req.body.productId).trim();
        if (!id) {
          return res.status(400).json({ error: 'productId requis' });
        }
        const existingRow = await prisma.product.findFirst({
          where: { id, tenantId },
          select: { id: true }
        });
        if (!existingRow) {
          return res.status(404).json({ error: 'Produit introuvable.' });
        }
        const name = String(req.body.name || '').trim();
        if (!name) {
          return res.status(400).json({ error: 'Nom produit requis' });
        }
        const hStatements = parseJsonStringArray(req.body.hStatementsJson);
        const pStatements = parseJsonStringArray(req.body.pStatementsJson);
        const ghsPictograms = parseJsonStringArray(req.body.ghsPictogramsJson);
        const siteIdRaw = req.body.siteId;
        const siteId =
          typeof siteIdRaw === 'string' && siteIdRaw.trim() ? siteIdRaw.trim() : null;
        const updated = await prisma.product.update({
          where: { id },
          data: {
            name,
            supplier: String(req.body.supplier || '').trim() || null,
            casNumber: String(req.body.casNumber || '').trim() || null,
            ceNumber: String(req.body.ceNumber || '').trim() || null,
            hStatements,
            pStatements,
            ghsPictograms,
            vlep: String(req.body.vlep || '').trim() || null,
            storageClass: String(req.body.storageClass || '').trim() || null,
            siteId,
            tenantId
          },
          include: { siteRecord: { select: { id: true, name: true } } }
        });
        return res.json({
          parsed: null,
          product: updated,
          message: 'Produit mis à jour'
        });
      }

      if (!req.file || !req.file.buffer) {
        return res.status(400).json({ error: 'Fichier PDF requis (champ file)' });
      }
      const mime = String(req.file.mimetype || '').toLowerCase();
      if (!mime.includes('pdf')) {
        return res.status(400).json({ error: 'Seuls les fichiers PDF sont acceptés pour la FDS' });
      }

      const parsed = await parseFdsDocument(req.file.buffer);
      const siteIdRaw = req.body.siteId;
      const siteId =
        typeof siteIdRaw === 'string' && siteIdRaw.trim() ? siteIdRaw.trim() : null;

      const name = parsed.productName || 'Produit (FDS)';
      const cas = parsed.casNumber?.trim() || null;

      let existing = null;
      if (cas && siteId) {
        existing = await prisma.product.findFirst({
          where: { tenantId, siteId, casNumber: cas }
        });
      }
      if (!existing && cas && !siteId) {
        existing = await prisma.product.findFirst({
          where: { tenantId, siteId: null, casNumber: cas }
        });
      }
      if (!existing) {
        existing = await prisma.product.findFirst({
          where: { tenantId, name, ...(siteId ? { siteId } : { siteId: null }) }
        });
      }

      const data = {
        name,
        supplier: parsed.supplier?.trim() || null,
        casNumber: cas,
        ceNumber: parsed.ceNumber?.trim() || null,
        hStatements: parsed.hStatements,
        pStatements: parsed.pStatements,
        ghsPictograms: parsed.ghs,
        vlep: parsed.vlep,
        storageClass: parsed.storageClass,
        fdsFileUrl: req.file.originalname ? `fds:${req.file.originalname}` : null,
        siteId,
        tenantId
      };

      const product = existing
        ? await prisma.product.update({
            where: { id: existing.id },
            data,
            include: { siteRecord: { select: { id: true, name: true } } }
          })
        : await prisma.product.create({
            data,
            include: { siteRecord: { select: { id: true, name: true } } }
          });

      res.status(existing ? 200 : 201).json({ parsed, product });
    } catch (e) {
      if (e?.statusCode === 400) {
        return res.status(400).json({ error: e.message || 'Requête invalide' });
      }
      next(e);
    }
  }
);

router.get(
  '/:id/export',
  requirePermission('controlled_documents', 'read'),
  controller.exportWatermarked
);

router.get(
  '/:id/download',
  requirePermission('controlled_documents', 'read'),
  controller.downloadAuthenticated
);

router.post(
  '/:id/access-token',
  requirePermission('controlled_documents', 'read'),
  controller.issueAccessToken
);

router.patch(
  '/:id',
  requirePermission('controlled_documents', 'write'),
  validateBody(patchControlledDocumentSchema),
  controller.patchMeta
);

router.get('/:id', requirePermission('controlled_documents', 'read'), controller.getById);

export default router;
