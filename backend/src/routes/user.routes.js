import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { requireRole } from '../middlewares/roles.js';

import { updateRole, upsertPreferences, createUser, getAll, getById, updateUser,toggleUserStatus  } from '../controllers/user.controller.js';

const router = Router();
router.post('/',requireAuth, requireRole('ADMIN'), createUser); 
router.patch('/:id/toggle',requireAuth, requireRole('ADMIN'), toggleUserStatus);
router.patch('/:id',requireAuth, requireRole('ADMIN'), updateUser);


router.get('/', getAll);
router.get('/:id', getById);

router.patch('/:id/role', requireAuth, updateRole);
router.put('/:id/preferences', requireAuth, upsertPreferences);

export default router;
