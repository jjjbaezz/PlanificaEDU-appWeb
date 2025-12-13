import { prisma } from '../prisma.js';

export const enrollStudentInGroup = async (userId, grupoId) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Verificar que el grupo existe y tiene cupo
      const grupo = await tx.grupos.findUnique({
        where: { id: grupoId },
        include: {
          _count: {
            select: { inscripciones: true }
          }
        }
      });

      if (!grupo) {
        throw new Error('Grupo no encontrado');
      }

      // 2. Verificar cupo disponible
      const cupoDisponible = grupo.cupo_max - grupo._count.inscripciones;
      if (cupoDisponible <= 0) {
        throw new Error('El grupo ya alcanzó el cupo máximo');
      }

      // 3. Verificar que el estudiante no esté ya inscrito en este grupo
      const inscripcionExistente = await tx.inscripciones.findFirst({
        where: {
          usuario_id: userId,
          grupo_id: grupoId
        }
      });

      if (inscripcionExistente) {
        throw new Error('El estudiante ya está inscrito en este grupo');
      }

      // 4. Verificar que el estudiante no tenga conflictos de horario
      const horariosDelGrupo = await tx.horario_detalle.findMany({
        where: { grupo_id: grupoId },
        include: {
          bloques_horarios: true
        }
      });

      const inscripcionesDelEstudiante = await tx.inscripciones.findMany({
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

      // Verificar conflictos de horario
      for (const horarioGrupo of horariosDelGrupo) {
        for (const inscripcion of inscripcionesDelEstudiante) {
          for (const horarioExistente of inscripcion.grupos.horario_detalle) {
            if (
              horarioGrupo.bloques_horarios.dia === horarioExistente.bloques_horarios.dia &&
              horarioGrupo.bloques_horarios.hora_inicio < horarioExistente.bloques_horarios.hora_fin &&
              horarioGrupo.bloques_horarios.hora_fin > horarioExistente.bloques_horarios.hora_inicio
            ) {
              throw new Error('Conflicto de horario con otra materia inscrita');
            }
          }
        }
      }

      // 5. Crear la inscripción
      const inscripcion = await tx.inscripciones.create({
        data: {
          usuario_id: userId,
          grupo_id: grupoId
        },
        include: {
          usuarios: {
            select: {
              id: true,
              nombre: true,
              email: true
            }
          },
          grupos: {
            include: {
              materias: true,
              usuarios: true,
              _count: {
                select: { inscripciones: true }
              }
            }
          }
        }
      });

      // 6. Actualizar estadísticas del grupo
      const nuevosInscritos = grupo._count.inscripciones + 1;
      const nuevosDisponibles = Math.max(grupo.cupo_max - nuevosInscritos, 0);

      return {
        success: true,
        inscripcion,
        grupo: {
          id: grupo.id,
          seccion: grupo.seccion,
          cupo_max: grupo.cupo_max,
          inscritos: nuevosInscritos,
          disponibles: nuevosDisponibles,
          porcentaje_ocupado: Math.round((nuevosInscritos / grupo.cupo_max) * 100)
        },
        message: 'Inscripción realizada exitosamente'
      };
    });
  } catch (error) {
    console.error('Error en enrollStudentInGroup:', error);
    throw error;
  }
};

export const cancelEnrollment = async (inscripcionId, userId) => {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Verificar que la inscripción existe y pertenece al estudiante
      const inscripcion = await tx.inscripciones.findUnique({
        where: { id: inscripcionId },
        include: {
          grupos: {
            include: {
              _count: {
                select: { inscripciones: true }
              }
            }
          }
        }
      });

      if (!inscripcion) {
        throw new Error('Inscripción no encontrada');
      }

      if (inscripcion.usuario_id !== userId) {
        throw new Error('No tienes permisos para cancelar esta inscripción');
      }

      // 2. Eliminar la inscripción
      await tx.inscripciones.delete({
        where: { id: inscripcionId }
      });

      // 3. Calcular nuevas estadísticas
      const grupo = inscripcion.grupos;
      const nuevosInscritos = grupo._count.inscripciones - 1;
      const nuevosDisponibles = Math.max(grupo.cupo_max - nuevosInscritos, 0);

      return {
        success: true,
        grupo: {
          id: grupo.id,
          seccion: grupo.seccion,
          cupo_max: grupo.cupo_max,
          inscritos: nuevosInscritos,
          disponibles: nuevosDisponibles,
          porcentaje_ocupado: Math.round((nuevosInscritos / grupo.cupo_max) * 100)
        },
        message: 'Inscripción cancelada exitosamente'
      };
    });
  } catch (error) {
    console.error('Error en cancelEnrollment:', error);
    throw error;
  }
};

