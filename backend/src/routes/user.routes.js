import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { updateRole, upsertPreferences, createUser, getAll, getById } from '../controllers/user.controller.js';

const router = Router();
// Crear usuario
router.post('/', createUser);

router.get('/', getAll);
router.get('/:id', getById);

router.patch('/:id/role', requireAuth, updateRole);
router.put('/:id/preferences', requireAuth, upsertPreferences);

export default router;
