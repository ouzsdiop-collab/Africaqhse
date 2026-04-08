import { prisma } from '../db.js';
import { prismaTenantFilter } from '../lib/tenantScope.js';

/** @typedef {'analysis_only' | 'validated' | 'failed' | 'analysis_failed'} ImportHistoryStatus */

const LIST_LIMIT = 150;

/**
 * @param {{
 *   fileName: string,
 *   fileType: string,
 *   detectedDocumentType?: string | null,
 *   suggestedModule?: string | null,
 *   suggestedModuleLabel?: string | null,
 *   confidence?: number | null,
 *   missingFields?: unknown,
 *   detectedHints?: unknown,
 *   userId?: string | null,
 *   userName?: string | null
 * }} data
 */
export async function createAnalysisSuccessRecord(data) {
  const tenantId =
    data.tenantId != null && String(data.tenantId).trim() !== ''
      ? String(data.tenantId).trim()
      : null;
  return prisma.importHistory.create({
    data: {
      tenantId,
      fileName: data.fileName,
      fileType: data.fileType,
      detectedDocumentType: data.detectedDocumentType ?? null,
      suggestedModule: data.suggestedModule ?? null,
      suggestedModuleLabel: data.suggestedModuleLabel ?? null,
      moduleCreated: null,
      status: 'analysis_only',
      warnings: null,
      missingFields:
        data.missingFields !== undefined && data.missingFields !== null
          ? data.missingFields
          : undefined,
      detectedHints:
        data.detectedHints !== undefined && data.detectedHints !== null
          ? data.detectedHints
          : undefined,
      confidence:
        typeof data.confidence === 'number' ? data.confidence : null,
      userId: data.userId ?? null,
      userName: data.userName ?? null,
      errorMessage: null
    }
  });
}

/**
 * @param {{
 *   fileName: string,
 *   fileType: string,
 *   errorMessage: string,
 *   userId?: string | null,
 *   userName?: string | null
 * }} data
 */
export async function createAnalysisFailedRecord(data) {
  const tenantId =
    data.tenantId != null && String(data.tenantId).trim() !== ''
      ? String(data.tenantId).trim()
      : null;
  return prisma.importHistory.create({
    data: {
      tenantId,
      fileName: data.fileName,
      fileType: data.fileType,
      detectedDocumentType: null,
      suggestedModule: null,
      suggestedModuleLabel: null,
      moduleCreated: null,
      status: 'analysis_failed',
      warnings: null,
      missingFields: null,
      detectedHints: null,
      confidence: null,
      userId: data.userId ?? null,
      userName: data.userName ?? null,
      errorMessage: String(data.errorMessage ?? '').slice(0, 2000)
    }
  });
}

/**
 * @param {string | null | undefined} historyId
 * @param {{
 *   success: boolean,
 *   moduleCreated?: string,
 *   createdEntityId?: string,
 *   createdEntityRef?: string,
 *   warnings?: string[]
 * }} confirmResult
 * @param {string} targetModuleAttempted
 */
export async function applyConfirmResult(
  tenantId,
  historyId,
  confirmResult,
  targetModuleAttempted
) {
  const id = String(historyId ?? '').trim();
  if (!id) return null;
  const tf = prismaTenantFilter(tenantId);
  const belongs = await prisma.importHistory.findFirst({
    where: { id, ...tf },
    select: { id: true }
  });
  if (!belongs) return null;
  try {
    if (confirmResult.success) {
      return await prisma.importHistory.update({
        where: { id },
        data: {
          status: 'validated',
          moduleCreated: confirmResult.moduleCreated ?? null,
          createdEntityId: confirmResult.createdEntityId ?? null,
          createdEntityRef: confirmResult.createdEntityRef ?? null,
          warnings: Array.isArray(confirmResult.warnings)
            ? confirmResult.warnings
            : []
        }
      });
    }
    const mod =
      confirmResult.moduleCreated != null &&
      String(confirmResult.moduleCreated).trim() !== ''
        ? String(confirmResult.moduleCreated).trim()
        : String(targetModuleAttempted || '').trim() || null;
    return await prisma.importHistory.update({
      where: { id },
      data: {
        status: 'failed',
        moduleCreated: mod,
        warnings: Array.isArray(confirmResult.warnings)
          ? confirmResult.warnings
          : []
      }
    });
  } catch (err) {
    if (err && err.code === 'P2025') return null;
    throw err;
  }
}

/**
 * @param {string | null | undefined} tenantId
 */
export async function findAllImportHistory(tenantId) {
  const tf = prismaTenantFilter(tenantId);
  return prisma.importHistory.findMany({
    where: Object.keys(tf).length ? tf : {},
    orderBy: { createdAt: 'desc' },
    take: LIST_LIMIT
  });
}

/**
 * @param {string | null | undefined} tenantId
 * @param {string} id
 */
export async function findImportHistoryById(tenantId, id) {
  const trimmed = String(id ?? '').trim();
  if (!trimmed) return null;
  const tf = prismaTenantFilter(tenantId);
  return prisma.importHistory.findFirst({
    where: { id: trimmed, ...tf }
  });
}
