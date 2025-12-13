// services/auto-enrollment.service.js
import { prisma } from '../prisma.js';

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

/**
 * Realiza inscripciones automáticas basadas en un horario generado
 */
export const enrollFromSchedule = async (userId, horarioId) => {
  try {
    console.log('🔄 Iniciando inscripciones automáticas:', { userId, horarioId });

    // 1. Verificar que el horario existe y pertenece al usuario
    const horario = await prisma.horarios.findUnique({
      where: { id: horarioId },
      include: {
        horario_detalle: {
          include: {
            grupos: {
              include: {
                materias: true,
                _count: {
                  select: { inscripciones: true }
                }
              }
            }
          }
        }
      }
    });

    if (!horario) {
      throw httpError(404, 'Horario no encontrado');
    }

    if (horario.creado_por !== userId) {
      throw httpError(403, 'No tienes permiso para usar este horario');
    }

    // 2. Obtener grupos del horario
    const gruposDelHorario = horario.horario_detalle.map(hd => hd.grupos);
    const gruposUnicos = [...new Map(gruposDelHorario.map(g => [g.id, g])).values()];

    console.log(`📋 Grupos en el horario: ${gruposUnicos.length}`);

    // 3. Obtener selecciones del usuario para validar
    const selecciones = await prisma.selecciones_materia.findMany({
      where: {
        usuario_id: userId,
        periodo_id: horario.periodo_id
      },
      include: {
        materias: true
      }
    });

    const materiasSeleccionadasIds = selecciones.map(s => s.materia_id);

    // 4. Realizar inscripciones para cada grupo válido
    const resultados = [];
    const errores = [];

    for (const grupo of gruposUnicos) {
      try {
        // Verificar que la materia está en las selecciones
        if (!materiasSeleccionadasIds.includes(grupo.materia_id)) {
          errores.push({
            grupoId: grupo.id,
            materia: grupo.materias.nombre,
            motivo: 'Materia no seleccionada por el usuario'
          });
          continue;
        }

        // Verificar cupo disponible
        const inscripcionesActuales = grupo._count.inscripciones;
        if (inscripcionesActuales >= grupo.cupo_max) {
          errores.push({
            grupoId: grupo.id,
            materia: grupo.materias.nombre,
            seccion: grupo.seccion,
            motivo: 'Cupo lleno'
          });
          continue;
        }

        // Verificar si ya está inscrito
        const inscripcionExistente = await prisma.inscripciones.findFirst({
          where: {
            usuario_id: userId,
            grupo_id: grupo.id
          }
        });

        if (inscripcionExistente) {
          resultados.push({
            grupoId: grupo.id,
            materia: grupo.materias.nombre,
            seccion: grupo.seccion,
            estado: 'YA_INSCRITO',
            inscripcionId: inscripcionExistente.id
          });
          continue;
        }

        // Realizar inscripción
        const inscripcion = await prisma.inscripciones.create({
          data: {
            usuario_id: userId,
            grupo_id: grupo.id
          },
          include: {
            grupos: {
              include: {
                materias: true
              }
            }
          }
        });

        resultados.push({
          grupoId: grupo.id,
          materia: grupo.materias.nombre,
          seccion: grupo.seccion,
          estado: 'INSCRITO',
          inscripcionId: inscripcion.id
        });

        console.log(`✅ Inscrito en: ${grupo.materias.nombre} - ${grupo.seccion}`);

      } catch (error) {
        errores.push({
          grupoId: grupo.id,
          materia: grupo.materias?.nombre || 'Desconocida',
          seccion: grupo.seccion,
          motivo: error.message
        });
      }
    }

    // 5. Actualizar estado del horario
    await prisma.horarios.update({
      where: { id: horarioId },
      data: {
        estado: 'DONE',
        score: resultados.length > 0 ? resultados.length / gruposUnicos.length : 0
      }
    });

    return {
      success: true,
      totalGrupos: gruposUnicos.length,
      inscripcionesExitosas: resultados.filter(r => r.estado === 'INSCRITO').length,
      yaInscritos: resultados.filter(r => r.estado === 'YA_INSCRITO').length,
      errores: errores.length,
      detalles: {
        exitosas: resultados,
        errores
      },
      mensaje: `Inscripciones completadas: ${resultados.filter(r => r.estado === 'INSCRITO').length} de ${gruposUnicos.length} grupos`
    };

  } catch (error) {
    console.error('❌ Error en enrollFromSchedule:', error);
    throw error;
  }
};

/**
 * Valida si se puede realizar inscripciones automáticas
 */
export const validateAutoEnrollment = async (userId, horarioId) => {
  try {
    const horario = await prisma.horarios.findUnique({
      where: { id: horarioId },
      include: {
        horario_detalle: {
          include: {
            grupos: {
              include: {
                materias: true,
                _count: {
                  select: { inscripciones: true }
                }
              }
            }
          }
        }
      }
    });

    if (!horario) {
      throw httpError(404, 'Horario no encontrado');
    }

    if (horario.creado_por !== userId) {
      throw httpError(403, 'Horario no pertenece al usuario');
    }

    const grupos = horario.horario_detalle.map(hd => hd.grupos);
    const gruposUnicos = [...new Map(grupos.map(g => [g.id, g])).values()];

    const validaciones = gruposUnicos.map(grupo => {
      const cupoDisponible = grupo.cupo_max - grupo._count.inscripciones;
      return {
        grupoId: grupo.id,
        materia: grupo.materias.nombre,
        seccion: grupo.seccion,
        cupoDisponible,
        disponible: cupoDisponible > 0,
        inscritosActuales: grupo._count.inscripciones,
        cupoMax: grupo.cupo_max
      };
    });

    const todosDisponibles = validaciones.every(v => v.disponible);

    return {
      canEnroll: todosDisponibles,
      totalGrupos: gruposUnicos.length,
      gruposConCupo: validaciones.filter(v => v.disponible).length,
      validaciones,
      recomendacion: todosDisponibles 
        ? 'Todos los grupos tienen cupo disponible' 
        : 'Algunos grupos no tienen cupo disponible'
    };

  } catch (error) {
    console.error('Error en validateAutoEnrollment:', error);
    throw error;
  }
};