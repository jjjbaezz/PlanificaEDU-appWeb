import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { updateRole, upsertPreferences, createUser } from '../controllers/user.controller.js';

const router = Router();
// Crear usuario
router.post('/', createUser);

router.patch('/:id/role', requireAuth, updateRole);
router.put('/:id/preferences', requireAuth, upsertPreferences);

export default router;
