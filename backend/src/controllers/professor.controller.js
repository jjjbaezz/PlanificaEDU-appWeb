import * as professorsService from '../services/professors.service.js';

// GET /professors/:id/availability
export const getAvailability = async (req, res) => {
  try {
    const result = await professorsService.getAvailability(req.params.id);
    return res.json(result);
  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// PUT /professors/:id/availability
export const updateAvailability = async (req, res) => {
  try {
    const { bloque_id, estado } = req.body;
    const result = await professorsService.updateAvailability(req.params.id, bloque_id, estado, req.user.id, req.user.rol);
    return res.json(result);
  } catch (error) {
    console.error('Error actualizando disponibilidad:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const bulkUpdateAvailability = async (req, res) => {
  try {
    const { updates } = req.body;
    const result = await professorsService.bulkUpdateAvailability(req.params.id, updates, req.user.id, req.user.rol);
    return res.json(result);
  } catch (error) {
    console.error('Error en actualización masiva:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// GET /professors/:id/profile
export const getProfile = async (req, res) => {
  try {
    const result = await professorsService.getProfile(req.params.id);
    return res.json(result);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// PUT /professors/:id/profile
export const updateProfile = async (req, res) => {
  try {
    const { nombre, carga_max_horas, carrera_id } = req.body;
    const result = await professorsService.updateProfile(req.params.id, { nombre, carga_max_horas, carrera_id }, req.user.id, req.user.rol);
    return res.json(result);
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// GET /professors/:id/schedule
export const getSchedule = async (req, res) => {
  try {
    const { periodo_id } = req.query;
    const result = await professorsService.getSchedule(req.params.id, periodo_id);
    return res.json(result);
  } catch (error) {
    console.error('Error obteniendo horario:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};





// GET /professors
export const getAllProfessors = async (req, res) => {
  try {
    const result = await professorsService.getAllProfessors();
    return res.json({ data: result });
  } catch (error) {
    console.error('Error obteniendo profesores:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// GET /professors/:id
export const getProfessorById = async (req, res) => {
  try {
    const result = await professorsService.getProfessorById(req.params.id);
    return res.json(result);
  } catch (error) {
    console.error('Error obteniendo profesor:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// POST /professors
export const createProfessor = async (req, res) => {
  try {
    const data = req.body;
    const result = await professorsService.createProfessor(data);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creando profesor:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// PUT /professors/:id
export const updateProfessor = async (req, res) => {
  try {
    const data = req.body;
    const result = await professorsService.updateProfessor(req.params.id, data);
    return res.json(result);
  } catch (error) {
    console.error('Error actualizando profesor:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// DELETE /professors/:id
export const deleteProfessor = async (req, res) => {
  try {
    await professorsService.deleteProfessor(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error('Error eliminando profesor:', error);
    if (error.message === 'Profesor no encontrado') {
      return res.status(404).json({ message: 'Profesor no encontrado' });
    }
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};




