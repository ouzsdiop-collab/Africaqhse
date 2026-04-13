/**
 * Import de fichiers : analyse en mémoire (multer.memoryStorage) — pas d’écriture disque / S3 ici.
 * Le stockage objet (S3 ou local) est réservé aux documents contrôlés : documentStorage.service.js.
 */
import multer from 'multer';
import * as documentImportService from '../services/documentImport.service.js';
import * as importConfirmService from '../services/importConfirm.service.js';
import * as importHistoryService from '../services/importHistory.service.js';
import { auditUserIdFromRequest, writeAuditLog } from '../services/auditLog.service.js';

const MAX_BYTES = 12 * 1024 * 1024;

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_BYTES },
  fileFilter(req, file, cb) {
    const kind = documentImportService.detectImportKind(
      file.originalname,
      file.mimetype
    );
    if (kind === 'unknown') {
      const err = new Error('TYPE_NON_SUPPORTE');
      err.code = 'TYPE_NON_SUPPORTE';
      return cb(err);
    }
    cb(null, true);
  }
});

/**
 * Multer single file + réponses JSON pour erreurs d’upload.
 */
export function uploadSingleFile(req, res, next) {
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
    if (err.code === 'TYPE_NON_SUPPORTE') {
      return res.status(415).json({
        error: 'Type de fichier non pris en charge (PDF, XLS, XLSX).'
      });
    }
    console.error('[imports] multer / upload', err);
    return res.status(400).json({
      error:
        typeof err?.message === 'string' && err.message
          ? err.message
          : 'Envoi du fichier impossible. Réessayez ou choisissez un autre fichier.'
    });
  });
}

export async function preview(req, res, next) {
  try {
    if (!req.file?.buffer) {
      return res.status(400).json({
        error: 'Aucun fichier reçu (champ formulaire attendu : file).'
      });
    }
    const result = await documentImportService.buildImportPreview(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype
    );
    let importHistoryId = null;
    try {
      const row = await importHistoryService.createAnalysisSuccessRecord({
        tenantId: req.qhseTenantId,
        fileName: req.file.originalname,
        fileType: result.detectedType ?? 'unknown',
        detectedDocumentType: result.detectedDocumentType ?? null,
        suggestedModule: result.suggestedModule?.pageId ?? null,
        suggestedModuleLabel: result.suggestedModule?.label ?? null,
        confidence: result.confidence ?? null,
        missingFields: result.missingFields ?? null,
        detectedHints: result.detectedHints ?? null,
        userId: req.qhseUser?.id ?? null,
        userName: req.qhseUser?.name ?? null
      });
      importHistoryId = row.id;
    } catch (logErr) {
      console.error('[imports] importHistory create', logErr);
    }
    res.json({ ...result, importHistoryId });
  } catch (err) {
    if (req.file?.originalname) {
      try {
        const kind = documentImportService.detectImportKind(
          req.file.originalname,
          req.file.mimetype
        );
        await importHistoryService.createAnalysisFailedRecord({
          tenantId: req.qhseTenantId,
          fileName: req.file.originalname,
          fileType: kind,
          errorMessage:
            err.code === 'UNSUPPORTED_TYPE'
              ? String(err.message || 'Type non supporté')
              : err.code === 'EMPTY_FILE'
                ? String(err.message || 'Fichier vide')
                : String(err.message || 'Erreur analyse'),
          userId: req.qhseUser?.id ?? null,
          userName: req.qhseUser?.name ?? null
        });
      } catch (logErr) {
        console.error('[imports] importHistory failed record', logErr);
      }
    }
    if (err.code === 'UNSUPPORTED_TYPE') {
      return res.status(415).json({ error: err.message });
    }
    if (err.code === 'EMPTY_FILE') {
      return res.status(400).json({ error: err.message });
    }
    console.error('[imports] preview', err);
    return res.status(422).json({
      error:
        'Impossible d’extraire le contenu du fichier (fichier corrompu ou format interne non supporté).'
    });
  }
}

/**
 * POST /api/imports/confirm — validation d’un brouillon et création réelle (audit / incident).
 * Body : { targetModule | suggestedModule.pageId, validatedData, sourceFileName? }
 */
export async function confirm(req, res, next) {
  try {
    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const targetModule =
      (typeof body.targetModule === 'string' && body.targetModule) ||
      (body.suggestedModule && body.suggestedModule.pageId) ||
      '';
    const validatedData = body.validatedData;
    const role = req.qhseUser?.role;
    const importHistoryId =
      typeof body.importHistoryId === 'string'
        ? body.importHistoryId.trim()
        : '';

    const result = await importConfirmService.confirmValidatedImport({
      tenantId: req.qhseTenantId,
      targetModule,
      validatedData,
      role
    });

    try {
      await importHistoryService.applyConfirmResult(
        req.qhseTenantId,
        importHistoryId || null,
        result,
        targetModule
      );
    } catch (logErr) {
      console.error('[imports] importHistory confirm update', logErr);
    }

    if (result.success) {
      void writeAuditLog({
        tenantId: req.qhseTenantId,
        userId: auditUserIdFromRequest(req),
        resource: 'imports',
        resourceId: importHistoryId || 'confirm',
        action: 'confirm',
        metadata: {
          targetModule,
          moduleCreated: result.moduleCreated ?? null,
          createdEntityRef: result.createdEntityRef ?? null
        }
      });
      return res.status(201).json({
        success: true,
        moduleCreated: result.moduleCreated,
        createdEntityId: result.createdEntityId,
        createdEntityRef: result.createdEntityRef,
        warnings: result.warnings ?? [],
        importHistoryId: importHistoryId || null
      });
    }

    const msg = result.warnings?.[0] ?? 'Validation impossible';
    const forbidden = /permission/i.test(msg);
    return res.status(forbidden ? 403 : 422).json({
      success: false,
      moduleCreated: result.moduleCreated ?? null,
      createdEntityId: null,
      createdEntityRef: null,
      warnings: result.warnings ?? [],
      importHistoryId: importHistoryId || null
    });
  } catch (err) {
    next(err);
  }
}

export async function listHistory(req, res, next) {
  try {
    const rows = await importHistoryService.findAllImportHistory(req.qhseTenantId);
    res.json(rows);
  } catch (err) {
    console.error('[imports] listHistory', err);
    const code = err && err.code;
    if (code === 'P2021' || /no such table/i.test(String(err.message))) {
      return res.status(503).json({
        error:
          'Historique d’import indisponible : exécutez `npx prisma db push` dans le dossier backend.'
      });
    }
    next(err);
  }
}

export async function getHistoryById(req, res, next) {
  try {
    const id = String(req.params.id ?? '').trim();
    if (!id) {
      return res.status(400).json({ error: 'Identifiant requis' });
    }
    const row = await importHistoryService.findImportHistoryById(req.qhseTenantId, id);
    if (!row) {
      return res.status(404).json({ error: 'Import introuvable' });
    }
    res.json(row);
  } catch (err) {
    next(err);
  }
}
