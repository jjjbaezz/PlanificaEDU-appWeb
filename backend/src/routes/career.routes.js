import { Router } from 'express';
import {
  listCarreras,
  createCarrera,
  updateCarrera,
  deleteCarrera
} from '../controllers/careers.controller.js';

const router = Router();



router.get('/', listCarreras);
router.post('/', createCarrera);
router.put('/:id', updateCarrera);
router.delete('/:id', deleteCarrera);






export default router;
