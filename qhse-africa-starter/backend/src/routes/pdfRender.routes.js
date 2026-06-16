import { Router } from 'express';
import express from 'express';
import { renderHtmlToPdf } from '../lib/pdfRenderer.js';

const router = Router();

/**
 * POST /api/pdf/render
 * Body: { html: string, filename?: string, landscape?: boolean, margin?: {...} }
 * Réponse : application/pdf (rendu Chromium headless via Puppeteer).
 */
router.post('/render', express.json({ limit: '8mb' }), async (req, res, next) => {
  try {
    if (!req.qhseUser) {
      return res.status(401).json({ error: 'Authentification requise.' });
    }
    const html = String(req.body?.html || '');
    if (!html.trim()) {
      return res.status(400).json({ error: 'Champ "html" requis.' });
    }
    const filename = String(req.body?.filename || 'export.pdf').replace(/[^\w.-]+/g, '_');
    const pdf = await renderHtmlToPdf(html, {
      landscape: Boolean(req.body?.landscape),
      margin: req.body?.margin,
    });
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': pdf.length
    });
    res.send(pdf);
  } catch (e) {
    next(e);
  }
});

export default router;
