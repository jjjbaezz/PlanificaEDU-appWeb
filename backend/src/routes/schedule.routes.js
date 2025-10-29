import { Router } from 'express';
import {getAll} from '../controllers/schedule.controller.js';
import {getById} from '../controllers/schedule.controller.js';
import {create} from '../controllers/schedule.controller.js';
import {update} from '../controllers/schedule.controller.js';
import {remove} from '../controllers/schedule.controller.js';






const router = Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);






export default router;
