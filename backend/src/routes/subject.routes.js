import { Router } from 'express';
import {getAll} from '../controllers/subject.controller.js';
import {getById} from '../controllers/subject.controller.js';
import {create} from '../controllers/subject.controller.js';
import {update} from '../controllers/subject.controller.js';
import {remove} from '../controllers/subject.controller.js';






const router = Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);






export default router;
