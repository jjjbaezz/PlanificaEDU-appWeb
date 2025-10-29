import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { updateRole, upsertPreferences, getAll, getById } from '../controllers/user.controller.js';

const router = Router();

router.get('/', getAll);
router.get('/:id', getById);

router.patch('/:id/role', requireAuth, updateRole);
router.put('/:id/preferences', requireAuth, upsertPreferences);

export default router;
