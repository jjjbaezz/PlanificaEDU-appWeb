// routes/schedule.routes.js
import express from 'express';
import * as scheduleController from '../controllers/schedule.controller.js';


const router = express.Router();


// Rutas principales
router.get('/', scheduleController.listSchedules);
router.post('/generate', scheduleController.generateSchedule);
router.get('/:id', scheduleController.getSchedule);
router.get('/:id/conflicts', scheduleController.analyzeConflicts);
router.delete('/:id', scheduleController.deleteSchedule);

export default router;