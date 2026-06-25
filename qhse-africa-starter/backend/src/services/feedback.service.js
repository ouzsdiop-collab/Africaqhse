import { prisma } from '../db.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';
import { clampTrimString, FIELD_LIMITS, parseListLimit } from '../lib/validation.js';

const ALLOWED_TYPES = new Set(['bug', 'suggestion', 'other']);
const ALLOWED_STATUS = new Set(['new', 'seen', 'resolved']);

function serialize(row) {
  if (!row) return row;
  return { ...row, createdAt: row.createdAt.toISOString() };
}

export async function createFeedback(tenantId, userId, body) {
  const message = clampTrimString(body?.message, FIELD_LIMITS.feedbackMessage);
  if (!message) {
    const err = new Error('Champ message requis');
    err.statusCode = 400;
    throw err;
  }
  const type = ALLOWED_TYPES.has(body?.type) ? body.type : 'suggestion';
  const page =
    body?.page == null || body.page === ''
      ? null
      : clampTrimString(body.page, FIELD_LIMITS.feedbackPage) || null;

  const row = await prisma.feedback.create({
    data: {
      tenantId: normalizeTenantId(tenantId),
      userId: userId || null,
      type,
      page,
      message
    }
  });
  return serialize(row);
}

export async function findAllFeedback(tenantId, { status, limit } = {}) {
  const tf = prismaTenantFilter(tenantId);
  const where = { ...tf };
  if (status && ALLOWED_STATUS.has(status)) where.status = status;
  const rows = await prisma.feedback.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: parseListLimit(limit),
    include: { user: { select: { id: true, name: true, email: true } } }
  });
  return rows.map(serialize);
}

export async function updateFeedbackStatus(tenantId, id, status) {
  if (!ALLOWED_STATUS.has(status)) {
    const err = new Error('status invalide');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.feedback.findFirst({ where: { ...tf, id } });
  if (!existing) {
    const err = new Error('Feedback introuvable');
    err.statusCode = 404;
    throw err;
  }
  const row = await prisma.feedback.update({ where: { id: existing.id }, data: { status } });
  return serialize(row);
}
