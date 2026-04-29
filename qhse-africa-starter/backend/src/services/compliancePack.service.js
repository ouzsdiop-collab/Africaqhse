import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const COMPLIANCE_DIR = path.resolve(__dirname, '../../../data-packs/compliance');
const COUNTRIES_DIR = path.join(COMPLIANCE_DIR, 'countries');
const STANDARDS_DIR = path.join(COMPLIANCE_DIR, 'standards');

const ALLOWED_COUNTRIES = {
  CI: { label: "Côte d’Ivoire" }
};

const ALLOWED_STANDARDS = {
  'iso-45001': { label: 'ISO 45001' },
  'iso-14001': { label: 'ISO 14001' },
  'iso-9001': { label: 'ISO 9001' }
};

function createHttpError(statusCode, message, code) {
  const err = new Error(message);
  // @ts-ignore
  err.statusCode = statusCode;
  // @ts-ignore
  err.code = code;
  return err;
}

function ensureArray(v) {
  return Array.isArray(v) ? v : [];
}

function normalizeCountryCode(raw) {
  return String(raw || '').trim().toUpperCase();
}

function normalizeStandardCode(raw) {
  return String(raw || '')
    .trim()
    .toLowerCase();
}

function normalizeSector(raw) {
  const s = String(raw || '')
    .trim()
    .toLowerCase();
  return s === '' ? null : s;
}

async function readJsonFile(filePath, notFoundErr) {
  let raw;
  try {
    raw = await readFile(filePath, 'utf8');
  } catch (e) {
    // @ts-ignore
    if (e?.code === 'ENOENT') throw notFoundErr;
    throw createHttpError(500, 'Impossible de charger le pack compliance.', 'COMPLIANCE_PACK_READ_FAILED');
  }
  try {
    return JSON.parse(raw);
  } catch {
    throw createHttpError(500, 'Pack compliance invalide côté serveur.', 'COMPLIANCE_PACK_INVALID_JSON');
  }
}

export async function getCountryCompliance(countryCodeRaw) {
  const countryCode = normalizeCountryCode(countryCodeRaw);
  if (!/^[A-Z]{2}$/.test(countryCode)) {
    throw createHttpError(400, 'Code pays invalide.', 'COMPLIANCE_COUNTRY_INVALID');
  }
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_COUNTRIES, countryCode)) {
    const allowed = Object.keys(ALLOWED_COUNTRIES).join(', ');
    throw createHttpError(
      400,
      `Pays non supporté. Valeurs possibles : ${allowed}.`,
      'COMPLIANCE_COUNTRY_NOT_SUPPORTED'
    );
  }

  const fp = path.join(COUNTRIES_DIR, `${countryCode.toLowerCase()}.json`);
  const json = await readJsonFile(
    fp,
    createHttpError(404, 'Pack pays introuvable.', 'COMPLIANCE_COUNTRY_NOT_FOUND')
  );

  const domains = ensureArray(json?.domains).map((d) => ({
    id: String(d?.id || ''),
    label: String(d?.label || ''),
    requirements: ensureArray(d?.requirements)
  }));

  return {
    country: countryCode,
    label: String(json?.label || ALLOWED_COUNTRIES[countryCode].label),
    domains
  };
}

export async function getStandardCompliance(standardCodeRaw) {
  const standardCode = normalizeStandardCode(standardCodeRaw);
  if (!/^[a-z0-9-]+$/.test(standardCode)) {
    throw createHttpError(400, 'Code norme invalide.', 'COMPLIANCE_STANDARD_INVALID');
  }
  if (!Object.prototype.hasOwnProperty.call(ALLOWED_STANDARDS, standardCode)) {
    const allowed = Object.keys(ALLOWED_STANDARDS).join(', ');
    throw createHttpError(
      400,
      `Norme non supportée. Valeurs possibles : ${allowed}.`,
      'COMPLIANCE_STANDARD_NOT_SUPPORTED'
    );
  }

  const fp = path.join(STANDARDS_DIR, `${standardCode}.json`);
  const json = await readJsonFile(
    fp,
    createHttpError(404, 'Pack norme introuvable.', 'COMPLIANCE_STANDARD_NOT_FOUND')
  );

  return {
    standard: standardCode,
    label: String(json?.label || ALLOWED_STANDARDS[standardCode].label),
    requirements: ensureArray(json?.requirements)
  };
}

function indexRequirements(reqs) {
  /** @type {Map<string, any>} */
  const map = new Map();
  for (const r of ensureArray(reqs)) {
    const id = String(r?.id || '').trim();
    if (!id) continue;
    if (!map.has(id)) map.set(id, r);
  }
  return map;
}

export async function getCompliancePack({ countryCode, standards, sector }) {
  const cc = normalizeCountryCode(countryCode);
  const sectorNorm = normalizeSector(sector);

  const country = await getCountryCompliance(cc);

  const stdCodes = ensureArray(standards)
    .map((s) => normalizeStandardCode(s))
    .filter((s) => s);
  const uniqueStdCodes = [...new Set(stdCodes)];

  const standardsResolved = [];
  for (const sc of uniqueStdCodes) {
    standardsResolved.push(await getStandardCompliance(sc));
  }

  // Merge requirements (lightweight): country domains + standards requirements.
  const merged = new Map();
  for (const d of ensureArray(country?.domains)) {
    for (const r of ensureArray(d?.requirements)) {
      const id = String(r?.id || '').trim();
      if (!id) continue;
      if (!merged.has(id)) merged.set(id, r);
    }
  }
  for (const s of standardsResolved) {
    const indexed = indexRequirements(s?.requirements);
    for (const [id, r] of indexed.entries()) {
      if (!merged.has(id)) merged.set(id, r);
    }
  }

  // Optional: if a sector is provided, keep it in response; no heavy filtering.
  return {
    disclaimer:
      "Base de conformité indicative à valider selon les textes applicables et le contexte de l’entreprise.",
    country,
    standards: standardsResolved,
    sector: sectorNorm,
    mergedRequirements: [...merged.values()]
  };
}

