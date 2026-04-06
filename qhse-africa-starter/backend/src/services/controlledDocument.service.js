/**
 * Documents contrôlés — validation classification × rôle, sans exposition du chemin disque.
 */

import { prisma } from '../db.js';
import { can } from '../lib/permissions.js';
import { readControlledFileBuffer, saveControlledFile, deleteControlledFile } from './documentStorage.service.js';
import { addWatermarkToPdf } from './documentWatermark.service.js';

const CLASSIFICATIONS = new Set(['normal', 'sensible', 'critique']);

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
  return {
    ...rest,
    /** Indique qu’un fichier binaire est stocké (le chemin serveur n’est jamais exposé). */
    hasStoredFile: Boolean(_path)
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
 *   complianceTag?: string | null
 * }} meta
 */
export async function createControlledDocument(buffer, meta) {
  const { relativePath, sizeBytes } = await saveControlledFile(buffer, {
    originalName: meta.name || 'document'
  });
  const classification = normalizeClassification(meta.classification);
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
      complianceTag: meta.complianceTag ? String(meta.complianceTag).slice(0, 200) : null
    }
  });
  return row;
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
