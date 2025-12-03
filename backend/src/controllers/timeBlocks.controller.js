import * as timeBlocksService from '../services/timeBlocks.service.js';

// Helper: ensure admin
const ensureAdmin = (req, res) => {
  if (req.user?.rol !== 'ADMIN') {
    res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
    return false;
  }
  return true;
};

// GET /time-blocks - Listar todos los bloques horarios ordenados
export const listTimeBlocks = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const result = await timeBlocksService.getAllTimeBlocks(req.query);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error listando bloques horarios:', err);
    return res.status(500).json({
      message: 'Error al obtener bloques horarios',
      error: err.message,
    });
  }
};

// GET /time-blocks/:id - Obtener bloque por ID
export const getTimeBlockById = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const timeBlock = await timeBlocksService.getTimeBlockById(req.params.id);
    return res.status(200).json({ timeBlock });
  } catch (err) {
    console.error('Error obteniendo bloque horario:', err);
    const statusCode = err.message === 'Bloque horario no encontrado' ? 404 : 500;
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};

// POST /time-blocks - Crear bloque horario
export const createTimeBlock = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const timeBlock = await timeBlocksService.createTimeBlock(req.body);
    return res.status(201).json({
      message: 'Bloque horario creado exitosamente',
      timeBlock,
    });
  } catch (err) {
    console.error('Error creando bloque horario:', err);
    const statusCode = err.message.includes('obligatorios') || 
                       err.message.includes('inválido') || 
                       err.message.includes('Ya existe') ? 400 : 500;
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};

// PUT /time-blocks/:id - Actualizar bloque horario
export const updateTimeBlock = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const timeBlock = await timeBlocksService.updateTimeBlock(req.params.id, req.body);
    return res.status(200).json({
      message: 'Bloque horario actualizado exitosamente',
      timeBlock,
    });
  } catch (err) {
    console.error('Error actualizando bloque horario:', err);
    let statusCode = 500;
    if (err.message === 'Bloque horario no encontrado') statusCode = 404;
    else if (err.message.includes('inválido') || err.message.includes('Ya existe')) statusCode = 400;
    
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};

// DELETE /time-blocks/:id - Eliminar bloque horario
export const deleteTimeBlock = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    await timeBlocksService.deleteTimeBlock(req.params.id);
    return res.status(200).json({
      message: 'Bloque horario eliminado exitosamente',
    });
  } catch (err) {
    console.error('Error eliminando bloque horario:', err);
    let statusCode = 500;
    if (err.message === 'Bloque horario no encontrado') statusCode = 404;
    else if (err.message.includes('siendo usado')) statusCode = 400;
    
    const response = { message: err.message };
    if (err.usedIn) response.usedIn = err.usedIn;
    
    return res.status(statusCode).json(response);
  }
};
