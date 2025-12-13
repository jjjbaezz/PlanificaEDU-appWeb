// controllers/schedule.controller.js
import { prisma } from '../prisma.js';
import ScheduleGenerator from '../services/scheduleGenerator.service.js';

// GET /schedules - Listar horarios generados
export const listSchedules = async (req, res) => {
  try {
    const { periodo_id, estado, page = 1, limit = 20 } = req.query;
    
    const where = {};
    if (periodo_id) where.periodo_id = periodo_id;
    if (estado) where.estado = estado;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [horarios, total] = await Promise.all([
      prisma.horarios.findMany({
        where,
        include: {
          periodos: true,
          usuarios: { select: { id: true, nombre: true, email: true } },
          _count: { select: { horario_detalle: true } }
        },
        orderBy: { created_at: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.horarios.count({ where })
    ]);
    
    return res.status(200).json({
      horarios,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error listando horarios:', err);
    return res.status(500).json({ 
      message: 'Error al listar horarios', 
      error: err.message 
    });
  }
};

// POST /schedules/generate - Generar nuevo horario
export const generateSchedule = async (req, res) => {
  try {
    const { periodo_id, options } = req.body;
    
    if (!periodo_id) {
      return res.status(400).json({ message: 'El periodo_id es obligatorio' });
    }
    
    // Verificar que el periodo exista
    const periodo = await prisma.periodos.findUnique({
      where: { id: periodo_id }
    });
    
    if (!periodo) {
      return res.status(404).json({ message: 'Periodo no encontrado' });
    }
    
    // Verificar que haya grupos para el periodo
    const gruposCount = await prisma.grupos.count({
      where: { periodo_id }
    });
    
    if (gruposCount === 0) {
      return res.status(400).json({ 
        message: 'No hay grupos asignados para este periodo' 
      });
    }
    
    // Crear registro de horario en estado "RUNNING"
    const horario = await prisma.horarios.create({
      data: {
        periodo_id,
        estado: 'RUNNING',
        creado_por: req.user?.id || null
      }
    });
    
    // Ejecutar generación en segundo plano
    generateAsync(horario.id, periodo_id, options, req.user?.id);
    
    return res.status(202).json({
      message: 'Generación de horario iniciada',
      horario,
      jobId: horario.id
    });
  } catch (err) {
    console.error('Error iniciando generación:', err);
    return res.status(500).json({ 
      message: 'Error al iniciar generación', 
      error: err.message 
    });
  }
};

// Función asíncrona para generación
async function generateAsync(horarioId, periodoId, options, userId) {
  try {
    const generator = new ScheduleGenerator(periodoId, {
      ...options,
      userId
    });
    
    const solution = await generator.run();
    await generator.saveSolution(solution);
    
    // Actualizar estado a DONE
    await prisma.horarios.update({
      where: { id: horarioId },
      data: { 
        estado: 'DONE',
        score: solution.score
      }
    });
    
    console.log(`Horario ${horarioId} generado exitosamente`);
  } catch (error) {
    console.error(`Error generando horario ${horarioId}:`, error);
    
    // Actualizar estado a FAILED
    await prisma.horarios.update({
      where: { id: horarioId },
      data: { 
        estado: 'FAILED'
      }
    });
  }
}

// GET /schedules/:id - Obtener horario específico
export const getSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    const horario = await prisma.horarios.findUnique({
      where: { id },
      include: {
        periodos: true,
        usuarios: { select: { id: true, nombre: true, email: true } },
        horario_detalle: {
          include: {
            grupos: {
              include: {
                materias: true,
                usuarios: { select: { id: true, nombre: true } },
                _count: { select: { inscripciones: true } }
              }
            },
            aulas: {
              include: { edificios: true }
            },
            bloques_horarios: true
          }
        }
      }
    });
    
    if (!horario) {
      return res.status(404).json({ message: 'Horario no encontrado' });
    }
    
    // Formatear respuesta para frontend
    const formatted = {
      ...horario,
      detalle_agrupado: formatScheduleDetails(horario.horario_detalle)
    };
    
    return res.status(200).json({ horario: formatted });
  } catch (err) {
    console.error('Error obteniendo horario:', err);
    return res.status(500).json({ 
      message: 'Error al obtener horario', 
      error: err.message 
    });
  }
};

// Función para formatear detalles del horario
function formatScheduleDetails(detalles) {
  const agrupado = {};
  
  detalles.forEach(detalle => {
    const clave = `${detalle.bloques_horarios.dia}_${detalle.aula_id}`;
    
    if (!agrupado[clave]) {
      agrupado[clave] = {
        dia: detalle.bloques_horarios.dia,
        aula: detalle.aulas,
        bloques: []
      };
    }
    
    agrupado[clave].bloques.push({
      hora_inicio: detalle.bloques_horarios.hora_inicio,
      hora_fin: detalle.bloques_horarios.hora_fin,
      grupo: detalle.grupos,
      turno: detalle.bloques_horarios.turno
    });
  });
  
  // Ordenar bloques por hora
  Object.values(agrupado).forEach(item => {
    item.bloques.sort((a, b) => 
      new Date(a.hora_inicio) - new Date(b.hora_inicio));
  });
  
  return Object.values(agrupado);
}

// GET /schedules/:id/conflicts - Analizar conflictos del horario
export const analyzeConflicts = async (req, res) => {
  try {
    const { id } = req.params;
    
    const horario = await prisma.horarios.findUnique({
      where: { id },
      include: {
        horario_detalle: {
          include: {
            grupos: {
              include: {
                usuarios: true,
                materias: true
              }
            },
            aulas: true,
            bloques_horarios: true
          }
        }
      }
    });
    
    if (!horario) {
      return res.status(404).json({ message: 'Horario no encontrado' });
    }
    
    const conflicts = findConflicts(horario.horario_detalle);
    
    return res.status(200).json({
      horario_id: id,
      total_asignaciones: horario.horario_detalle.length,
      conflictos: conflicts,
      resumen: {
        total_conflictos: conflicts.length,
        por_tipo: conflicts.reduce((acc, conf) => {
          acc[conf.tipo] = (acc[conf.tipo] || 0) + 1;
          return acc;
        }, {})
      }
    });
  } catch (err) {
    console.error('Error analizando conflictos:', err);
    return res.status(500).json({ 
      message: 'Error al analizar conflictos', 
      error: err.message 
    });
  }
};

// Función para encontrar conflictos
function findConflicts(detalles) {
  const conflicts = [];
  const profesorBloques = {};
  const aulaBloques = {};
  
  // Primera pasada: registrar asignaciones
  detalles.forEach((detalle, index) => {
    const claveBloque = detalle.bloque_id;
    const profesorId = detalle.grupos.profesor_id;
    const aulaId = detalle.aula_id;
    
    // Registrar profesor en bloque
    if (!profesorBloques[claveBloque]) profesorBloques[claveBloque] = [];
    profesorBloques[claveBloque].push({
      detalleIndex: index,
      profesorId,
      grupo: detalle.grupos
    });
    
    // Registrar aula en bloque
    if (!aulaBloques[claveBloque]) aulaBloques[claveBloque] = [];
    aulaBloques[claveBloque].push({
      detalleIndex: index,
      aulaId,
      grupo: detalle.grupos
    });
  });
  
  // Segunda pasada: detectar conflictos
  Object.entries(profesorBloques).forEach(([bloqueId, asignaciones]) => {
    if (asignaciones.length > 1) {
      // Conflicto: mismo profesor en mismo bloque
      conflicts.push({
        tipo: 'PROFESOR_CONFLICTO',
        bloque_id: bloqueId,
        profesor_id: asignaciones[0].profesorId,
        grupos_involucrados: asignaciones.map(a => ({
          grupo_id: a.grupo.id,
          materia: a.grupo.materias.nombre,
          seccion: a.grupo.seccion
        })),
        severidad: 'ALTA'
      });
    }
  });
  
  Object.entries(aulaBloques).forEach(([bloqueId, asignaciones]) => {
    if (asignaciones.length > 1) {
      // Conflicto: misma aula en mismo bloque
      conflicts.push({
        tipo: 'AULA_CONFLICTO',
        bloque_id: bloqueId,
        aula_id: asignaciones[0].aulaId,
        grupos_involucrados: asignaciones.map(a => ({
          grupo_id: a.grupo.id,
          materia: a.grupo.materias.nombre,
          seccion: a.grupo.seccion
        })),
        severidad: 'ALTA'
      });
    }
  });
  
  // Verificar capacidad de aulas
  detalles.forEach(detalle => {
    const capacidad = detalle.aulas.capacidad;
    const inscritos = detalle.grupos._count?.inscripciones || 0;
    
    if (inscritos > capacidad) {
      conflicts.push({
        tipo: 'CAPACIDAD_EXCEDIDA',
        grupo_id: detalle.grupos.id,
        aula_id: detalle.aula_id,
        capacidad,
        inscritos,
        diferencia: inscritos - capacidad,
        severidad: 'MEDIA'
      });
    }
  });
  
  return conflicts;
}

// DELETE /schedules/:id - Eliminar horario
export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Verificar que existe
    const horario = await prisma.horarios.findUnique({
      where: { id }
    });
    
    if (!horario) {
      return res.status(404).json({ message: 'Horario no encontrado' });
    }
    
    // No permitir eliminar si está en ejecución
    if (horario.estado === 'RUNNING') {
      return res.status(400).json({ 
        message: 'No se puede eliminar un horario en proceso de generación' 
      });
    }
    
    // Eliminar en transacción
    await prisma.$transaction([
      prisma.horario_detalle.deleteMany({
        where: { horario_id: id }
      }),
      prisma.horarios.delete({
        where: { id }
      })
    ]);
    
    return res.status(200).json({ 
      message: 'Horario eliminado correctamente' 
    });
  } catch (err) {
    console.error('Error eliminando horario:', err);
    return res.status(500).json({ 
      message: 'Error al eliminar horario', 
      error: err.message 
    });
  }
};