import { prisma } from '../db.js';
import { assertSiteExistsOrNull } from './sites.service.js';
import { normalizeTenantId, prismaTenantFilter } from '../lib/tenantScope.js';

function serializeCourse(row) {
  if (!row) return row;
  return {
    ...row,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function serializeSession(row) {
  if (!row) return row;
  return {
    ...row,
    date: row.date.toISOString(),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

function serializeEnrollment(row) {
  if (!row) return row;
  return {
    ...row,
    completedAt: row.completedAt ? row.completedAt.toISOString() : null,
    expiresAt: row.expiresAt ? row.expiresAt.toISOString() : null,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString()
  };
}

const sessionInclude = {
  course: { select: { id: true, title: true, category: true, mandatory: true, recurrenceMonths: true } },
  siteRecord: { select: { id: true, name: true, code: true } }
};

const enrollmentInclude = {
  user: { select: { id: true, name: true, email: true, role: true } },
  session: { include: sessionInclude }
};

/* --- Cours --- */

export async function findAllCourses(tenantId) {
  const tf = prismaTenantFilter(tenantId);
  const rows = await prisma.trainingCourse.findMany({
    where: tf,
    orderBy: [{ title: 'asc' }]
  });
  return rows.map(serializeCourse);
}

export async function createCourse(tenantId, data) {
  const tid = normalizeTenantId(tenantId);
  const title = typeof data.title === 'string' ? data.title.trim() : '';
  if (!title) {
    const err = new Error('title requis');
    err.statusCode = 400;
    throw err;
  }
  const created = await prisma.trainingCourse.create({
    data: {
      tenantId: tid,
      title,
      category: data.category != null && data.category !== '' ? String(data.category).trim() : null,
      durationHours: data.durationHours != null ? Number(data.durationHours) : null,
      mandatory: Boolean(data.mandatory),
      recurrenceMonths: data.recurrenceMonths != null ? Number(data.recurrenceMonths) : null
    }
  });
  return serializeCourse(created);
}

export async function updateCourse(tenantId, id, patch) {
  const cid = String(id ?? '').trim();
  if (!cid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.trainingCourse.findFirst({ where: { id: cid, ...tf } });
  if (!existing) {
    const err = new Error('Formation introuvable');
    err.statusCode = 404;
    throw err;
  }
  /** @type {Record<string, unknown>} */
  const data = {};
  if ('title' in patch) {
    const t = typeof patch.title === 'string' ? patch.title.trim() : '';
    if (!t) {
      const err = new Error('title ne peut pas être vide');
      err.statusCode = 400;
      throw err;
    }
    data.title = t;
  }
  if ('category' in patch) {
    data.category = patch.category == null || patch.category === '' ? null : String(patch.category).trim();
  }
  if ('durationHours' in patch) {
    data.durationHours = patch.durationHours == null ? null : Number(patch.durationHours);
  }
  if ('mandatory' in patch) {
    data.mandatory = Boolean(patch.mandatory);
  }
  if ('recurrenceMonths' in patch) {
    data.recurrenceMonths = patch.recurrenceMonths == null ? null : Number(patch.recurrenceMonths);
  }
  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }
  const upd = await prisma.trainingCourse.updateMany({ where: { id: cid, ...tf }, data });
  if (!upd?.count) {
    const err = new Error('Formation introuvable');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.trainingCourse.findFirst({ where: { id: cid, ...tf } });
  return serializeCourse(updated);
}

export async function deleteCourse(tenantId, id) {
  const cid = String(id ?? '').trim();
  if (!cid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const del = await prisma.trainingCourse.deleteMany({ where: { id: cid, ...tf } });
  if (!del?.count) {
    const err = new Error('Formation introuvable');
    err.statusCode = 404;
    throw err;
  }
}

/* --- Sessions --- */

export async function findAllSessions(tenantId) {
  const tf = prismaTenantFilter(tenantId);
  const rows = await prisma.trainingSession.findMany({
    where: tf,
    include: sessionInclude,
    orderBy: [{ date: 'desc' }]
  });
  return rows.map(serializeSession);
}

export async function createSession(tenantId, data) {
  const tid = normalizeTenantId(tenantId);
  const courseId = typeof data.courseId === 'string' ? data.courseId.trim() : '';
  if (!courseId) {
    const err = new Error('courseId requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const courseOk = await prisma.trainingCourse.findFirst({ where: { id: courseId, ...tf } });
  if (!courseOk) {
    const err = new Error('Formation introuvable');
    err.statusCode = 400;
    throw err;
  }
  const date = data.date != null && data.date !== '' ? new Date(String(data.date)) : null;
  if (!date || Number.isNaN(date.getTime())) {
    const err = new Error('date invalide');
    err.statusCode = 400;
    throw err;
  }
  const siteId =
    data.siteId != null && data.siteId !== '' ? await assertSiteExistsOrNull(tenantId, data.siteId) : null;
  const created = await prisma.trainingSession.create({
    data: {
      tenantId: tid,
      courseId,
      siteId,
      date,
      location: data.location != null && data.location !== '' ? String(data.location).trim() : null,
      trainer: data.trainer != null && data.trainer !== '' ? String(data.trainer).trim() : null
    },
    include: sessionInclude
  });
  return serializeSession(created);
}

export async function updateSession(tenantId, id, patch) {
  const sid = String(id ?? '').trim();
  if (!sid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.trainingSession.findFirst({ where: { id: sid, ...tf } });
  if (!existing) {
    const err = new Error('Session introuvable');
    err.statusCode = 404;
    throw err;
  }
  /** @type {Record<string, unknown>} */
  const data = {};
  if ('date' in patch) {
    const d = new Date(String(patch.date));
    if (Number.isNaN(d.getTime())) {
      const err = new Error('date invalide');
      err.statusCode = 400;
      throw err;
    }
    data.date = d;
  }
  if ('siteId' in patch) {
    data.siteId =
      patch.siteId == null || patch.siteId === '' ? null : await assertSiteExistsOrNull(tenantId, patch.siteId);
  }
  if ('location' in patch) {
    data.location = patch.location == null || patch.location === '' ? null : String(patch.location).trim();
  }
  if ('trainer' in patch) {
    data.trainer = patch.trainer == null || patch.trainer === '' ? null : String(patch.trainer).trim();
  }
  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }
  const upd = await prisma.trainingSession.updateMany({ where: { id: sid, ...tf }, data });
  if (!upd?.count) {
    const err = new Error('Session introuvable');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.trainingSession.findFirst({ where: { id: sid, ...tf }, include: sessionInclude });
  return serializeSession(updated);
}

export async function deleteSession(tenantId, id) {
  const sid = String(id ?? '').trim();
  if (!sid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const del = await prisma.trainingSession.deleteMany({ where: { id: sid, ...tf } });
  if (!del?.count) {
    const err = new Error('Session introuvable');
    err.statusCode = 404;
    throw err;
  }
}

/* --- Inscriptions / présences --- */

export async function findAllEnrollments(tenantId, sessionId = null) {
  const tf = prismaTenantFilter(tenantId);
  /** @type {Record<string, unknown>} */
  const where = { ...tf };
  const sid = sessionId != null && String(sessionId).trim() !== '' ? String(sessionId).trim() : null;
  if (sid) where.sessionId = sid;
  const rows = await prisma.trainingEnrollment.findMany({
    where,
    include: enrollmentInclude,
    orderBy: [{ createdAt: 'desc' }]
  });
  return rows.map(serializeEnrollment);
}

export async function createEnrollment(tenantId, data) {
  const tid = normalizeTenantId(tenantId);
  const sessionId = typeof data.sessionId === 'string' ? data.sessionId.trim() : '';
  const userId = typeof data.userId === 'string' ? data.userId.trim() : '';
  if (!sessionId || !userId) {
    const err = new Error('sessionId et userId requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const sessionOk = await prisma.trainingSession.findFirst({ where: { id: sessionId, ...tf } });
  if (!sessionOk) {
    const err = new Error('Session introuvable');
    err.statusCode = 400;
    throw err;
  }
  const userOk = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!userOk) {
    const err = new Error('Utilisateur introuvable');
    err.statusCode = 400;
    throw err;
  }
  const created = await prisma.trainingEnrollment.create({
    data: { tenantId: tid, sessionId, userId },
    include: enrollmentInclude
  });
  return serializeEnrollment(created);
}

/** Marque la présence/résultat ; calcule expiresAt à partir de la périodicité du cours si complété. */
export async function updateEnrollment(tenantId, id, patch) {
  const eid = String(id ?? '').trim();
  if (!eid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const existing = await prisma.trainingEnrollment.findFirst({
    where: { id: eid, ...tf },
    include: enrollmentInclude
  });
  if (!existing) {
    const err = new Error('Inscription introuvable');
    err.statusCode = 404;
    throw err;
  }

  /** @type {Record<string, unknown>} */
  const data = {};
  if ('attended' in patch) data.attended = Boolean(patch.attended);
  if ('score' in patch) data.score = patch.score == null ? null : Number(patch.score);
  if ('certificateUrl' in patch) {
    data.certificateUrl =
      patch.certificateUrl == null || patch.certificateUrl === '' ? null : String(patch.certificateUrl).trim();
  }
  if ('completedAt' in patch) {
    if (patch.completedAt == null || patch.completedAt === '') {
      data.completedAt = null;
      data.expiresAt = null;
    } else {
      const d = new Date(String(patch.completedAt));
      if (Number.isNaN(d.getTime())) {
        const err = new Error('completedAt invalide');
        err.statusCode = 400;
        throw err;
      }
      data.completedAt = d;
      const months = existing.session?.course?.recurrenceMonths;
      data.expiresAt = months ? new Date(d.getFullYear(), d.getMonth() + months, d.getDate()) : null;
    }
  }
  if (Object.keys(data).length === 0) {
    const err = new Error('Aucun champ à mettre à jour');
    err.statusCode = 400;
    throw err;
  }
  const upd = await prisma.trainingEnrollment.updateMany({ where: { id: eid, ...tf }, data });
  if (!upd?.count) {
    const err = new Error('Inscription introuvable');
    err.statusCode = 404;
    throw err;
  }
  const updated = await prisma.trainingEnrollment.findFirst({ where: { id: eid, ...tf }, include: enrollmentInclude });
  return serializeEnrollment(updated);
}

export async function deleteEnrollment(tenantId, id) {
  const eid = String(id ?? '').trim();
  if (!eid) {
    const err = new Error('Identifiant requis');
    err.statusCode = 400;
    throw err;
  }
  const tf = prismaTenantFilter(tenantId);
  const del = await prisma.trainingEnrollment.deleteMany({ where: { id: eid, ...tf } });
  if (!del?.count) {
    const err = new Error('Inscription introuvable');
    err.statusCode = 404;
    throw err;
  }
}

/** Alertes formations (expirées + bientôt expirées), même format que les alertes habilitations. */
export async function getTrainingAlerts(tenantId, opts = {}) {
  const d = Math.max(1, Math.min(365, Math.floor(Number(opts.daysAhead) || 30)));
  const limit = Math.max(1, Math.min(200, Math.floor(Number(opts.limit) || 50)));
  const now = new Date();
  const end = new Date(now.getTime() + d * 24 * 60 * 60 * 1000);
  const tf = prismaTenantFilter(tenantId);

  const [expired, expiring] = await Promise.all([
    prisma.trainingEnrollment.findMany({
      where: { ...tf, expiresAt: { not: null, lt: now } },
      include: enrollmentInclude,
      orderBy: { expiresAt: 'desc' },
      take: limit
    }),
    prisma.trainingEnrollment.findMany({
      where: { ...tf, expiresAt: { not: null, gte: now, lte: end } },
      include: enrollmentInclude,
      orderBy: { expiresAt: 'asc' },
      take: limit
    })
  ]);

  const alerts = [];
  for (const e of expired) {
    const who = e.user?.name || e.user?.email || 'Utilisateur';
    const course = e.session?.course?.title || 'formation';
    alerts.push({
      type: 'training.expired',
      severity: 'high',
      message: `Formation à recycler : ${who} - ${course}`,
      date: e.expiresAt ? e.expiresAt.toISOString() : null
    });
  }
  for (const e of expiring) {
    const who = e.user?.name || e.user?.email || 'Utilisateur';
    const course = e.session?.course?.title || 'formation';
    alerts.push({
      type: 'training.expiring',
      severity: 'medium',
      message: `Recyclage formation à prévoir : ${who} - ${course}`,
      date: e.expiresAt ? e.expiresAt.toISOString() : null
    });
  }
  return alerts.slice(0, limit);
}
