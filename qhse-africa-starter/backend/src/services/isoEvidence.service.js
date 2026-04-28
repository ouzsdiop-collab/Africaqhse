import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';
import { saveControlledFile } from './documentStorage.service.js';

const TYPES = new Set(['photo', 'document', 'audit', 'autre']);

/**
 * @param {string | null | undefined} tenantId
 * @param {{ requirementId?: string }} [query]
 */
export async function listIsoEvidence(tenantId, query = {}) {
  const tid = normalizeTenantId(tenantId);
  if (!tid) return [];
  const rid = query.requirementId != null ? String(query.requirementId).trim() : '';
  const where = { ...prismaTenantFilter(tid), ...(rid ? { requirementId: rid } : {}) };
  return prisma.isoEvidence.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 500,
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      validatedBy: { select: { id: true, name: true, email: true } }
    }
  });
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} userId
 * @param {{
 *   requirementId: string,
 *   type: string,
 *   fileUrl?: string | null,
 *   content?: string | null,
 *   meta?: Record<string, unknown>
 * }} data
 * @param {Buffer | null} [fileBuffer]
 * @param {{ originalName?: string, mimeType?: string | null }} [fileMeta]
 */
export async function createIsoEvidence(tenantId, userId, data, fileBuffer = null, fileMeta = {}) {
  const tid = normalizeTenantId(tenantId);
  const uid = String(userId || '').trim();
  if (!tid || !uid) {
    const err = new Error('Contexte requis');
    err.statusCode = 403;
    throw err;
  }
  const type = String(data.type || '').toLowerCase();
  if (!TYPES.has(type)) {
    const err = new Error('Type de preuve invalide');
    err.statusCode = 400;
    throw err;
  }

  let fileUrl = data.fileUrl != null && String(data.fileUrl).trim() ? String(data.fileUrl).trim() : null;
  if (fileBuffer && fileBuffer.length > 0) {
    const saved = await saveControlledFile(fileBuffer, {
      originalName: fileMeta.originalName || 'iso-evidence.bin',
      contentType: fileMeta.mimeType || null
    });
    fileUrl = saved.relativePath;
  }

  const content =
    data.content != null && String(data.content).trim() ? String(data.content).trim() : null;
  if (!fileUrl && !content) {
    const err = new Error('Fichier ou contenu requis');
    err.statusCode = 400;
    throw err;
  }

  const meta =
    data.meta && typeof data.meta === 'object' && !Array.isArray(data.meta) ? data.meta : {};

  return prisma.isoEvidence.create({
    data: {
      tenantId: tid,
      requirementId: String(data.requirementId).trim().slice(0, 200),
      type,
      fileUrl,
      content,
      status: 'pending',
      meta,
      createdById: uid
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      validatedBy: { select: { id: true, name: true, email: true } }
    }
  });
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} evidenceId
 * @param {string} validatorUserId
 * @param {'validated' | 'rejected'} status
 */
export async function validateIsoEvidence(tenantId, evidenceId, validatorUserId, status) {
  const tid = normalizeTenantId(tenantId);
  const eid = String(evidenceId || '').trim();
  const vid = String(validatorUserId || '').trim();
  if (!tid || !eid || !vid) {
    const err = new Error('Requête invalide');
    err.statusCode = 400;
    throw err;
  }

  const existing = await prisma.isoEvidence.findFirst({
    where: { id: eid, ...prismaTenantFilter(tid) },
    select: { id: true }
  });
  if (!existing) {
    const err = new Error('Preuve introuvable');
    err.statusCode = 404;
    throw err;
  }

  return prisma.isoEvidence.update({
    where: { id: eid },
    data: {
      status,
      validatedById: vid,
      validatedAt: new Date()
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      validatedBy: { select: { id: true, name: true, email: true } }
    }
  });
}
