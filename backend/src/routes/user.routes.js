import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { updateRole, getPreferences, updatePreferences, createUser, getAll, getById } from '../controllers/user.controller.js';
import { requireRole } from '../middlewares/roles.js';
import passport from 'passport';

const router = Router();
router.post('/',requireAuth, requireRole('ADMIN'), createUser); 
router.patch('/:id/toggle',requireAuth, requireRole('ADMIN'), toggleUserStatus);
router.patch('/:id',requireAuth, requireRole('ADMIN'), updateUser);
router.patch('/:id/deactivate',requireAuth, requireRole('ADMIN'),  deactivateUser);

router.get('/', getAll);
router.get('/:id', getById);

router.patch('/:id/role', requireAuth, updateRole);
router.get(
  '/:id/preferences',
  passport.authenticate('jwt', { session: false }),
  getPreferences
);

router.put(
  '/:id/preferences',
  passport.authenticate('jwt', { session: false }),
  updatePreferences
)
export default router;
