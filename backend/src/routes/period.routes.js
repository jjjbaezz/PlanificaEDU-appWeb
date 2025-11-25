import { Router } from 'express';
import { getAll, getById, create, update, remove, setActive } from '../controllers/period.controller.js';






const router = Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.patch('/:id/activate', setActive);
router.delete('/:id', remove);






export default router;
