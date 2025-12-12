import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { updateRole, getPreferences, updatePreferences, createUser, getAll, getById } from '../controllers/user.controller.js';
import passport from 'passport';

const router = Router();
// Crear usuario
router.post('/', createUser);

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
