import { createRequire } from 'module';
import * as risksService from './risks.service.js';
import * as actionsService from './actions.service.js';
import { prisma } from '../db.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const PAYLOAD_MARKER = 'QHSE_CONTROL_IMPORT_PAYLOAD';

function safeJsonParse(raw) { try { return JSON.parse(raw); } catch { return null; } }

function extractPayloadFromText(text) {
  const idx = String(text || '').indexOf(PAYLOAD_MARKER);
  if (idx < 0) return null;
  const start = text.indexOf('{', idx);
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) return null;
  return safeJsonParse(text.slice(start, end + 1));
}

export async function previewDuerpImport(buffer, originalName, mimeType) {
  const ext = String(originalName || '').toLowerCase();
  const isJson = ext.endsWith('.qhse.json') || mimeType?.includes('json');
  let payload = null;
  let sourceMode = 'pdf_fallback';
  let rawText = '';

  if (isJson) {
    payload = safeJsonParse(buffer.toString('utf-8'));
    sourceMode = 'json';
  } else {
    const data = await pdfParse(buffer);
    rawText = String(data.text || '');
    payload = extractPayloadFromText(rawText);
    if (payload) sourceMode = 'embedded_payload';
  }

  const units = Array.isArray(payload?.unitesTravail) ? payload.unitesTravail : [];
  const risks = Array.isArray(payload?.risques) ? payload.risques : [];
  const actions = Array.isArray(payload?.actions) ? payload.actions : [];
  const missingFields = [];
  if (!payload?.entreprise) missingFields.push('entreprise');
  if (!payload?.responsableHse) missingFields.push('responsableHse');
  if (!payload?.date) missingFields.push('date');
  const confidence = payload ? 92 : 45;

  return {
    sourceMode,
    sourceType: 'DUERP_GENERATOR',
    sourceFileName: originalName,
    importBatchId: payload?.importBatchId || null,
    preview: {
      entreprise: payload?.entreprise || 'Non détectée',
      responsableHse: payload?.responsableHse || 'Non détecté',
      date: payload?.date || null,
      unitesTravail: units,
      risques: risks,
      actions,
      missingFields,
      confidence,
      textExcerpt: payload ? null : rawText.slice(0, 2400)
    },
    payload
  };
}

export async function commitDuerpImport({ tenantId, role, previewPayload, acknowledgements, sourceFileName }) {
  if (String(role || '').toUpperCase() === 'SUPER_ADMIN' && !tenantId) {
    return { ok: false, error: 'SUPER_ADMIN hors setupMode : import refusé.' };
  }
  const checks = acknowledgements || {};
  if (!checks.reviewed || !checks.risksConfirmed || !checks.officialValidationDisclaimer) {
    return { ok: false, error: 'Validation humaine obligatoire incomplète.' };
  }
  const payload = previewPayload || {};
  const batch = payload.importBatchId || null;
  const existingBatch = batch
    ? await prisma.importHistory.findFirst({ where: { tenantId: tenantId || null, createdEntityRef: batch } })
    : null;

  let risksCreated = 0;
  let actionsCreated = 0;
  let unitsCreated = 0;
  const errors = [];
  const ignored = [];
  const riskMap = new Map();

  for (const unit of Array.isArray(payload.unitesTravail) ? payload.unitesTravail : []) {
    if (!unit || !String(unit).trim()) continue;
    const exists = await prisma.site.findFirst({ where: { tenantId: tenantId || null, name: String(unit).trim() } });
    if (!exists) {
      await prisma.site.create({ data: { tenantId: tenantId || null, name: String(unit).trim() } });
      unitsCreated += 1;
    }
  }

  for (const item of Array.isArray(payload.risques) ? payload.risques : []) {
    try {
      const created = await risksService.createRisk(tenantId, {
        title: item.title || item.risque || 'Risque importé DUERP',
        category: item.category || 'DUERP',
        gravity: Number(item.gravity || item.gravite || 3),
        probability: Number(item.probability || item.probabilite || 3),
        owner: payload.responsableHse || null,
        description: item.description || null
      });
      riskMap.set(item.title || item.risque, created.id);
      risksCreated += 1;
    } catch (e) {
      errors.push(`Risque: ${String(e.message || e)}`);
    }
  }

  for (const act of Array.isArray(payload.actions) ? payload.actions : []) {
    try {
      await actionsService.createAction(tenantId, {
        title: act.title || act.action || 'Action importée DUERP',
        detail: act.detail || null,
        owner: act.owner || payload.responsableHse || null,
        riskId: riskMap.get(act.riskTitle || act.risque) || null,
        dueDate: act.dueDate || null,
        status: 'À lancer'
      });
      actionsCreated += 1;
    } catch (e) {
      errors.push(`Action: ${String(e.message || e)}`);
    }
  }

  await prisma.importHistory.create({ data: {
    tenantId: tenantId || null,
    fileName: sourceFileName || 'DUERP import',
    fileType: 'duerp',
    status: 'validated',
    moduleCreated: 'duerp',
    createdEntityRef: batch,
    warnings: { sourceType: 'DUERP_GENERATOR', importBatchId: batch }
  } });

  return {
    ok: true,
    rollbackAvailable: Boolean(existingBatch),
    risksCreated,
    actionsCreated,
    unitsCreated,
    ignored,
    errors
  };
}
