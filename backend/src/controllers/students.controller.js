// GET /students/:id/preferences - Consultar preferencias de cualquier estudiante por ID
export const getStudentPreferences = async (req, res) => {
  try {
    const studentId = req.params.id;
    const preferences = await studentsService.getMyPreferences(studentId);
    if (!preferences) {
      return res.status(404).json({ message: 'Preferencias no encontradas para el estudiante' });
    }
    return res.status(200).json({
      message: 'Preferencias consultadas exitosamente',
      preferences,
    });
  } catch (err) {
    console.error('Error consultando preferencias de estudiante:', err);
    return res.status(500).json({ message: 'Error al consultar preferencias', error: err.message });
  }
};
// DELETE /students/:id - Eliminar estudiante físicamente
export const deleteStudent = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    await studentsService.deleteStudent(req.params.id);
    return res.status(204).send();
  } catch (err) {
    console.error('Error eliminando estudiante:', err);
    const statusCode = err.message === 'Estudiante no encontrado' ? 404 : 500;
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};
import * as studentsService from '../services/students.service.js';

// Helper: ensure admin
const ensureAdmin = (req, res) => {
  if (req.user?.rol !== 'ADMIN') {
    res.status(403).json({ message: 'Acceso denegado. Solo administradores.' });
    return false;
  }
  return true;
};

// GET /students - Listado con filtros
export const listStudents = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const result = await studentsService.getAllStudents(req.query, req.query);
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error listando estudiantes:', err);
    return res.status(500).json({
      message: 'Error al obtener estudiantes',
      error: err.message,
    });
  }
};

// GET /students/:id - Obtener estudiante por ID
export const getStudentById = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const student = await studentsService.getStudentById(req.params.id);
    return res.status(200).json({ student });
  } catch (err) {
    console.error('Error obteniendo estudiante:', err);
    const statusCode = err.message === 'Estudiante no encontrado' ? 404 : 500;
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};

// POST /students - Crear estudiante
export const createStudent = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const student = await studentsService.createStudent(req.body);
    return res.status(201).json({
      message: 'Estudiante creado exitosamente',
      student,
    });
  } catch (err) {
    console.error('Error creando estudiante:', err);
    const statusCode = err.message.includes('obligatorios') || 
                       err.message.includes('inválido') || 
                       err.message.includes('registrado') ||
                       err.message.includes('no encontrada') ? 400 : 500;
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};

// PUT /students/:id - Editar datos básicos del estudiante
export const updateStudent = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const student = await studentsService.updateStudent(req.params.id, req.body);
    return res.status(200).json({
      message: 'Estudiante actualizado exitosamente',
      student,
    });
  } catch (err) {
    console.error('Error actualizando estudiante:', err);
    let statusCode = 500;
    if (err.message === 'Estudiante no encontrado') statusCode = 404;
    else if (err.message.includes('inválido') || err.message.includes('en uso') || err.message.includes('no encontrada')) statusCode = 400;
    
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};

// PATCH /students/:id/deactivate - Desactivar estudiante (soft delete)
export const deactivateStudent = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const student = await studentsService.deactivateStudent(req.params.id);
    return res.status(200).json({
      message: 'Estudiante desactivado exitosamente',
      student,
    });
  } catch (err) {
    console.error('Error desactivando estudiante:', err);
    const statusCode = err.message === 'Estudiante no encontrado' ? 404 : 500;
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};

// PATCH /students/:id/activate - Reactivar estudiante
export const activateStudent = async (req, res) => {
  if (!ensureAdmin(req, res)) return;

  try {
    const student = await studentsService.activateStudent(req.params.id);
    return res.status(200).json({
      message: 'Estudiante activado exitosamente',
      student,
    });
  } catch (err) {
    console.error('Error activando estudiante:', err);
    const statusCode = err.message === 'Estudiante no encontrado' ? 404 : 500;
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};

// ==================== PERFIL DE USUARIO ====================

// GET /students/profile/me - Ver perfil propio
export const getMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const user = await studentsService.getMyProfile(userId);
    return res.status(200).json({ user });
  } catch (err) {
    console.error('Error obteniendo perfil:', err);
    const statusCode = err.message === 'Usuario no encontrado' ? 404 : 500;
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};

// PUT /students/profile/me - Editar perfil propio (datos básicos, NO rol)
export const updateMyProfile = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const user = await studentsService.updateMyProfile(userId, req.body);
    return res.status(200).json({
      message: 'Perfil actualizado exitosamente',
      user,
    });
  } catch (err) {
    console.error('Error actualizando perfil:', err);
    let statusCode = 500;
    if (err.message === 'Usuario no encontrado') statusCode = 404;
    else if (err.message.includes('inválido') || err.message.includes('en uso') || err.message.includes('no encontrada')) statusCode = 400;
    
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};

// GET /students/profile/preferences - Consultar preferencias propias
export const getMyPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }
    const preferences = await studentsService.getMyPreferences(userId);
    if (!preferences) {
      return res.status(404).json({ message: 'Preferencias no encontradas' });
    }
    return res.status(200).json({
      message: 'Preferencias consultadas exitosamente',
      preferences,
    });
  } catch (err) {
    console.error('Error consultando preferencias:', err);
    return res.status(500).json({ message: 'Error al consultar preferencias', error: err.message });
  }
};

// PUT /students/profile/preferences - Actualizar preferencias de usuario
export const updateMyPreferences = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ message: 'Usuario no autenticado' });
    }

    const preferences = await studentsService.updateMyPreferences(userId, req.body);
    return res.status(200).json({
      message: 'Preferencias actualizadas exitosamente',
      preferences,
    });
  } catch (err) {
    console.error('Error actualizando preferencias:', err);
    const statusCode = err.message.includes('inválido') || 
                       err.message.includes('Días') ||
                       err.message.includes('compactación') ? 400 : 500;
    return res.status(statusCode).json({
      message: err.message,
    });
  }
};
