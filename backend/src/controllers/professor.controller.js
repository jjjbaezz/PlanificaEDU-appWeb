import { prisma } from '../prisma.js';



// GET /professors/:id/availability
export const getAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuarios.findUnique({
      where: { id },
      include: {
        profesores: true 
      }
    });

    if (!usuario || !usuario.profesores) {
      return res.status(404).json({ message: 'Profesor no encontrado' });
    }

    const bloques = await prisma.bloques_horarios.findMany({
      include: {
        disponibilidad_profesor: {
          where: { profesor_id: id } 
        }
      },
      orderBy: [
        { dia: 'asc' },
        { hora_inicio: 'asc' }
      ]
    });

    const disponibilidad = bloques.map(bloque => ({
      bloque_id: bloque.id,
      dia: bloque.dia,
      hora_inicio: bloque.hora_inicio,
      hora_fin: bloque.hora_fin,
      turno: bloque.turno,
      estado: bloque.disponibilidad_profesor[0]?.estado || 'DISPONIBLE'
    }));

    return res.json({ 
      profesor: {
        id: usuario.profesores.id,
        usuario_id: usuario.id,
        nombre: usuario.nombre,
        carga_max_horas: usuario.profesores.carga_max_horas
      },
      disponibilidad 
    });

  } catch (error) {
    console.error('Error obteniendo disponibilidad:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /professors/:id/availability
export const updateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { bloque_id, estado } = req.body;

    if (!['DISPONIBLE', 'NO_DISPONIBLE', 'OCUPADO'].includes(estado)) {
      return res.status(400).json({ message: 'Estado inválido' });
    }

    if (req.user.id !== id && req.user.rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Sin permisos para modificar esta disponibilidad' });
    }

    const bloque = await prisma.bloques_horarios.findUnique({
      where: { id: bloque_id }
    });

    if (!bloque) {
      return res.status(404).json({ message: 'Bloque horario no encontrado' });
    }

    const disponibilidad = await prisma.disponibilidad_profesor.upsert({
      where: {
        uq_disp_prof: { 
          profesor_id: id,
          bloque_id: bloque_id
        }
      },
      create: {
        profesor_id: id,
        bloque_id: bloque_id,
        estado: estado
      },
      update: {
        estado: estado
      },
      include: {
        bloque_horario: true
      }
    });

    return res.json({ disponibilidad });

  } catch (error) {
    console.error('Error actualizando disponibilidad:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};


export const bulkUpdateAvailability = async (req, res) => {
  try {
    const { id } = req.params;
    const { updates } = req.body; 

    // Verificar autorización
    if (req.user.id !== id && req.user.rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Sin permisos' });
    }

    const profesor = await prisma.usuarios.findUnique({
      where: { id },
      include: { profesores: true }
    });

    if (!profesor || !profesor.profesores) {
      return res.status(404).json({ message: 'Profesor no encontrado' });
    }

    const results = await Promise.all(
      updates.map(async ({ bloque_id, estado }) => {
        return prisma.disponibilidad_profesor.upsert({
          where: {
            uq_disp_prof: {
              profesor_id: id,
              bloque_id: bloque_id
            }
          },
          create: {
            profesor_id: id,
            bloque_id: bloque_id,
            estado: estado
          },
          update: {
            estado: estado
          }
        });
      })
    );

    return res.json({ 
      message: `${results.length} bloques actualizados`,
      updates: results.length
    });

  } catch (error) {
    console.error('Error en actualización masiva:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};



// GET /professors/:id/profile
export const getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const usuario = await prisma.usuarios.findUnique({
      where: { id },
      include: {
        profesores: true,
        carrera: true
      }
    });

    if (!usuario || !usuario.profesores) {
      return res.status(404).json({ message: 'Profesor no encontrado' });
    }

    const { password_hash, ...usuarioSafe } = usuario;

    return res.json({
      id: usuario.profesores.id,
      usuario_id: usuario.id,
      carga_max_horas: usuario.profesores.carga_max_horas,
      usuario: usuarioSafe
    });

  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /professors/:id/profile
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.params;
    const { carga_max_horas, nombre, carrera_id } = req.body;

    if (req.user.id !== id && req.user.rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Sin permisos' });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id },
      include: { profesores: true }
    });

    if (!usuario || !usuario.profesores) {
      return res.status(404).json({ message: 'Profesor no encontrado' });
    }

    if (carga_max_horas !== undefined) {
      await prisma.profesores.update({
        where: { usuario_id: id },
        data: { carga_max_horas }
      });
    }

    const updateData = {};
    if (nombre) updateData.nombre = nombre;
    if (carrera_id) updateData.carrera_id = carrera_id;

    if (Object.keys(updateData).length > 0) {
      await prisma.usuarios.update({
        where: { id },
        data: updateData
      });
    }
    const updated = await prisma.usuarios.findUnique({
      where: { id },
      include: {
        profesores: true,
        carrera: true
      }
    });

    return res.json({ profesor: updated });

  } catch (error) {
    console.error('Error actualizando perfil:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};



// GET /professors/:id/schedule
export const getSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { periodo_id } = req.query;

    if (!periodo_id) {
      return res.status(400).json({ message: 'periodo_id es requerido' });
    }

    const usuario = await prisma.usuarios.findUnique({
      where: { id },
      include: { profesores: true }
    });

    if (!usuario || !usuario.profesores) {
      return res.status(404).json({ message: 'Profesor no encontrado' });
    }

    const horarios = await prisma.horario_detalle.findMany({
      where: {
        horario: { periodo_id },
        grupo: { profesor_id: id }
      },
      include: {
        grupo: {
          include: {
            materia: true,
            periodo: true
          }
        },
        aula: {
          include: { 
            edificio: true 
          }
        },
        bloque_horario: true,
        horario: true
      },
      orderBy: [
        { bloque_horario: { dia: 'asc' } },
        { bloque_horario: { hora_inicio: 'asc' } }
      ]
    });

    const schedule = horarios.map(h => ({
      id: h.id,
      materia: h.grupo.materia.nombre,
      codigo_materia: h.grupo.materia.codigo,
      seccion: h.grupo.seccion,
      aula: `${h.aula.edificio.codigo}-${h.aula.codigo}`,
      capacidad_aula: h.aula.capacidad,
      tipo_aula: h.aula.tipo,
      dia: h.bloque_horario.dia,
      hora_inicio: h.bloque_horario.hora_inicio,
      hora_fin: h.bloque_horario.hora_fin,
      turno: h.bloque_horario.turno,
      periodo: h.grupo.periodo.nombre,
      estado_horario: h.horario.estado,
      cupo_max: h.grupo.cupo_max
    }));

    return res.json({ horarios: schedule });

  } catch (error) {
    console.error('Error obteniendo horario:', error);
    return res.status(500).json({ message: 'Error interno del servidor' });
  }
};



