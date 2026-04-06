import path from 'path';
import { createRequire } from 'module';
import * as XLSX from 'xlsx';
import {
  classifyQhseDocument,
  excelRowsToClassificationText
} from './documentClassification.service.js';
import { buildPrefillPayload } from './documentPrefill.service.js';

const require = createRequire(import.meta.url);
const pdfParse = require('pdf-parse');

const MAX_TEXT_PREVIEW = 14_000;
const MAX_EXCEL_ROWS_PREVIEW = 200;
const MAX_EXCEL_COLS_PREVIEW = 40;

const PDF_MIMES = new Set(['application/pdf']);
const EXCEL_MIMES = new Set([
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/vnd.ms-excel.sheet.macroEnabled.12'
]);

/**
 * @param {unknown} v
 */
function cellToPreviewString(v) {
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  return String(v);
}

/**
 * Phases 2–3 : classification + proposition de préremplissage (sans écriture BDD).
 * @param {object} result
 * @param {string} textForClassification
 * @param {unknown[][] | null} excelRows pour heuristiques tabulaires (aperçu seulement)
 */
function attachImportAnalysis(result, textForClassification, excelRows) {
  const c = classifyQhseDocument(textForClassification);
  const { prefillData, missingFields } = buildPrefillPayload({
    detectedDocumentType: c.detectedDocumentType,
    suggestedModule: c.suggestedModule,
    confidence: c.confidence,
    detectedHints: c.detectedHints,
    sourceText: textForClassification,
    excelRows: excelRows ?? null,
    originalName: result.originalName
  });
  return {
    ...result,
    fileType: result.detectedType,
    extractedPreview: result.preview,
    detectedDocumentType: c.detectedDocumentType,
    confidence: c.confidence,
    detectedHints: c.detectedHints,
    suggestedModule: c.suggestedModule,
    prefillData,
    missingFields
  };
}

/**
 * @param {string} originalName
 * @param {string} mimeType
 * @returns {'pdf' | 'excel' | 'unknown'}
 */
export function detectImportKind(originalName, mimeType) {
  const ext = path.extname(originalName || '').toLowerCase();
  const m = String(mimeType || '').toLowerCase();

  if (PDF_MIMES.has(m) || ext === '.pdf') return 'pdf';
  if (
    EXCEL_MIMES.has(m) ||
    ext === '.xlsx' ||
    ext === '.xls' ||
    ext === '.xlsm'
  ) {
    return 'excel';
  }
  return 'unknown';
}

/**
 * @param {Buffer} buffer
 * @param {string} originalName
 * @param {string} mimeType
 */
export async function buildImportPreview(buffer, originalName, mimeType) {
  if (!buffer || buffer.length === 0) {
    const err = new Error('Fichier vide ou illisible.');
    err.code = 'EMPTY_FILE';
    throw err;
  }

  const kind = detectImportKind(originalName, mimeType);
  if (kind === 'unknown') {
    const err = new Error(
      'Type non pris en charge. Formats acceptés : PDF, XLS, XLSX.'
    );
    err.code = 'UNSUPPORTED_TYPE';
    throw err;
  }

  if (kind === 'pdf') {
    const data = await pdfParse(buffer);
    const full = String(data.text ?? '');
    const truncated = full.length > MAX_TEXT_PREVIEW;
    const text = truncated
      ? `${full.slice(0, MAX_TEXT_PREVIEW)}\n\n[… Aperçu tronqué — extrait complet : ${full.length} caractères]`
      : full;

    const base = {
      detectedType: 'pdf',
      originalName,
      mimeType: mimeType || 'application/pdf',
      preview: {
        kind: 'text',
        text,
        truncated,
        totalChars: full.length
      },
      meta: {
        pageCount: data.numpages ?? null
      }
    };
    return attachImportAnalysis(base, full, null);
  }

  const wb = XLSX.read(buffer, { type: 'buffer', cellDates: true });
  const sheetNames = wb.SheetNames || [];
  if (sheetNames.length === 0) {
    const base = {
      detectedType: 'excel',
      originalName,
      mimeType:
        mimeType ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      preview: {
        kind: 'sheet',
        sheetNames: [],
        activeSheet: null,
        rows: [],
        truncated: false,
        totalRowsEstimated: 0,
        columnsPreviewed: 0
      },
      meta: { sheetCount: 0 }
    };
    return attachImportAnalysis(base, '', null);
  }

  const activeSheet = sheetNames[0];
  const sheet = wb.Sheets[activeSheet];
  const raw = XLSX.utils.sheet_to_json(sheet, {
    header: 1,
    defval: '',
    raw: false
  });

  const totalRows = Array.isArray(raw) ? raw.length : 0;
  const slice = Array.isArray(raw)
    ? raw.slice(0, MAX_EXCEL_ROWS_PREVIEW)
    : [];
  const rows = slice.map((row) => {
    const arr = Array.isArray(row) ? row : [];
    return arr
      .slice(0, MAX_EXCEL_COLS_PREVIEW)
      .map((c) => cellToPreviewString(c));
  });

  const rowTruncated = totalRows > MAX_EXCEL_ROWS_PREVIEW;
  const colTruncated = slice.some(
    (row) => Array.isArray(row) && row.length > MAX_EXCEL_COLS_PREVIEW
  );

  const base = {
    detectedType: 'excel',
    originalName,
    mimeType:
      mimeType ||
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    preview: {
      kind: 'sheet',
      sheetNames,
      activeSheet,
      rows,
      truncated: rowTruncated || colTruncated,
      totalRowsEstimated: totalRows,
      columnsPreviewed: MAX_EXCEL_COLS_PREVIEW
    },
    meta: {
      sheetCount: sheetNames.length
    }
  };
  const excelText = excelRowsToClassificationText(rows);
  return attachImportAnalysis(base, excelText, rows);
}
