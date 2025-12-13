// controllers/subjectEnrollment.controller.js
import { prisma } from '../prisma.js';

// Función auxiliar para obtener materias aprobadas
const getCompletedSubjects = async (studentId, beforeDate = null) => {
  try {
    const whereCondition = {
      usuario_id: studentId
    };
    
    if (beforeDate) {
      whereCondition.grupos = {
        periodos: {
          fecha_fin: { lt: new Date(beforeDate) }
        }
      };
    }
    
    const inscripciones = await prisma.inscripciones.findMany({
      where: whereCondition,
      include: {
        grupos: {
          select: {
            materia_id: true
          }
        }
      }
    });
    
    const completedSet = new Set();
    inscripciones.forEach(inscripcion => {
      if (inscripcion.grupos && inscripcion.grupos.materia_id) {
        completedSet.add(inscripcion.grupos.materia_id);
      }
    });
    
    return completedSet;
  } catch (error) {
    console.error('Error en getCompletedSubjects:', error);
    return new Set();
  }
};

export const getAvailableSubjects = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { periodoId } = req.query;

    console.log('📡 [DEBUG] Solicitud de materias:', {
      studentId,
      periodoId,
      user: req.user
    });

    // 1. Obtener estudiante y su carrera
    const student = await prisma.usuarios.findUnique({
      where: { id: studentId },
      include: { 
        carreras: {
          select: { id: true, codigo: true, nombre: true }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ 
        success: false,
        message: 'Estudiante no encontrado' 
      });
    }

    if (!student.carrera_id) {
      return res.status(400).json({ 
        success: false,
        message: 'Estudiante no tiene carrera asignada' 
      });
    }

    console.log('👨‍🎓 [DEBUG] Estudiante:', {
      id: student.id,
      nombre: student.nombre,
      carrera_id: student.carrera_id
    });

    // 2. Obtener periodo activo o especificado
    let period;
    if (periodoId) {
      period = await prisma.periodos.findUnique({ 
        where: { id: String(periodoId) } 
      });
    } else {
      period = await prisma.periodos.findFirst({ 
        where: { activo: true } 
      });
    }

    if (!period) {
      return res.status(404).json({ 
        success: false,
        message: 'No hay periodo activo disponible' 
      });
    }

    console.log('📅 [DEBUG] Periodo:', {
      id: period.id,
      nombre: period.nombre,
      activo: period.activo
    });

    // 3. Obtener todas las materias de la carrera
    const allSubjects = await prisma.materias.findMany({
      where: { 
        carrera_id: student.carrera_id
      },
      include: {
        grupos: {
          where: { periodo_id: period.id },
          include: {
            usuarios: {
              select: { id: true, nombre: true, email: true }
            },
            _count: {
              select: { inscripciones: true }
            },
            horario_detalle: {
              include: {
                bloques_horarios: {
                  select: {
                    id: true,
                    dia: true,
                    hora_inicio: true,
                    hora_fin: true,
                    turno: true
                  }
                }
              }
            }
          }
        },
        prerrequisitos_prerrequisitos_materia_idTomaterias: {
          include: {
            materias_prerrequisitos_requiere_idTomaterias: {
              select: { id: true, codigo: true, nombre: true }
            }
          }
        }
      }
    });

    console.log('📚 [DEBUG] Total materias encontradas:', allSubjects.length);

    // 4. Obtener materias ya aprobadas
    const completedSubjects = await getCompletedSubjects(studentId, period.fecha_inicio);
    console.log('✅ [DEBUG] Materias aprobadas:', completedSubjects.size);

    // 5. Obtener materias ya seleccionadas para este periodo
    const existingSelections = await prisma.selecciones_materia.findMany({
      where: {
        usuario_id: studentId,
        periodo_id: period.id
      },
      select: { materia_id: true }
    });

    const selectedSubjectIds = new Set(
      existingSelections.map(s => s.materia_id)
    );
    console.log('📝 [DEBUG] Materias ya seleccionadas:', selectedSubjectIds.size);

    // 6. Evaluar cada materia
    const evaluatedSubjects = allSubjects.map(subject => {
      // Filtrar grupos que tienen cupo disponible
      const gruposDisponibles = subject.grupos.filter(grupo => {
        const inscritos = grupo._count?.inscripciones || 0;
        const cupoMax = grupo.cupo_max || 0;
        return cupoMax > inscritos;
      });

      // Obtener prerrequisitos
      const prerrequisitos = subject.prerrequisitos_prerrequisitos_materia_idTomaterias
        .map(p => p.materias_prerrequisitos_requiere_idTomaterias)
        .filter(Boolean);

      // Verificar si todos los prerrequisitos están cumplidos
      const prerrequisitosCumplidos = prerrequisitos.length === 0 || 
        prerrequisitos.every(req => completedSubjects.has(req.id));

      // Materia disponible si tiene grupos y cumple prerrequisitos
      const disponible = gruposDisponibles.length > 0 && prerrequisitosCumplidos;
      
      // Formatear datos de grupos disponibles
      const detallesGrupos = gruposDisponibles.map(grupo => {
        const inscritos = grupo._count?.inscripciones || 0;
        const cupoMax = grupo.cupo_max || 0;
        
        return {
          id: grupo.id,
          seccion: grupo.seccion || 'N/A',
          profesor: grupo.usuarios ? {
            id: grupo.usuarios.id,
            nombre: grupo.usuarios.nombre,
            email: grupo.usuarios.email
          } : null,
          cupo_max: cupoMax,
          inscritos: inscritos,
          disponibles: Math.max(cupoMax - inscritos, 0),
          horarios: (grupo.horario_detalle || []).map(hd => ({
            bloque_id: hd.bloques_horarios?.id,
            dia: hd.bloques_horarios?.dia,
            hora_inicio: hd.bloques_horarios?.hora_inicio,
            hora_fin: hd.bloques_horarios?.hora_fin,
            turno: hd.bloques_horarios?.turno
          })).filter(h => h.dia) // Filtrar horarios válidos
        };
      });

      return {
        id: subject.id,
        codigo: subject.codigo || 'N/A',
        nombre: subject.nombre || 'Sin nombre',
        creditos: subject.creditos || 0,
        seleccionada: selectedSubjectIds.has(subject.id),
        disponible,
        prerrequisitos: prerrequisitos.map(p => ({
          id: p.id,
          codigo: p.codigo || 'N/A',
          nombre: p.nombre || 'Sin nombre',
          cumplido: completedSubjects.has(p.id)
        })),
        grupos_disponibles: gruposDisponibles.length,
        detalles_grupos: detallesGrupos,
        restricciones: {
          sin_cupo: gruposDisponibles.length === 0,
          prerrequisitos_pendientes: !prerrequisitosCumplidos,
          conflictos: false // Se evaluará después
        }
      };
    });

    return res.status(200).json({
      success: true,
      periodo: {
        id: period.id,
        nombre: period.nombre,
        fecha_inicio: period.fecha_inicio,
        fecha_fin: period.fecha_fin,
        activo: period.activo
      },
      carrera: student.carreras,
      materias: evaluatedSubjects,
      total_materias: evaluatedSubjects.length,
      disponibles: evaluatedSubjects.filter(m => m.disponible).length,
      seleccionadas: Array.from(selectedSubjectIds).length
    });

  } catch (error) {
    console.error('❌ Error obteniendo materias disponibles:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener materias disponibles', 
      error: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

export const selectSubjects = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { periodoId, materias } = req.body;

    console.log('📝 [DEBUG] Seleccionando materias:', {
      studentId,
      periodoId,
      materias
    });

    if (!periodoId || !materias || !Array.isArray(materias)) {
      return res.status(400).json({ 
        success: false,
        message: 'Periodo y lista de materias son requeridos' 
      });
    }

    // Verificar que el periodo exista
    const period = await prisma.periodos.findUnique({
      where: { id: String(periodoId) }
    });

    if (!period) {
      return res.status(404).json({ 
        success: false,
        message: 'Periodo no encontrado' 
      });
    }

    // Obtener materias ya seleccionadas
    const existingSelections = await prisma.selecciones_materia.findMany({
      where: {
        usuario_id: studentId,
        periodo_id: period.id
      }
    });

    // Preparar operaciones
    const operations = [];
    
    // Eliminar selecciones que ya no están en la nueva lista
    const nuevasMateriasIds = new Set(materias.map(m => String(m.id || m)));
    const eliminar = existingSelections.filter(s => 
      !nuevasMateriasIds.has(s.materia_id)
    );

    eliminar.forEach(sel => {
      operations.push(
        prisma.selecciones_materia.delete({
          where: { id: sel.id }
        })
      );
    });

    // Agregar nuevas selecciones
    for (const materiaId of nuevasMateriasIds) {
      const existe = existingSelections.find(s => s.materia_id === materiaId);
      if (!existe) {
        operations.push(
          prisma.selecciones_materia.create({
            data: {
              usuario_id: studentId,
              periodo_id: period.id,
              materia_id: materiaId
            }
          })
        );
      }
    }

    // Ejecutar transacción
    await prisma.$transaction(operations);

    return res.status(200).json({
      success: true,
      message: 'Materias seleccionadas exitosamente',
      seleccionadas: materias.length,
      periodo: period.nombre
    });

  } catch (error) {
    console.error('❌ Error seleccionando materias:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al seleccionar materias', 
      error: error.message 
    });
  }
};

