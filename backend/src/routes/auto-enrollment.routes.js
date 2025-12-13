// routes/auto-enrollment.routes.js
import express from 'express';
import   {validateEnrollment, enrollFromSchedule} from '../controllers/auto-enrollment.controller.js';
import { requireAuth } from '../middlewares/auth.js';




const router = express.Router();


// Validar inscripciones automáticas
router.get('/validate/:horarioId',requireAuth, validateEnrollment);

// Realizar inscripciones automáticas
router.post('/enroll-from-schedule',requireAuth, enrollFromSchedule);

export default router;