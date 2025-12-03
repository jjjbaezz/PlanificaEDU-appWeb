import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';
import {
  listByGroup,
  addStudentToGroup,
  removeEnrollment,
  listAvailableGroupsForStudent,
  listMyEnrollments,
  selfEnroll,
  cancelSelfEnrollment,
} from '../controllers/enrollment.controller.js';

const router = Router();

router.get('/admin/groups/:groupId/enrollments', requireAuth, requireRole('ADMIN'), listByGroup);
router.post('/admin/groups/:groupId/enrollments', requireAuth, requireRole('ADMIN'), addStudentToGroup);
router.delete('/admin/groups/:groupId/enrollments/:enrollmentId', requireAuth, requireRole('ADMIN'), removeEnrollment);

router.get('/me/enrollments/options', requireAuth, requireRole('ESTUDIANTE'), listAvailableGroupsForStudent);
router.get('/me/enrollments', requireAuth, requireRole('ESTUDIANTE'), listMyEnrollments);
router.post('/me/enrollments', requireAuth, requireRole('ESTUDIANTE'), selfEnroll);
router.delete('/me/enrollments/:enrollmentId', requireAuth, requireRole('ESTUDIANTE'), cancelSelfEnrollment);

export default router;
