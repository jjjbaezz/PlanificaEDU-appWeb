import { Router } from 'express';
import {getAll} from '../controllers/careers.controller.js';
import {getById} from '../controllers/careers.controller.js';
import {create} from '../controllers/careers.controller.js';
import {update} from '../controllers/careers.controller.js';
import {remove} from '../controllers/careers.controller.js';
import {partialUpdate} from '../controllers/careers.controller.js';







const router = Router();

router.get('/', getAll);
router.get('/:id', getById);
router.post('/', create);
router.put('/:id', update);
router.delete('/:id', remove);
router.patch('/:id', partialUpdate);







export default router;
