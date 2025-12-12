import { Router } from 'express';
import { generate, getById } from '../controllers/schedule.controller.js';
import { requireAuth } from '../middlewares/auth.js'; // tu middleware passport






const router = Router();


router.get('/:id', getById);

router.post('/generate', requireAuth, generate);






export default router;
