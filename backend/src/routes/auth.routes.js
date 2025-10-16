import { Router } from 'express';
import passport from 'passport';
import { register, login, me } from '../controllers/auth.controller.js';
import { requireAuth } from '../middlewares/auth.js';

const router = Router();

router.post('/register', register);

router.post('/login', (req, res, next) => {
  passport.authenticate('local', { session: false }, (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ message: info?.message || 'Credenciales inválidas' });
    }
    req.user = user;
    return login(req, res);
  })(req, res, next);
});

router.get('/me', requireAuth, me);
 
export default router;
