import { Router } from 'express';
import * as controller from '../controllers/training.controller.js';
import { requirePermission } from '../middleware/requirePermission.middleware.js';
import { validateBody } from '../lib/validation.js';
import {
  createCourseSchema,
  updateCourseSchema,
  createSessionSchema,
  updateSessionSchema,
  createEnrollmentSchema,
  updateEnrollmentSchema
} from '../validation/trainingSchemas.js';

const router = Router();

router.get('/alerts', requirePermission('trainings', 'read'), controller.getAlerts);

router.get('/courses', requirePermission('trainings', 'read'), controller.getCourses);
router.post(
  '/courses',
  requirePermission('trainings', 'write'),
  validateBody(createCourseSchema),
  controller.createCourse
);
router.put(
  '/courses/:id',
  requirePermission('trainings', 'write'),
  validateBody(updateCourseSchema),
  controller.updateCourse
);
router.delete('/courses/:id', requirePermission('trainings', 'write'), controller.deleteCourse);

router.get('/sessions', requirePermission('trainings', 'read'), controller.getSessions);
router.post(
  '/sessions',
  requirePermission('trainings', 'write'),
  validateBody(createSessionSchema),
  controller.createSession
);
router.put(
  '/sessions/:id',
  requirePermission('trainings', 'write'),
  validateBody(updateSessionSchema),
  controller.updateSession
);
router.delete('/sessions/:id', requirePermission('trainings', 'write'), controller.deleteSession);

router.get('/enrollments', requirePermission('trainings', 'read'), controller.getEnrollments);
router.post(
  '/enrollments',
  requirePermission('trainings', 'write'),
  validateBody(createEnrollmentSchema),
  controller.createEnrollment
);
router.put(
  '/enrollments/:id',
  requirePermission('trainings', 'write'),
  validateBody(updateEnrollmentSchema),
  controller.updateEnrollment
);
router.delete('/enrollments/:id', requirePermission('trainings', 'write'), controller.deleteEnrollment);

export default router;
