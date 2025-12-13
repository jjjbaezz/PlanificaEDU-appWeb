import * as subjectSelectionService from '../services/subject-selection.service.js';

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// GET /subject-selection/available
export const getAvailableSubjects = async (req, res) => {
  try {
    const userId = req.user.id;
    const { periodoId } = req.query;

    if (!periodoId) {
      throw httpError(400, 'El parámetro periodoId es requerido');
    }

    const result = await subjectSelectionService.getAvailableSubjects(
      userId, 
      periodoId
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en getAvailableSubjects controller:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al obtener materias disponibles'
    });
  }
};

// POST /subject-selection/select
export const saveSelections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { periodoId, materias } = req.body;

    if (!periodoId) {
      throw httpError(400, 'El campo periodoId es requerido');
    }

    if (!materias || !Array.isArray(materias) || materias.length === 0) {
      throw httpError(400, 'Debe proporcionar un array de materias');
    }

    const result = await subjectSelectionService.saveSubjectSelections(
      userId,
      periodoId,
      materias
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en saveSelections controller:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al guardar selecciones'
    });
  }
};

// GET /subject-selection/selections
export const getCurrentSelections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { periodoId } = req.query;

    if (!periodoId) {
      throw httpError(400, 'El parámetro periodoId es requerido');
    }

    const result = await subjectSelectionService.getCurrentSelections(
      userId,
      periodoId
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en getCurrentSelections controller:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al obtener selecciones actuales'
    });
  }
};

// DELETE /subject-selection/clear
export const clearSelections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { periodoId } = req.body;

    if (!periodoId) {
      throw httpError(400, 'El campo periodoId es requerido');
    }

    const result = await subjectSelectionService.clearSelections(
      userId,
      periodoId
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en clearSelections controller:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al limpiar selecciones'
    });
  }
};

// GET /subject-selection/recommendations
export const getRecommendations = async (req, res) => {
  try {
    const userId = req.user.id;
    const { periodoId } = req.query;

    if (!periodoId) {
      throw httpError(400, 'El parámetro periodoId es requerido');
    }

    const result = await subjectSelectionService.getSubjectRecommendations(
      userId,
      periodoId
    );

    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en getRecommendations controller:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al obtener recomendaciones'
    });
  }
};

// GET /subject-selection/validation
export const validateSelections = async (req, res) => {
  try {
    const userId = req.user.id;
    const { periodoId } = req.query;

    if (!periodoId) {
      throw httpError(400, 'El parámetro periodoId es requerido');
    }

    // Obtener selecciones actuales
    const selecciones = await subjectSelectionService.getCurrentSelections(
      userId,
      periodoId
    );

    // Obtener disponibilidad
    const disponibilidad = await subjectSelectionService.getAvailableSubjects(
      userId,
      periodoId
    );

    // Validar cada selección
    const validaciones = selecciones.selecciones.map(seleccion => {
      const materiaInfo = disponibilidad.materias.find(
        m => m.id === seleccion.materia_id
      );
      
      return {
        materia_id: seleccion.materia_id,
        codigo: seleccion.materia?.codigo,
        nombre: seleccion.materia?.nombre,
        valida: materiaInfo?.disponible || false,
        razon: materiaInfo?.disponible 
          ? 'Disponible' 
          : materiaInfo?.nivel === 2 
            ? 'Prerrequisitos pendientes' 
            : 'Ya cursada o sin grupos'
      };
    });

    const todasValidas = validaciones.every(v => v.valida);
    const totalCreditos = selecciones.totalCreditos;

    return res.status(200).json({
      success: true,
      todasValidas,
      totalSelecciones: selecciones.total,
      totalCreditos,
      validaciones,
      recomendacion: totalCreditos > 24 
        ? 'Excedes el límite recomendado de 24 créditos' 
        : 'Carga académica adecuada'
    });
  } catch (error) {
    console.error('Error en validateSelections controller:', error);
    const status = error.status || 500;
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al validar selecciones'
    });
  }
};