import { Router } from 'express';
import {getAll} from '../controllers/classroom.controller.js';
import {getById} from '../controllers/classroom.controller.js';
import {create} from '../controllers/classroom.controller.js';
import {update} from '../controllers/classroom.controller.js';
import {remove} from '../controllers/classroom.controller.js';






const router = Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);






export default router;
