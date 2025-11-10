import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  listBuildings,
  getBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
  validateBuildingCode,
  listBuildingClassrooms
} from '../controllers/buildings.controller.js';

const router = Router();

router.get('/', requireAuth, listBuildings);

router.get('/validate', requireAuth, validateBuildingCode);

router.get('/:id', requireAuth, getBuildingById);
router.post('/', requireAuth, createBuilding);
router.put('/:id', requireAuth, updateBuilding);
router.delete('/:id', requireAuth, deleteBuilding);

router.get('/:id/classrooms', requireAuth, listBuildingClassrooms);

export default router;
