/**
 * Documents contrôlés — validation classification × rôle, sans exposition du chemin disque.
 */

import { prisma } from '../db.js';
import { can } from '../lib/permissions.js';
import { readControlledFileBuffer, saveControlledFile, deleteControlledFile } from './documentStorage.service.js';
import { addWatermarkToPdf } from './documentWatermark.service.js';

const CLASSIFICATIONS = new Set(['normal', 'sensible', 'critique']);

const RENEW_DAYS = 30;

/**
 * @param {Date | string | null | undefined} expiresAt
 * @returns {{ key: 'valide'|'a_renouveler'|'expire'|'sans_echeance', label: string, daysUntil: number | null }}
 */
export function computeDocumentComplianceStatus(expiresAt) {
  if (expiresAt == null) {
    return { key: 'sans_echeance', label: 'Sans échéance', daysUntil: null };
  }
  const end = expiresAt instanceof Date ? expiresAt : new Date(expiresAt);
  if (Number.isNaN(end.getTime())) {
    return { key: 'sans_echeance', label: 'Sans échéance', daysUntil: null };
  }
  const startOf = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const now = new Date();
  const days = Math.round((startOf(end).getTime() - startOf(now).getTime()) / 86400000);
  if (days < 0) {
    return { key: 'expire', label: 'Expiré', daysUntil: days };
  }
  if (days <= RENEW_DAYS) {
    return { key: 'a_renouveler', label: 'À renouveler', daysUntil: days };
  }
  return { key: 'valide', label: 'Valide', daysUntil: days };
}

/**
 * @param {string | null | undefined} c
 */
export function normalizeClassification(c) {
  const s = String(c || 'normal').toLowerCase().trim();
  return CLASSIFICATIONS.has(s) ? s : 'normal';
}

/**
 * @param {{ role: string } | null | undefined} user
 * @param {string} classification
 * @param {'read' | 'write'} need
 */
export function canAccessControlledDocument(user, classification, need = 'read') {
  if (!user || typeof user.role !== 'string') return false;
  const role = user.role.trim().toUpperCase();
  if (!role) return false;
  const verb = need === 'write' ? 'write' : 'read';
  if (!can(role, 'controlled_documents', verb)) return false;
  const c = normalizeClassification(classification);
  if (c === 'critique') {
    return role === 'ADMIN' || role === 'QHSE';
  }
  if (c === 'sensible') {
    return ['ADMIN', 'QHSE', 'DIRECTION', 'ASSISTANT', 'TERRAIN'].includes(role);
  }
  return true;
}

/**
 * @param {Record<string, string | undefined>} query
 */
export function parseListFilters(query) {
  const siteId = typeof query.siteId === 'string' && query.siteId.trim() ? query.siteId.trim() : undefined;
  const auditId = typeof query.auditId === 'string' && query.auditId.trim() ? query.auditId.trim() : undefined;
  const classification = query.classification ? normalizeClassification(query.classification) : undefined;
  const type = typeof query.type === 'string' && query.type.trim() ? query.type.trim() : undefined;
  return { siteId, auditId, classification, type };
}

/**
 * @param {import('@prisma/client').ControlledDocument} doc
 */
export function toPublicControlledDocument(doc) {
  if (!doc) return null;
  const { path: _path, ...rest } = doc;
  const comp = computeDocumentComplianceStatus(doc.expiresAt);
  return {
    ...rest,
    /** Indique qu’un fichier binaire est stocké (le chemin serveur n’est jamais exposé). */
    hasStoredFile: Boolean(_path),
    complianceStatus: comp.key,
    complianceLabel: comp.label,
    daysUntilExpiry: comp.daysUntil,
    renewWithinDays: RENEW_DAYS
  };
}

/**
 * @param {{ siteId?: string, auditId?: string, classification?: string, type?: string }} filters
 */
export async function listControlledDocuments(filters) {
  const where = {};
  if (filters.siteId) where.siteId = filters.siteId;
  if (filters.auditId) where.auditId = filters.auditId;
  if (filters.classification) where.classification = filters.classification;
  if (filters.type) where.type = { contains: filters.type };
  const rows = await prisma.controlledDocument.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 500
  });
  return rows.map(toPublicControlledDocument);
}

/**
 * @param {string} id
 */
export async function getControlledDocumentById(id) {
  const doc = await prisma.controlledDocument.findUnique({ where: { id } });
  return doc;
}

/**
 * @param {Buffer} buffer
 * @param {{
 *   name: string,
 *   type: string,
 *   classification?: string,
 *   siteId?: string | null,
 *   createdByUserId?: string | null,
 *   mimeType?: string | null,
 *   auditId?: string | null,
 *   fdsProductRef?: string | null,
 *   isoRequirementRef?: string | null,
 *   riskRef?: string | null,
 *   complianceTag?: string | null,
 *   expiresAt?: Date | string | null,
 *   responsible?: string | null
 * }} meta
 */
