import { Router } from 'express';
import multer from 'multer';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { parseFdsBuffer } from '../services/fdsParser.service.js';
import * as risksService from '../services/risks.service.js';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Seuls les fichiers PDF sont acceptes.'));
  }
});

router.post('/analyze', requirePermission('risks', 'read'), upload.single('fds'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Aucun fichier PDF fourni.' });
    const result = await parseFdsBuffer(req.file.buffer, req.file.originalname);
    res.json(result);
  } catch (err) {
    next(err);
  }
});

router.post(
  '/analyze-and-create',
  requirePermission('risks', 'write'),
  upload.single('fds'),
  async (req, res, next) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'Aucun fichier PDF fourni.' });
      const hvRaw = req.body?.humanValidated;
      const humanValidated =
        hvRaw === true || hvRaw === 'true' || hvRaw === '1' || hvRaw === 1;
      if (!humanValidated) {
        return res.status(400).json({ error: 'Validation humaine requise avant création.' });
      }
      const parsed = await parseFdsBuffer(req.file.buffer, req.file.originalname);
      const g = Math.max(1, Math.min(5, Math.round(Number(parsed.severity) || 1)));
      const p = Math.max(1, Math.min(5, Math.round(Number(parsed.probability) || 1)));
      const risk = await risksService.createRisk(req.qhseTenantId, {
        title: parsed.riskTitle,
        description: parsed.riskDescription,
        category: parsed.category,
        probability: p,
        gravity: g,
        severity: g,
        status: 'open',
        owner: req.qhseUser?.name || null
      });
      res.status(201).json({ parsed, risk });
    } catch (err) {
      next(err);
    }
  }
);

export default router;