export const getGroupEnrollments = async (grupoId) => {
  try {
    const grupo = await prisma.grupos.findUnique({
      where: { id: grupoId },
      include: {
        materias: true,
        usuarios: true, // Profesor
        periodos: true,
        inscripciones: {
          include: {
            usuarios: {
              select: {
                id: true,
                nombre: true,
                email: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          }
        },
        _count: {
          select: { inscripciones: true }
        }
      }
    });

    if (!grupo) {
      throw new Error('Grupo no encontrado');
    }

    const cupoDisponible = grupo.cupo_max - grupo._count.inscripciones;
    const porcentajeOcupado = Math.round((grupo._count.inscripciones / grupo.cupo_max) * 100);

    return {
      success: true,
      grupo: {
        id: grupo.id,
        materia: grupo.materias,
        profesor: grupo.usuarios,
        periodo: grupo.periodos,
        seccion: grupo.seccion,
        cupo_max: grupo.cupo_max,
        inscritos: grupo._count.inscripciones,
        disponibles: Math.max(cupoDisponible, 0),
        porcentaje_ocupado: porcentajeOcupado
      },
      inscripciones: grupo.inscripciones,
      total: grupo.inscripciones.length
    };
  } catch (error) {
    console.error('Error en getGroupEnrollments:', error);
    throw error;
  }
};

export const getStudentEnrollments = async (userId, periodoId = null) => {
  try {
    const where = {
      usuario_id: userId
    };

    if (periodoId) {
      where.grupos = {
        periodo_id: periodoId
      };
    }

    const inscripciones = await prisma.inscripciones.findMany({
      where,
      include: {
        grupos: {
          include: {
            materias: true,
            usuarios: true, // Profesor
            periodos: true,
            horario_detalle: {
              include: {
                bloques_horarios: true
              }
            },
            _count: {
              select: { inscripciones: true }
            }
          }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    const formatted = inscripciones.map(inscripcion => {
      const grupo = inscripcion.grupos;
      const cupoDisponible = grupo.cupo_max - grupo._count.inscripciones;

      return {
        id: inscripcion.id,
        created_at: inscripcion.created_at,
        grupo: {
          id: grupo.id,
          seccion: grupo.seccion,
          materia: grupo.materias,
          profesor: grupo.usuarios,
          periodo: grupo.periodos,
          cupo_max: grupo.cupo_max,
          inscritos: grupo._count.inscripciones,
          disponibles: Math.max(cupoDisponible, 0),
          horarios: grupo.horario_detalle.map(hd => ({
            dia: hd.bloques_horarios.dia,
            hora_inicio: hd.bloques_horarios.hora_inicio,
            hora_fin: hd.bloques_horarios.hora_fin,
            turno: hd.bloques_horarios.turno
          }))
        }
      };
    });

    return {
      success: true,
      inscripciones: formatted,
      total: formatted.length,
      total_creditos: formatted.reduce((sum, i) => sum + i.grupo.materia.creditos, 0)
    };
  } catch (error) {
    console.error('Error en getStudentEnrollments:', error);
    throw error;
  }
};

export const validateGroupCapacity = async (grupoId) => {
  try {
    const grupo = await prisma.grupos.findUnique({
      where: { id: grupoId },
      select: {
        id: true,
        seccion: true,
        cupo_max: true,
        _count: {
          select: { inscripciones: true }
        }
      }
    });

    if (!grupo) {
      throw new Error('Grupo no encontrado');
    }

    const disponibles = Math.max(grupo.cupo_max - grupo._count.inscripciones, 0);
    const porcentaje = Math.round((grupo._count.inscripciones / grupo.cupo_max) * 100);

    return {
      id: grupo.id,
      seccion: grupo.seccion,
      cupo_max: grupo.cupo_max,
      inscritos: grupo._count.inscripciones,
      disponibles,
      porcentaje_ocupado: porcentaje,
      tiene_cupo: disponibles > 0,
      esta_lleno: disponibles === 0
    };
  } catch (error) {
    console.error('Error en validateGroupCapacity:', error);
    throw error;
  }
};