export const getMySelections = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { periodoId } = req.query;

    console.log('📋 [DEBUG] Obteniendo selecciones:', {
      studentId,
      periodoId
    });

    const where = { usuario_id: studentId };
    if (periodoId) {
      where.periodo_id = String(periodoId);
    } else {
      // Buscar periodo activo
      const activePeriod = await prisma.periodos.findFirst({
        where: { activo: true }
      });
      if (activePeriod) {
        where.periodo_id = activePeriod.id;
      }
    }

    const selections = await prisma.selecciones_materia.findMany({
      where,
      include: {
        materias: {
          select: {
            id: true,
            codigo: true,
            nombre: true,
            creditos: true
          }
        },
        periodos: {
          select: {
            id: true,
            nombre: true,
            fecha_inicio: true,
            fecha_fin: true
          }
        }
      },
      orderBy: { prioridad: 'asc' }
    });

    return res.status(200).json({
      success: true,
      selecciones: selections,
      total_creditos: selections.reduce((sum, sel) => 
        sum + (sel.materias?.creditos || 0), 0
      )
    });

  } catch (error) {
    console.error('❌ Error obteniendo selecciones:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al obtener selecciones', 
      error: error.message 
    });
  }
};

export const updateSelectionPriority = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { seleccionId } = req.params;
    const { prioridad } = req.body;

    if (prioridad < 1 || prioridad > 3) {
      return res.status(400).json({ 
        success: false,
        message: 'La prioridad debe estar entre 1 y 3' 
      });
    }

    const selection = await prisma.selecciones_materia.findFirst({
      where: {
        id: String(seleccionId),
        usuario_id: studentId
      }
    });

    if (!selection) {
      return res.status(404).json({ 
        success: false,
        message: 'Selección no encontrada' 
      });
    }

    const updated = await prisma.selecciones_materia.update({
      where: { id: String(seleccionId) },
      data: { prioridad }
    });

    return res.status(200).json({
      success: true,
      message: 'Prioridad actualizada',
      seleccion: updated
    });

  } catch (error) {
    console.error('❌ Error actualizando prioridad:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al actualizar prioridad', 
      error: error.message 
    });
  }
};

export const clearSelections = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { periodoId } = req.body;

    const where = { usuario_id: studentId };
    if (periodoId) {
      where.periodo_id = String(periodoId);
    }

    const deleted = await prisma.selecciones_materia.deleteMany({
      where
    });

    return res.status(200).json({
      success: true,
      message: 'Selecciones eliminadas',
      eliminadas: deleted.count
    });

  } catch (error) {
    console.error('❌ Error eliminando selecciones:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Error al eliminar selecciones', 
      error: error.message 
    });
  }
};