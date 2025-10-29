import { Router } from 'express';
import {getAll} from '../controllers/period.controller.js';
import {getById} from '../controllers/period.controller.js';
import {create} from '../controllers/period.controller.js';
import {update} from '../controllers/period.controller.js';
import {remove} from '../controllers/period.controller.js';






const router = Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);






export default router;
