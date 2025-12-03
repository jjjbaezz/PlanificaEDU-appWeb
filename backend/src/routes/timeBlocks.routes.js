import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import {
  listTimeBlocks,
  getTimeBlockById,
  createTimeBlock,
  updateTimeBlock,
  deleteTimeBlock,
} from '../controllers/timeBlocks.controller.js';

const router = Router();

// Todas las rutas requieren autenticación
router.use(requireAuth);

// GET /time-blocks - Listar bloques horarios con filtros
router.get('/', listTimeBlocks);

// GET /time-blocks/:id - Obtener bloque por ID
router.get('/:id', getTimeBlockById);

// POST /time-blocks - Crear bloque horario
router.post('/', createTimeBlock);

// PUT /time-blocks/:id - Actualizar bloque horario
router.put('/:id', updateTimeBlock);

// DELETE /time-blocks/:id - Eliminar bloque horario
router.delete('/:id', deleteTimeBlock);

export default router;
