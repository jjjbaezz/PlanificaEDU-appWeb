// routes/subjectEnrollment.routes.js
import express from 'express';
import {
  getAvailableSubjects,
  selectSubjects,
  getMySelections,
  updateSelectionPriority,
  clearSelections
} from '../controllers/subjectEnrollment.controller.js';


const router = express.Router();



// RUTAS CORREGIDAS:
// GET /api/subject-enrollment/available
router.get('/available', getAvailableSubjects);

// GET /api/subject-enrollment/selections
router.get('/selections', getMySelections);

// POST /api/subject-enrollment/select
router.post('/select', selectSubjects);

// PUT /api/subject-enrollment/selections/:seleccionId/priority
router.put('/selections/:seleccionId/priority', updateSelectionPriority);

// DELETE /api/subject-enrollment/clear
router.delete('/clear', clearSelections);

export default router;