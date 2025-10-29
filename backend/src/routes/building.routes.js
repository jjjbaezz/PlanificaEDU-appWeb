import { Router } from 'express';
import {getAll} from '../controllers/building.controller.js';
import {getById} from '../controllers/building.controller.js';
import {create} from '../controllers/building.controller.js';
import {update} from '../controllers/building.controller.js';
import {remove} from '../controllers/building.controller.js';






const router = Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);






export default router;
