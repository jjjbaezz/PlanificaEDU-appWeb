import express from 'express';
import {
  enrollInGroup,
  cancelEnrollment,
  getMyEnrollments,
  getGroupEnrollments,
  validateGroupCapacity,
  checkAvailabilityForStudent
} from '../controllers/real-enrollment.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();



// Inscribir en grupo
router.post('/enroll',requireAuth, enrollInGroup);

// Cancelar inscripción
router.delete('/cancel/:inscripcionId',requireAuth, cancelEnrollment);

// Obtener mis inscripciones
router.get('/my-enrollments',requireAuth, getMyEnrollments);

// Obtener inscripciones de un grupo (requiere permisos especiales)
router.get('/group/:grupoId',requireAuth, getGroupEnrollments);

// Validar capacidad de grupo
router.get('/validate-capacity/:grupoId',requireAuth, validateGroupCapacity);

// Verificar disponibilidad para estudiante
router.get('/check-availability/:grupoId',requireAuth, checkAvailabilityForStudent);

export default router;