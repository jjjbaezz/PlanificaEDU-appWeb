import * as realEnrollmentService from '../services/real-enrollment.service.js';
import { prisma } from '../prisma.js';

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

// POST /real-enrollment/enroll - Inscribir estudiante en un grupo
export const enrollInGroup = async (req, res) => {
  try {
    const userId = req.user.id;
    const { grupoId } = req.body;

    if (!grupoId) {
      throw httpError(400, 'El campo grupoId es requerido');
    }

    const result = await realEnrollmentService.enrollStudentInGroup(userId, grupoId);
    
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error en enrollInGroup controller:', error);
    const status = error.status || 500;
    
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al realizar la inscripción'
    });
  }
};

// DELETE /real-enrollment/cancel/:inscripcionId - Cancelar inscripción
export const cancelEnrollment = async (req, res) => {
  try {
    const userId = req.user.id;
    const { inscripcionId } = req.params;

    const result = await realEnrollmentService.cancelEnrollment(inscripcionId, userId);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en cancelEnrollment controller:', error);
    const status = error.status || 500;
    
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al cancelar la inscripción'
    });
  }
};

// GET /real-enrollment/my-enrollments - Obtener inscripciones del estudiante
export const getMyEnrollments = async (req, res) => {
  try {
    const userId = req.user.id;
    const { periodoId } = req.query;

    const result = await realEnrollmentService.getStudentEnrollments(userId, periodoId);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en getMyEnrollments controller:', error);
    const status = error.status || 500;
    
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al obtener inscripciones'
    });
  }
};

// GET /real-enrollment/group/:grupoId - Obtener inscripciones de un grupo
export const getGroupEnrollments = async (req, res) => {
  try {
    const { grupoId } = req.params;

    const result = await realEnrollmentService.getGroupEnrollments(grupoId);
    
    return res.status(200).json(result);
  } catch (error) {
    console.error('Error en getGroupEnrollments controller:', error);
    const status = error.status || 500;
    
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al obtener inscripciones del grupo'
    });
  }
};

// GET /real-enrollment/validate-capacity/:grupoId - Validar cupo de grupo
export const validateGroupCapacity = async (req, res) => {
  try {
    const { grupoId } = req.params;

    const result = await realEnrollmentService.validateGroupCapacity(grupoId);
    
    return res.status(200).json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error en validateGroupCapacity controller:', error);
    const status = error.status || 500;
    
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al validar capacidad del grupo'
    });
  }
};

// GET /real-enrollment/check-availability/:grupoId - Verificar disponibilidad para estudiante
export const checkAvailabilityForStudent = async (req, res) => {
  try {
    const userId = req.user.id;
    const { grupoId } = req.params;

    // Obtener información del grupo
    const grupo = await prisma.grupos.findUnique({
      where: { id: grupoId },
      include: {
        materias: true,
        periodos: true,
        _count: {
          select: { inscripciones: true }
        }
      }
    });

    if (!grupo) {
      throw httpError(404, 'Grupo no encontrado');
    }

    // Verificar cupo
    const cupoDisponible = grupo.cupo_max - grupo._count.inscripciones;
    if (cupoDisponible <= 0) {
      return res.status(200).json({
        success: false,
        disponible: false,
        motivo: 'CUPO_LLENO',
        message: 'El grupo ya alcanzó el cupo máximo'
      });
    }

    // Verificar si ya está inscrito
    const inscripcionExistente = await prisma.inscripciones.findFirst({
      where: {
        usuario_id: userId,
        grupo_id: grupoId
      }
    });

    if (inscripcionExistente) {
      return res.status(200).json({
        success: false,
        disponible: false,
        motivo: 'YA_INSCRITO',
        message: 'Ya estás inscrito en este grupo'
      });
    }

    // Verificar conflictos de horario
    const horariosGrupo = await prisma.horario_detalle.findMany({
      where: { grupo_id: grupoId },
      include: {
        bloques_horarios: true
      }
    });

    const inscripcionesEstudiante = await prisma.inscripciones.findMany({
      where: {
        usuario_id: userId,
        grupos: {
          periodo_id: grupo.periodo_id
        }
      },
      include: {
        grupos: {
          include: {
            horario_detalle: {
              include: {
                bloques_horarios: true
              }
            }
          }
        }
      }
    });

    const conflictos = [];
    for (const horarioGrupo of horariosGrupo) {
      for (const inscripcion of inscripcionesEstudiante) {
        for (const horarioExistente of inscripcion.grupos.horario_detalle) {
          if (
            horarioGrupo.bloques_horarios.dia === horarioExistente.bloques_horarios.dia &&
            horarioGrupo.bloques_horarios.hora_inicio < horarioExistente.bloques_horarios.hora_fin &&
            horarioGrupo.bloques_horarios.hora_fin > horarioExistente.bloques_horarios.hora_inicio
          ) {
            conflictos.push({
              dia: horarioGrupo.bloques_horarios.dia,
              hora_grupo: `${horarioGrupo.bloques_horarios.hora_inicio.toTimeString().slice(0,5)} - ${horarioGrupo.bloques_horarios.hora_fin.toTimeString().slice(0,5)}`,
              materia_conflicto: inscripcion.grupos.materias?.nombre || 'Materia sin nombre'
            });
          }
        }
      }
    }

    if (conflictos.length > 0) {
      return res.status(200).json({
        success: false,
        disponible: false,
        motivo: 'CONFLICTO_HORARIO',
        conflictos,
        message: 'Conflicto de horario con otras materias inscritas'
      });
    }

    // Verificar prerrequisitos
    const prerrequisitos = await prisma.prerrequisitos.findMany({
      where: {
        materia_id: grupo.materia_id
      },
      include: {
        materias_prerrequisitos_requiere_idTomaterias: true
      }
    });

    const materiasCursadas = await prisma.inscripciones.findMany({
      where: {
        usuario_id: userId,
        grupos: {
          periodos: {
            fecha_fin: {
              lt: new Date() // Solo materias ya finalizadas
            }
          }
        }
      },
      include: {
        grupos: {
          select: {
            materia_id: true
          }
        }
      }
    });

    const idsMateriasCursadas = materiasCursadas.map(i => i.grupos.materia_id);
    const prerrequisitosPendientes = [];

    for (const prereq of prerrequisitos) {
      if (!idsMateriasCursadas.includes(prereq.requiere_id)) {
        prerrequisitosPendientes.push({
          materia: prereq.materias_prerrequisitos_requiere_idTomaterias.codigo,
          nombre: prereq.materias_prerrequisitos_requiere_idTomaterias.nombre
        });
      }
    }

    if (prerrequisitosPendientes.length > 0) {
      return res.status(200).json({
        success: false,
        disponible: false,
        motivo: 'PRERREQUISITOS_PENDIENTES',
        prerrequisitos_pendientes: prerrequisitosPendientes,
        message: 'No cumples con los prerrequisitos de la materia'
      });
    }

    return res.status(200).json({
      success: true,
      disponible: true,
      grupo: {
        id: grupo.id,
        seccion: grupo.seccion,
        materia: grupo.materias,
        cupo_max: grupo.cupo_max,
        inscritos: grupo._count.inscripciones,
        disponibles: cupoDisponible,
        porcentaje: Math.round((grupo._count.inscripciones / grupo.cupo_max) * 100)
      },
      message: 'El grupo está disponible para inscripción'
    });

  } catch (error) {
    console.error('Error en checkAvailabilityForStudent controller:', error);
    const status = error.status || 500;
    
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al verificar disponibilidad'
    });
  }
};