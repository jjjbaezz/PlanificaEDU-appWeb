import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  listSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  listPrerequisites,
  addPrerequisite,
  removePrerequisite,
  listSubjectGroups,
  validateSubjectCode
} from '../controllers/subjects.controller.js';

const router = Router();

// GET /subjects
router.get('/', requireAuth, listSubjects);

// GET /subjects/validate?codigo=ABC123
router.get('/validate', requireAuth, validateSubjectCode);

// GET /subjects/:id
router.get('/:id', requireAuth, getSubjectById);

// POST /subjects
router.post('/', requireAuth, createSubject);

// PUT /subjects/:id
router.put('/:id', requireAuth, updateSubject);

// DELETE /subjects/:id
router.delete('/:id', requireAuth, deleteSubject);

// GET /subjects/:id/prerequisites
router.get('/:id/prerequisites', requireAuth, listPrerequisites);

// POST /subjects/:id/prerequisites
router.post('/:id/prerequisites', requireAuth, addPrerequisite);

// DELETE /subjects/:id/prerequisites/:reqId
router.delete('/:id/prerequisites/:reqId', requireAuth, removePrerequisite);

// GET /subjects/:id/groups?periodo_id=...
router.get('/:id/groups', requireAuth, listSubjectGroups);

export default router;