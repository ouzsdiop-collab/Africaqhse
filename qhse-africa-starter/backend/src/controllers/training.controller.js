import * as trainingService from '../services/training.service.js';

function handleServiceError(err, res, next) {
  if (err.statusCode === 400) return res.status(400).json({ error: err.message });
  if (err.statusCode === 404) return res.status(404).json({ error: err.message });
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'Conflit : cet utilisateur est déjà inscrit à cette session.' });
  }
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Ressource de formation introuvable' });
  }
  next(err);
}

export async function getCourses(req, res, next) {
  try {
    res.json(await trainingService.findAllCourses(req.qhseTenantId));
  } catch (err) {
    next(err);
  }
}

export async function createCourse(req, res, next) {
  try {
    const row = await trainingService.createCourse(req.qhseTenantId, req.body ?? {});
    res.status(201).json(row);
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function updateCourse(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    res.json(await trainingService.updateCourse(req.qhseTenantId, id, req.body ?? {}));
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function deleteCourse(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    await trainingService.deleteCourse(req.qhseTenantId, id);
    res.status(204).send();
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function getSessions(req, res, next) {
  try {
    res.json(await trainingService.findAllSessions(req.qhseTenantId));
  } catch (err) {
    next(err);
  }
}

export async function createSession(req, res, next) {
  try {
    const row = await trainingService.createSession(req.qhseTenantId, req.body ?? {});
    res.status(201).json(row);
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function updateSession(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    res.json(await trainingService.updateSession(req.qhseTenantId, id, req.body ?? {}));
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function deleteSession(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    await trainingService.deleteSession(req.qhseTenantId, id);
    res.status(204).send();
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function getEnrollments(req, res, next) {
  try {
    const sessionId = typeof req.query.sessionId === 'string' ? req.query.sessionId : null;
    res.json(await trainingService.findAllEnrollments(req.qhseTenantId, sessionId));
  } catch (err) {
    next(err);
  }
}

export async function createEnrollment(req, res, next) {
  try {
    const row = await trainingService.createEnrollment(req.qhseTenantId, req.body ?? {});
    res.status(201).json(row);
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function updateEnrollment(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    res.json(await trainingService.updateEnrollment(req.qhseTenantId, id, req.body ?? {}));
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function deleteEnrollment(req, res, next) {
  try {
    const id = typeof req.params.id === 'string' ? req.params.id.trim() : '';
    await trainingService.deleteEnrollment(req.qhseTenantId, id);
    res.status(204).send();
  } catch (err) {
    handleServiceError(err, res, next);
  }
}

export async function getAlerts(req, res, next) {
  try {
    const days = Number(req.query?.daysAhead ?? req.query?.days ?? 30);
    const limit = Number(req.query?.limit ?? 50);
    const alerts = await trainingService.getTrainingAlerts(req.qhseTenantId, {
      daysAhead: Number.isFinite(days) ? days : 30,
      limit: Number.isFinite(limit) ? limit : 50
    });
    res.json({ alerts });
  } catch (err) {
    next(err);
  }
}
