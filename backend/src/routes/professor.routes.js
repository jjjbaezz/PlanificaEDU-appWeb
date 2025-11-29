import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { 
  getAvailability, 
  updateAvailability, 
  bulkUpdateAvailability,
  getProfile,
  updateProfile,
  getSchedule,
  getAllProfessors,
  getProfessorById,
  createProfessor,
  updateProfessor,
  deleteProfessor
} from '../controllers/professor.controller.js';

const router = Router();

// CRUD básico de profesores
// GET /professors
router.get('/', requireAuth, getAllProfessors);

// GET /professors/:id
router.get('/:id', requireAuth, getProfessorById);

// POST /professors
router.post('/', requireAuth, createProfessor);

// PUT /professors/:id
router.put('/:id', requireAuth, updateProfessor);

// DELETE /professors/:id
router.delete('/:id', requireAuth, deleteProfessor);

// GET /professors/:id/availability - Obtener disponibilidad del profesor
router.get('/:id/availability', requireAuth, getAvailability);

// PUT /professors/:id/availability - Actualizar disponibilidad específica
router.put('/:id/availability', requireAuth, updateAvailability);

// POST /professors/:id/availability/bulk - Actualización masiva de disponibilidad
router.post('/:id/availability/bulk', requireAuth, bulkUpdateAvailability);

// GET /professors/:id/profile - Obtener perfil del profesor
router.get('/:id/profile', requireAuth, getProfile);

// PUT /professors/:id/profile - Actualizar perfil del profesor
router.put('/:id/profile', requireAuth, updateProfile);

// GET /professors/:id/schedule - Obtener horario actual del profesor
router.get('/:id/schedule', requireAuth, getSchedule);

export default router;