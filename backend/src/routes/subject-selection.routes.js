import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  getAvailableSubjects,
  saveSelections,
  getCurrentSelections,
  clearSelections,
  getRecommendations,
  validateSelections
} from '../controllers/subject-selection.controller.js';


const router = express.Router();



// Obtener materias disponibles para selección
router.get('/available',requireAuth, getAvailableSubjects);

// Obtener selecciones actuales
router.get('/selections',requireAuth, getCurrentSelections);

// Guardar selecciones
router.post('/select',requireAuth, saveSelections);

// Limpiar selecciones
router.delete('/clear',requireAuth, clearSelections);

// Obtener recomendaciones
router.get('/recommendations',requireAuth, getRecommendations);

// Validar selecciones actuales
router.get('/validation',requireAuth, validateSelections);

export default router;