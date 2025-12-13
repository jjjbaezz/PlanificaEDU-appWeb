import { prisma } from '../prisma.js';

export const getAvailableSubjects = async (userId, periodoId, options = {}) => {
  try {
    // 1. Obtener información del estudiante
    const estudiante = await prisma.usuarios.findUnique({
      where: { id: userId },
      select: {
        id: true,
        carrera_id: true,
        inscripciones: {
          select: {
            grupos: {
              select: {
                materia_id: true,
                periodos: {
                  select: {
                    fecha_fin: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    // 2. Obtener periodo
    const periodo = await prisma.periodos.findUnique({
      where: { id: periodoId }
    });

    if (!periodo) {
      throw new Error('Periodo no encontrado');
    }

    // 3. Obtener todas las materias de la carrera del estudiante
const materiasCarrera = await prisma.materias.findMany({
  where: {
    carrera_id: estudiante.carrera_id
  },
  include: {
    grupos: {
      where: {
        periodo_id: periodoId,
        cupo_max: {
          gt: 0 // Solo grupos con cupo
        }
      },
      include: {
        _count: {
          select: { inscripciones: true }
        },
        usuarios: { // Esto traerá la información del profesor
          select: {
            id: true,
            nombre: true,
            email: true
          }
        }
      }
    }
  }
});

    // 4. Obtener materias ya cursadas (inscritas y finalizadas)
    const materiasCursadasIds = estudiante.inscripciones
      .filter(inscripcion => 
        new Date(inscripcion.grupos.periodos.fecha_fin) < new Date()
      )
      .map(inscripcion => inscripcion.grupos.materia_id);

    // 5. Obtener selecciones actuales del periodo
    const seleccionesActuales = await prisma.selecciones_materia.findMany({
      where: {
        usuario_id: userId,
        periodo_id: periodoId
      },
      select: {
        materia_id: true,
        prioridad: true
      }
    });

    const seleccionadasIds = seleccionesActuales.map(s => s.materia_id);

    // 6. Obtener prerrequisitos de todas las materias
    const materiasConPrerrequisitos = await Promise.all(
      materiasCarrera.map(async (materia) => {
        // Obtener prerrequisitos directos
        const prerrequisitos = await prisma.prerrequisitos.findMany({
          where: {
            materia_id: materia.id
          },
          include: {
            materias_prerrequisitos_requiere_idTomaterias: {
              select: {
                id: true,
                codigo: true,
                nombre: true
              }
            }
          }
        });

        // Verificar si los prerrequisitos están cumplidos
        const prerrequisitosInfo = prerrequisitos.map(prereq => {
          const cumplido = materiasCursadasIds.includes(prereq.requiere_id);
          return {
            id: prereq.requiere_id,
            codigo: prereq.materias_prerrequisitos_requiere_idTomaterias.codigo,
            nombre: prereq.materias_prerrequisitos_requiere_idTomaterias.nombre,
            cumplido
          };
        });

        // Calcular nivel de la materia basado en prerrequisitos
        const nivel = prerrequisitosInfo.length > 0 
          ? prerrequisitosInfo.filter(p => !p.cumplido).length === 0 ? 1 : 2
          : 0; // 0 = sin prerrequisitos, 1 = prerrequisitos cumplidos, 2 = prerrequisitos pendientes

        // Verificar disponibilidad
        const disponible = 
          !materiasCursadasIds.includes(materia.id) && // No la ha cursado
          nivel !== 2 && // No tiene prerrequisitos pendientes
          materia.grupos.length > 0; // Tiene grupos disponibles

        // Calcular grupos disponibles
        const grupos_disponibles = materia.grupos
          .filter(grupo => grupo.cupo_max > (grupo._count?.inscripciones || 0))
          .length;

        return {
          id: materia.id,
          codigo: materia.codigo,
          nombre: materia.nombre,
          creditos: materia.creditos,
          disponible,
          seleccionada: seleccionadasIds.includes(materia.id),
          nivel,
          grupos_disponibles,
          prerrequisitos: prerrequisitosInfo,
          detalles_grupos: materia.grupos.map(grupo => ({
            id: grupo.id,
            seccion: grupo.seccion,
            cupo_max: grupo.cupo_max,
            disponibles: grupo.cupo_max - (grupo._count?.inscripciones || 0),
            inscritos: grupo._count?.inscripciones || 0
          }))
        };
      })
    );

    // 7. Ordenar materias: primero disponibles, luego por nivel (menor primero)
    const materiasOrdenadas = materiasConPrerrequisitos.sort((a, b) => {
      // Primero por disponibilidad
      if (a.disponible && !b.disponible) return -1;
      if (!a.disponible && b.disponible) return 1;
      
      // Luego por nivel (menor primero)
      if (a.nivel !== b.nivel) return a.nivel - b.nivel;
      
      // Finalmente por créditos (menor primero)
      return a.creditos - b.creditos;
    });

    // 8. Obtener información de la carrera
    const carrera = estudiante.carrera_id ? await prisma.carreras.findUnique({
      where: { id: estudiante.carrera_id }
    }) : null;

    // 9. Calcular estadísticas
    const disponibles = materiasOrdenadas.filter(m => m.disponible).length;
    const seleccionadas = seleccionesActuales.length;

    return {
      success: true,
      periodo: {
        id: periodo.id,
        nombre: periodo.nombre,
        activo: periodo.activo
      },
      carrera,
      materias: materiasOrdenadas,
      estadisticas: {
        total: materiasOrdenadas.length,
        disponibles,
        seleccionadas,
        creditos_seleccionados: seleccionesActuales.reduce((sum, seleccion) => {
          const materia = materiasOrdenadas.find(m => m.id === seleccion.materia_id);
          return sum + (materia?.creditos || 0);
        }, 0)
      }
    };

  } catch (error) {
    console.error('Error en getAvailableSubjects:', error);
    throw error;
  }
};

export const saveSubjectSelections = async (userId, periodoId, materiaIds) => {
  try {
    // Validar que el usuario existe
    const usuario = await prisma.usuarios.findUnique({
      where: { id: userId }
    });

    if (!usuario) {
      throw new Error('Usuario no encontrado');
    }

    // Validar que el periodo existe
    const periodo = await prisma.periodos.findUnique({
      where: { id: periodoId }
    });

    if (!periodo) {
      throw new Error('Periodo no encontrado');
    }

    // Validar que las materias existen y son de la carrera del estudiante
    const materias = await prisma.materias.findMany({
      where: {
        id: { in: materiaIds },
        carrera_id: usuario.carrera_id
      }
    });

    if (materias.length !== materiaIds.length) {
      throw new Error('Algunas materias no existen o no corresponden a tu carrera');
    }

    // Obtener información de disponibilidad para validar
    const disponibilidadInfo = await getAvailableSubjects(userId, periodoId);
    
    // Verificar que todas las materias seleccionadas estén disponibles
    const materiasNoDisponibles = materiaIds.filter(materiaId => {
      const materiaInfo = disponibilidadInfo.materias.find(m => m.id === materiaId);
      return !materiaInfo?.disponible;
    });

    if (materiasNoDisponibles.length > 0) {
      throw new Error('Algunas materias seleccionadas no están disponibles');
    }

    // Calcular total de créditos
    const totalCreditos = materias.reduce((sum, materia) => sum + materia.creditos, 0);
    
    // Validar límite de créditos (ejemplo: máximo 24 créditos por periodo)
    const MAX_CREDITOS = 24;
    if (totalCreditos > MAX_CREDITOS) {
      throw new Error(`Excedes el límite de ${MAX_CREDITOS} créditos por periodo`);
    }

    // Transacción para eliminar selecciones anteriores y crear nuevas
    const result = await prisma.$transaction(async (tx) => {
      // 1. Eliminar selecciones anteriores del usuario en este periodo
      await tx.selecciones_materia.deleteMany({
        where: {
          usuario_id: userId,
          periodo_id: periodoId
        }
      });

      // 2. Crear nuevas selecciones
      const seleccionesCreadas = await Promise.all(
        materiaIds.map((materiaId, index) => {
          return tx.selecciones_materia.create({
            data: {
              usuario_id: userId,
              periodo_id: periodoId,
              materia_id: materiaId,
              prioridad: index + 1 // 1 = más alta prioridad
            }
          });
        })
      );

      return seleccionesCreadas;
    });

    return {
      success: true,
      message: `Selección guardada exitosamente (${materiaIds.length} materias, ${totalCreditos} créditos)`,
      selecciones: result,
      totalCreditos
    };

  } catch (error) {
    console.error('Error en saveSubjectSelections:', error);
    throw error;
  }
};

export const getCurrentSelections = async (userId, periodoId) => {
  try {
    const selecciones = await prisma.selecciones_materia.findMany({
      where: {
        usuario_id: userId,
        periodo_id: periodoId
      },
      include: {
        materias: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            creditos: true
          }
        }
      },
      orderBy: {
        prioridad: 'asc'
      }
    });

    return {
      success: true,
      selecciones: selecciones.map(s => ({
        id: s.id,
        materia_id: s.materia_id,
        prioridad: s.prioridad,
        materia: s.materias
      })),
      total: selecciones.length,
      totalCreditos: selecciones.reduce((sum, s) => sum + s.materias.creditos, 0)
    };

  } catch (error) {
    console.error('Error en getCurrentSelections:', error);
    throw error;
  }
};

export const clearSelections = async (userId, periodoId) => {
  try {
    const deleted = await prisma.selecciones_materia.deleteMany({
      where: {
        usuario_id: userId,
        periodo_id: periodoId
      }
    });

    return {
      success: true,
      message: `${deleted.count} selecciones eliminadas`,
      count: deleted.count
    };

  } catch (error) {
    console.error('Error en clearSelections:', error);
    throw error;
  }
};

export const getSubjectRecommendations = async (userId, periodoId) => {
  try {
    const disponibilidad = await getAvailableSubjects(userId, periodoId);
    
    // Filtrar solo materias disponibles
    const materiasDisponibles = disponibilidad.materias.filter(m => m.disponible);
    
    // Recomendar: materias sin prerrequisitos o con todos cumplidos, ordenadas por créditos
    const recomendaciones = materiasDisponibles
      .filter(m => m.nivel === 0 || m.nivel === 1)
      .sort((a, b) => {
        // Priorizar materias con menos créditos primero
        if (a.creditos !== b.creditos) {
          return a.creditos - b.creditos;
        }
        // Si mismos créditos, priorizar las sin prerrequisitos
        return a.nivel - b.nivel;
      })
      .slice(0, 5); // Top 5 recomendaciones

    return {
      success: true,
      recomendaciones,
      criterio: "Materias con prerrequisitos cumplidos y menor carga crediticia primero"
    };
  } catch (error) {
    console.error('Error en getSubjectRecommendations:', error);
    throw error;
  }
};