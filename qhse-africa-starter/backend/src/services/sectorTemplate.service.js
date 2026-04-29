import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const SECTORS_DIR = path.resolve(__dirname, '../../../data-packs/sectors');

const ALLOWED_SECTORS = {
  mining: { label: 'Mines' },
  construction: { label: 'Construction' },
  industry: { label: 'Industrie' },
  logistics: { label: 'Logistique' }
};

function normalizeSectorName(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase();
}

function createHttpError(statusCode, message, code) {
  const err = new Error(message);
  // @ts-ignore - used across controllers
  err.statusCode = statusCode;
  // @ts-ignore - used across controllers
  err.code = code;
  return err;
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

/**
 * Charge un template secteur à la demande (lecture fichier JSON).
 * Important : ne jamais charger tous les secteurs au démarrage.
 *
 * @param {string} sectorRaw
 */
export async function getSectorTemplate(sectorRaw) {
  const sector = normalizeSectorName(sectorRaw);
  if (!/^[a-z0-9-]+$/.test(sector)) {
    throw createHttpError(400, 'Nom de secteur invalide.', 'TEMPLATE_SECTOR_INVALID');
  }
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_SECTORS, sector)) {
    const allowed = Object.keys(ALLOWED_SECTORS).join(', ');
    throw createHttpError(
      400,
      `Secteur non autorisé. Valeurs possibles : ${allowed}.`,
      'TEMPLATE_SECTOR_NOT_ALLOWED'
    );
  }

  const filePath = path.join(SECTORS_DIR, `${sector}.json`);

  let raw;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (e) {
    // @ts-ignore
    if (e?.code === 'ENOENT') {
      throw createHttpError(404, 'Template secteur introuvable.', 'TEMPLATE_SECTOR_NOT_FOUND');
    }
    throw createHttpError(500, 'Impossible de charger le template secteur.', 'TEMPLATE_SECTOR_READ_FAILED');
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw createHttpError(500, 'Template secteur invalide côté serveur.', 'TEMPLATE_SECTOR_INVALID_JSON');
  }

  const label = String(parsed?.label || ALLOWED_SECTORS[sector].label || sector);

  return {
    sector,
    label,
    risks: ensureArray(parsed?.risks),
    recommendedActions: ensureArray(parsed?.recommendedActions),
    expectedEvidence: ensureArray(parsed?.expectedEvidence),
    fieldControls: ensureArray(parsed?.fieldControls),
    kpis: ensureArray(parsed?.kpis),
    dangerousSituations: ensureArray(parsed?.dangerousSituations)
  };
}

