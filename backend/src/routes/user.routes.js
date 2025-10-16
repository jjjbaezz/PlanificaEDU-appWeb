import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { updateRole, upsertPreferences } from '../controllers/user.controller.js';

const router = Router();

router.patch('/:id/role', requireAuth, updateRole);
router.put('/:id/preferences', requireAuth, upsertPreferences);

export default router;
