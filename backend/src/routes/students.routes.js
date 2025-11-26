import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  listStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deactivateStudent,
  activateStudent,
  getMyProfile,
  updateMyProfile,
  updateMyPreferences,
} from '../controllers/students.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// ============ PERFIL DE USUARIO (cualquier usuario autenticado) ============
// GET /students/profile/me - Ver mi perfil
router.get('/profile/me', getMyProfile);

// PUT /students/profile/me - Editar mi perfil (datos básicos, NO rol)
router.put('/profile/me', updateMyProfile);

// PUT /students/profile/preferences - Actualizar mis preferencias
router.put('/profile/preferences', updateMyPreferences);

// ============ GESTIÓN DE ESTUDIANTES (solo ADMIN) ============
// GET /students - Listado con filtros
router.get('/', listStudents);

// GET /students/:id - Obtener estudiante por ID
router.get('/:id', getStudentById);

// POST /students - Crear estudiante
router.post('/', createStudent);

// PUT /students/:id - Actualizar datos básicos
router.put('/:id', updateStudent);

// PATCH /students/:id/deactivate - Desactivar estudiante
router.patch('/:id/deactivate', deactivateStudent);

// PATCH /students/:id/activate - Reactivar estudiante
router.patch('/:id/activate', activateStudent);

export default router;
