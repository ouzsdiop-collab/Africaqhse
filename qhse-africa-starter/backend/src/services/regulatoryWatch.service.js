import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';
import { requestJsonCompletion } from './aiProvider.service.js';

function serialize(row) {
  if (!row) return row;
  return {
    ...row,
    effectiveDate: row.effectiveDate ? row.effectiveDate.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function parseOptDate(v) {
  if (v == null || v === '') return null;
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
}

async function getTenantDefaultCountry(tenantId) {
  const tid = normalizeTenantId(tenantId);
  if (!tid) return null;
  const tenant = await prisma.tenant.findUnique({ where: { id: tid }, select: { settings: true } });
  const settings = tenant?.settings && typeof tenant.settings === 'object' ? tenant.settings : {};
  const country = settings.country;
  return typeof country === 'string' && country.trim() ? country.trim().toUpperCase() : null;
}

export async function findAllRegulatoryWatchEntries(tenantId, opts = {}) {
  const tf = prismaTenantFilter(tenantId);
  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  let country = opts.country != null && String(opts.country).trim() ? String(opts.country).trim().toUpperCase() : null;
  if (!country) country = await getTenantDefaultCountry(tenantId);
  if (country) where.country = country;
  const rows = await prisma.regulatoryWatchEntry.findMany({
    where,
    orderBy: [{ effectiveDate: 'desc' }, { createdAt: 'desc' }]
  });
  return rows.map(serialize);
}

export async function createRegulatoryWatchEntry(tenantId, data, createdByUserId) {
  const tid = normalizeTenantId(tenantId);
  if (!tid) {
    const err = new Error('Contexte organisation requis');
    err.statusCode = 403;
    throw err;
  }
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const country = typeof data.country === 'string' ? data.country.trim().toUpperCase() : '';
  if (!title || country.length !== 2) {
    const err = new Error('title et country (code à 2 lettres) requis');
    err.statusCode = 400;
    throw err;
  }
  const created = await prisma.regulatoryWatchEntry.create({
    data: {
      tenantId: tid,
      title,
      country,
      category: data.category != null && data.category !== '' ? String(data.category).trim() : null,
      officialUrl: data.officialUrl != null && data.officialUrl !== '' ? String(data.officialUrl).trim() : null,
      sourceText: data.sourceText != null && data.sourceText !== '' ? String(data.sourceText) : null,
      summary: data.summary != null && data.summary !== '' ? String(data.summary) : null,
      keyObligationsJson: Array.isArray(data.keyObligations) ? data.keyObligations : [],
      effectiveDate: parseOptDate(data.effectiveDate),
      impactStatus: typeof data.impactStatus === 'string' && data.impactStatus ? data.impactStatus : 'pending',
      createdByUserId: createdByUserId || null
    }
  });
  return serialize(created);
}

export async function updateRegulatoryWatchEntry(tenantId, id, patch) {
  const eid = String(id ?? '').trim();
  if (!eid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.regulatoryWatchEntry.findFirst({ where: { id: eid, ...tf } });
  if (!existing) {
    const err = new Error('Texte introuvable');
    err.statusCode = 404;
    throw err;
  }
  /** @type {Record<string, unknown>} */
  const data = {};
  if ('title' in patch) {
    const v = typeof patch.title === 'string' ? patch.title.trim() : '';
    if (!v) {
      const err = new Error('title ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    data.title = v;
  }
  if ('country' in patch) {
    const v = typeof patch.country === 'string' ? patch.country.trim().toUpperCase() : '';
    if (v.length !== 2) {
      const err = new Error('country invalide');
      err.statusCode = 400;
      throw err;
    }
    data.country = v;
  }
  if ('category' in patch) {
    data.category = patch.category == null || patch.category === '' ? null : String(patch.category).trim();
  }
  if ('officialUrl' in patch) {
    data.officialUrl = patch.officialUrl == null || patch.officialUrl === '' ? null : String(patch.officialUrl).trim();
  }
  if ('sourceText' in patch) {
    data.sourceText = patch.sourceText == null || patch.sourceText === '' ? null : String(patch.sourceText);
  }
  if ('summary' in patch) {
    data.summary = patch.summary == null || patch.summary === '' ? null : String(patch.summary);
  }
  if ('keyObligations' in patch) {
    data.keyObligationsJson = Array.isArray(patch.keyObligations) ? patch.keyObligations : [];
  }
  if ('effectiveDate' in patch) data.effectiveDate = parseOptDate(patch.effectiveDate);
  if ('impactStatus' in patch) data.impactStatus = patch.impactStatus;
  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }
  const upd = await prisma.regulatoryWatchEntry.updateMany({ where: { id: eid, ...tf }, data });
  if (!upd?.count) {
    const err = new Error('Texte introuvable');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.regulatoryWatchEntry.findFirst({ where: { id: eid, ...tf } });
  return serialize(updated);
}

export async function deleteRegulatoryWatchEntry(tenantId, id) {
  const eid = String(id ?? '').trim();
  if (!eid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const del = await prisma.regulatoryWatchEntry.deleteMany({ where: { id: eid, ...tf } });
  if (!del?.count) {
    const err = new Error('Texte introuvable');
    err.statusCode = 404;
    throw err;
  }
}

/**
 * Propose un résumé + obligations clés à partir d'un texte source, via l'IA.
 * Résultat purement consultatif : l'utilisateur doit relire/éditer avant sauvegarde.
 */
export async function summarizeRegulatoryText(sourceText) {
  const text = String(sourceText ?? '').trim();
  if (!text) {
    const err = new Error('sourceText requis');
    err.statusCode = 400;
    throw err;
  }
  const system =
    'Tu es un assistant juridique QHSE. Analyse le texte réglementaire fourni et réponds UNIQUEMENT en JSON ' +
    'avec la forme { "type": "regulatory_summary", "confidence": number, "content": { "summary": string, "keyObligations": string[] } }. ' +
    "Le résumé doit être en français, factuel, sans interprétation juridique formelle.";
  const result = await requestJsonCompletion({ system, user: text.slice(0, 50_000) });
  const content = result.data?.content && typeof result.data.content === 'object' ? result.data.content : {};
  return {
    summary: typeof content.summary === 'string' ? content.summary : '',
    keyObligations: Array.isArray(content.keyObligations) ? content.keyObligations.filter((s) => typeof s === 'string') : [],
    provider: result.provider,
    success: result.success
  };
}