export async function createControlledDocument(buffer, meta) {
  const { relativePath, sizeBytes } = await saveControlledFile(buffer, {
    originalName: meta.name || 'document'
  });
  const classification = normalizeClassification(meta.classification);
  let expiresAt = null;
  if (meta.expiresAt != null && String(meta.expiresAt).trim() !== '') {
    const d = meta.expiresAt instanceof Date ? meta.expiresAt : new Date(String(meta.expiresAt));
    expiresAt = Number.isNaN(d.getTime()) ? null : d;
  }
  const responsible =
    meta.responsible != null && String(meta.responsible).trim()
      ? String(meta.responsible).trim().slice(0, 200)
      : null;

  const row = await prisma.controlledDocument.create({
    data: {
      name: String(meta.name || 'Sans titre').slice(0, 500),
      type: String(meta.type || 'other').slice(0, 120),
      path: relativePath,
      classification,
      siteId: meta.siteId || null,
      createdByUserId: meta.createdByUserId || null,
      mimeType: meta.mimeType || null,
      sizeBytes,
      auditId: meta.auditId || null,
      fdsProductRef: meta.fdsProductRef ? String(meta.fdsProductRef).slice(0, 200) : null,
      isoRequirementRef: meta.isoRequirementRef ? String(meta.isoRequirementRef).slice(0, 200) : null,
      riskRef: meta.riskRef ? String(meta.riskRef).slice(0, 200) : null,
      complianceTag: meta.complianceTag ? String(meta.complianceTag).slice(0, 200) : null,
      expiresAt,
      responsible
    }
  });
  return row;
}

/**
 * @param {string} id
 * @param {{
 *   expiresAt?: Date | string | null,
 *   responsible?: string | null,
 *   name?: string | null,
 *   type?: string | null
 * }} patch
 */
export async function updateControlledDocumentMeta(id, patch) {
  const data = {};
  if ('expiresAt' in patch) {
    if (patch.expiresAt == null || String(patch.expiresAt).trim() === '') {
      data.expiresAt = null;
    } else {
      const d =
        patch.expiresAt instanceof Date ? patch.expiresAt : new Date(String(patch.expiresAt));
      data.expiresAt = Number.isNaN(d.getTime()) ? null : d;
    }
  }
  if ('responsible' in patch) {
    data.responsible =
      patch.responsible == null || String(patch.responsible).trim() === ''
        ? null
        : String(patch.responsible).trim().slice(0, 200);
  }
  if (patch.name != null && String(patch.name).trim()) {
    data.name = String(patch.name).trim().slice(0, 500);
  }
  if (patch.type != null && String(patch.type).trim()) {
    data.type = String(patch.type).trim().slice(0, 120);
  }
  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }
  return prisma.controlledDocument.update({
    where: { id },
    data
  });
}

/**
 * Suppression fichier + ligne (erreurs fichier ignorées).
 * @param {string} id
 */
export async function deleteControlledDocumentRecord(id) {
  const doc = await prisma.controlledDocument.findUnique({ where: { id } });
  if (!doc) return false;
  await deleteControlledFile(doc.path);
  await prisma.controlledDocument.delete({ where: { id } });
  return true;
}

/**
 * @param {string} id
 */
export async function readDocumentBufferForId(id) {
  const doc = await prisma.controlledDocument.findUnique({ where: { id } });
  if (!doc) {
    const err = new Error('Document introuvable');
    err.statusCode = 404;
    throw err;
  }
  const buf = await readControlledFileBuffer(doc.path);
  return { doc, buffer: buf };
}

/**
 * @param {Buffer} input
 * @param {import('@prisma/client').ControlledDocument} doc
 * @param {{ userLabel: string }} ctx
 */
export async function buildWatermarkedExportBuffer(input, doc, ctx) {
  const label = `${ctx.userLabel} — ${new Date().toISOString()}`;
  const mime = (doc.mimeType || '').toLowerCase();
  const isPdf = mime.includes('pdf') || /\.pdf$/i.test(doc.name);
  if (isPdf) {
    const out = await addWatermarkToPdf(input, { label });
    return { buffer: out, mimeType: 'application/pdf', fileName: watermarkedFileName(doc.name) };
  }
  return {
    buffer: input,
    mimeType: doc.mimeType || 'application/octet-stream',
    fileName: doc.name,
    watermarkHeader: label
  };
}

/**
 * @param {string} name
 */
function watermarkedFileName(name) {
  const base = String(name || 'export');
  if (/\.pdf$/i.test(base)) return base.replace(/\.pdf$/i, '-watermarked.pdf');
  return `${base}-watermarked.pdf`;
}
