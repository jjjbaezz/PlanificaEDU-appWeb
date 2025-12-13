// routes/auto-enrollment.routes.js
import express from 'express';
import  {generateSchedule, getMySchedules, duplicateSchedule} from '../controllers/personalSchedule.controller.js';



import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();


router.post('/generate', 
  requireAuth, 
  generateSchedule
);

router.get('/my-schedules', 
requireAuth,  getMySchedules
);


router.post('/duplicate', 
  requireAuth, 
  duplicateSchedule
);

export default router;