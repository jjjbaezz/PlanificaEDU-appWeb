import { ScheduleGenerator } from '../services/scheduleGeneration.service.js';
import { prisma } from '../prisma.js';

const httpError = (status, message) => {
  const error = new Error(message);
  error.status = status;
  return error;
};

export const generateSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { periodoId } = req.body;

    if (!periodoId) {
      throw httpError(400, 'El campo periodoId es requerido');
    }

    console.log('🔄 Iniciando generación de horario para:', {
      userId,
      periodoId
    });

    // Verificar que el usuario tenga selecciones
    const selecciones = await prisma.selecciones_materia.count({
      where: {
        usuario_id: userId,
        periodo_id: periodoId
      }
    });

    if (selecciones === 0) {
      throw httpError(400, 'No tienes materias seleccionadas para este periodo');
    }

    console.log(`📝 ${selecciones} materias seleccionadas`);

    // Generar horario
    const generator = new ScheduleGenerator(userId, periodoId);
    const horario = await generator.generate();

    console.log('✅ Horario generado exitosamente:', {
      id: horario.id,
      score: horario.score,
      grupos: horario.gruposSeleccionados
    });

    return res.status(200).json({
      success: true,
      message: 'Horario generado exitosamente',
      horario: {
        id: horario.id,
        periodo_id: horario.periodo_id,
        estado: horario.estado,
        score: horario.score ? Number(horario.score):0,
        creado_por: horario.creado_por,
        created_at: horario.created_at
      }
    });

  } catch (error) {
    console.error('❌ Error generando horario:', error);
    
    let mensaje = error.message || 'Error al generar horario';
    let status = error.status || 500;
    
    // Mensajes más específicos
    if (mensaje.includes('No hay suficientes grupos')) {
      status = 400;
      mensaje = 'Algunas materias no tienen grupos disponibles. Revisa tus selecciones.';
    } else if (mensaje.includes('No se pudo generar un horario válido')) {
      status = 400;
      mensaje = 'No se pudo encontrar un horario sin conflictos. Intenta con menos materias o diferentes selecciones.';
    }
    
    return res.status(status).json({
      success: false,
      message: mensaje,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

export const getMySchedules = async (req, res) => {
  try {
    const userId = req.user.id;
    const { periodoId } = req.query;

    const where = { creado_por: userId };
    if (periodoId) where.periodo_id = periodoId;

    const schedules = await prisma.horarios.findMany({
      where,
      include: {
        horario_detalle: {
          include: {
            grupos: {
              include: {
                materias: true,
                usuarios: true
              }
            },
            bloques_horarios: true,
            aulas: true
          }
        },
        periodos: true
      },
      orderBy: { created_at: 'desc' }
    });

    return res.status(200).json({
      success: true,
      schedules
    });

  } catch (error) {
    console.error('Error obteniendo horarios:', error);
    return res.status(500).json({
      success: false,
      message: 'Error al obtener horarios'
    });
  }
};


//xd

export const duplicateSchedule = async (req, res) => {
  try {
    const userId = req.user.id;
    const { horarioId } = req.body;

    if (!horarioId) {
      throw httpError(400, 'El campo horarioId es requerido');
    }

    // Obtener el horario original
    const horarioOriginal = await prisma.horarios.findUnique({
      where: { id: horarioId },
      include: {
        horario_detalle: true
      }
    });

    if (!horarioOriginal) {
      throw httpError(404, 'Horario no encontrado');
    }

    if (horarioOriginal.creado_por !== userId) {
      throw httpError(403, 'No tienes permiso para duplicar este horario');
    }

    // Crear nuevo horario
    const nuevoHorario = await prisma.horarios.create({
      data: {
        periodo_id: horarioOriginal.periodo_id,
        estado: 'DONE',
        score: horarioOriginal.score,
        creado_por: userId
      }
    });

    // Duplicar los detalles del horario
    if (horarioOriginal.horario_detalle.length > 0) {
      const nuevosDetalles = horarioOriginal.horario_detalle.map(detalle => ({
        horario_id: nuevoHorario.id,
        grupo_id: detalle.grupo_id,
        aula_id: detalle.aula_id,
        bloque_id: detalle.bloque_id
      }));

      await prisma.horario_detalle.createMany({
        data: nuevosDetalles
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Horario duplicado exitosamente',
      nuevoHorarioId: nuevoHorario.id
    });

  } catch (error) {
    console.error('Error duplicando horario:', error);
    const status = error.status || 500;
    
    return res.status(status).json({
      success: false,
      message: error.message || 'Error al duplicar horario'
    });
  }
};
