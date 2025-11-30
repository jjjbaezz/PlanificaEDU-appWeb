// Obtener todos los profesores
export async function getAllProfessors() {
  return await prisma.profesores.findMany();
}

// Obtener profesor por ID
export async function getProfessorById(id) {
  return await prisma.profesores.findUnique({
    where: { id }
  });
}

// Crear profesor
export async function createProfessor(data) {
  // Se espera que data contenga los datos necesarios para usuario y profesor
  // Ejemplo: { nombre, cedula, correo, telefono, carrera_id }
  // Primero crear usuario
  const usuario = await prisma.usuarios.create({
    data: {
      nombre: data.nombre,
      email: data.correo,
      rol: 'PROFESOR',
      password_hash: data.password_hash || 'temporal'
    }
  });
  // Luego crear profesor (solo campos válidos)
  const profesor = await prisma.profesores.create({
    data: {
      usuario_id: usuario.id,
      carga_max_horas: data.carga_max_horas || 20
    }
  });
  return { usuario, profesor };
}

// Actualizar profesor
export async function updateProfessor(id, data) {
  const profesor = await prisma.profesores.findUnique({ where: { id } });
  if (!profesor) throw new Error('Profesor no encontrado');
  // Actualizar profesor
  return await prisma.profesores.update({
    where: { id },
    data: {
      carga_max_horas: data.carga_max_horas
    }
  });
}

// Eliminar profesor
export async function deleteProfessor(id) {
  const profesor = await prisma.profesores.findUnique({ where: { id } });
  if (!profesor) throw new Error('Profesor no encontrado');
  // Eliminar profesor primero
  await prisma.profesores.delete({ where: { id } });
  // Intentar eliminar usuario solo si existe
  const usuario = await prisma.usuarios.findUnique({ where: { id: profesor.usuario_id } });
  if (usuario) {
    await prisma.usuarios.delete({ where: { id: profesor.usuario_id } });
  }
}
import { prisma } from '../prisma.js';

// Helper to find professor record
async function findProfessor(paramId) {
  let usuario = await prisma.usuarios.findUnique({ where: { id: paramId } });
  let profesorRecord = null;

  if (usuario) {
    profesorRecord = await prisma.profesores.findFirst({ where: { usuario_id: usuario.id } });
  } else {
    profesorRecord = await prisma.profesores.findUnique({ where: { id: paramId } });
    if (profesorRecord) {
      usuario = await prisma.usuarios.findUnique({ where: { id: profesorRecord.usuario_id } });
    }
  }

  if (!usuario || !profesorRecord) {
    const error = new Error('Profesor no encontrado');
    error.status = 404;
    throw error;
  }

  return { usuario, profesorRecord };
}

// GET availability
export async function getAvailability(paramId) {
  const { usuario, profesorRecord } = await findProfessor(paramId);
  const usuarioId = usuario.id;

  const bloques = await prisma.bloques_horarios.findMany({
    include: {
      disponibilidad_profesor: {
        where: { profesor_id: usuarioId }
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

  return {
    profesor: {
      id: profesorRecord.id,
      usuario_id: usuario.id,
      nombre: usuario.nombre,
      carga_max_horas: profesorRecord.carga_max_horas
    },
    disponibilidad
  };
}

// UPDATE availability
export async function updateAvailability(paramId, bloque_id, rawEstado, userId, userRole) {
  const normalize = s => s?.toString().trim().toUpperCase().replace(/\s+/g, '_').replace(/[^A-Z0-9_]/g, '');
  const estado = normalize(rawEstado);
  const ALLOWED = ['DISPONIBLE', 'BLOQUEADO'];

  if (!ALLOWED.includes(estado)) {
    const error = new Error(`estado inválido. Valores válidos: ${ALLOWED.join(', ')}`);
    error.status = 400;
    throw error;
  }

  const { usuario, profesorRecord } = await findProfessor(paramId);

  if (userId !== usuario.id && userRole !== 'ADMIN') {
    const error = new Error('Sin permisos');
    error.status = 403;
    throw error;
  }

  const usuarioId = usuario.id;
  const bloque = await prisma.bloques_horarios.findUnique({ where: { id: bloque_id } });
  if (!bloque) {
    const error = new Error('Bloque horario no encontrado');
    error.status = 404;
    throw error;
  }

  const existing = await prisma.disponibilidad_profesor.findFirst({
    where: { profesor_id: usuarioId, bloque_id }
  });

  let disponibilidad;
  if (existing) {
    disponibilidad = await prisma.disponibilidad_profesor.update({
      where: { id: existing.id },
      data: { estado },
      include: { bloques_horarios: true }
    });
  } else {
    disponibilidad = await prisma.disponibilidad_profesor.create({
      data: { profesor_id: usuarioId, bloque_id, estado },
      include: { bloques_horarios: true }
    });
  }

  return { disponibilidad };
}

// BULK UPDATE availability
export async function bulkUpdateAvailability(id, updates, userId, userRole) {
  if (!Array.isArray(updates) || updates.length === 0) {
    const error = new Error('updates debe ser un arreglo no vacío');
    error.status = 400;
    throw error;
  }

  if (userId !== id && userRole !== 'ADMIN') {
    const error = new Error('Sin permisos');
    error.status = 403;
    throw error;
  }

  const profesor = await prisma.usuarios.findUnique({
    where: { id },
    include: { profesores: true }
  });

  if (!profesor || !profesor.profesores) {
    const error = new Error('Profesor no encontrado');
    error.status = 404;
    throw error;
  }

  const profesorId = id;
  const ALLOWED_ESTADOS = ['DISPONIBLE', 'BLOQUEADO'];

  const results = await Promise.all(
    updates.map(async ({ bloque_id, estado }) => {
      if (!ALLOWED_ESTADOS.includes(estado)) {
        throw new Error(`Estado inválido para bloque ${bloque_id}. Valores permitidos: ${ALLOWED_ESTADOS.join(', ')}`);
      }
      const found = await prisma.disponibilidad_profesor.findFirst({
        where: { profesor_id: profesorId, bloque_id }
      });
      if (found) {
        return prisma.disponibilidad_profesor.update({
          where: { id: found.id },
          data: { estado }
        });
      } else {
        return prisma.disponibilidad_profesor.create({
          data: { profesor_id: profesorId, bloque_id, estado }
        });
      }
    })
  );

  return {
    message: `${results.length} bloques actualizados`,
    updates: results.length
  };
}

// GET profile
export async function getProfile(id) {
  // Buscar el profesor por su ID
  const profesor = await prisma.profesores.findUnique({ where: { id } });
  if (!profesor) {
    const error = new Error('Profesor no encontrado');
    error.status = 404;
    throw error;
  }

  // Buscar el usuario usando profesor.usuario_id
  const usuario = await prisma.usuarios.findUnique({ where: { id: profesor.usuario_id } });
  if (!usuario) {
    const error = new Error('Usuario no encontrado');
    error.status = 404;
    throw error;
  }

  let carrera = null;
  if (usuario.carrera_id) {
    try {
      carrera = await prisma.carreras.findUnique({ where: { id: usuario.carrera_id } });
    } catch (e) {
      // ignore
    }
  }

  const { password_hash, ...usuarioSafe } = usuario;

  return {
    id: profesor.id,
    usuario_id: usuario.id,
    carga_max_horas: profesor.carga_max_horas,
    usuario: usuarioSafe,
    carrera: carrera || null
  };
}

// UPDATE profile
export async function updateProfile(paramId, data, userId, userRole) {
  const { nombre, carga_max_horas, carrera_id } = data;
  const { usuario, profesorRecord } = await findProfessor(paramId);

  if (userId !== usuario.id && userRole !== 'ADMIN') {
    const error = new Error('Sin permisos');
    error.status = 403;
    throw error;
  }

  if (carga_max_horas !== undefined) {
    await prisma.profesores.update({
      where: { id: profesorRecord.id },
      data: { carga_max_horas }
    });
  }
  
  const updateUsuario = {};
  if (nombre !== undefined) updateUsuario.nombre = nombre;
  if (carrera_id !== undefined) updateUsuario.carrera_id = carrera_id;

  if (Object.keys(updateUsuario).length > 0) {
    await prisma.usuarios.update({
      where: { id: usuario.id },
      data: updateUsuario
    });
  }
  
  const updatedUsuario = await prisma.usuarios.findUnique({ where: { id: usuario.id } });
  const updatedProfesor = await prisma.profesores.findUnique({ where: { id: profesorRecord.id } });
  const { password_hash, ...usuarioSafe } = updatedUsuario || {};

  return {
    profesor: {
      id: updatedProfesor.id,
      usuario_id: updatedUsuario.id,
      carga_max_horas: updatedProfesor.carga_max_horas,
      usuario: usuarioSafe
    }
  };
}

// GET schedule
export async function getSchedule(paramId, periodo_id) {
  if (!periodo_id) {
    const error = new Error('periodo_id es requerido');
    error.status = 400;
    throw error;
  }

  const { usuario, profesorRecord } = await findProfessor(paramId);
  const profesorId = profesorRecord.id;

  const findModel = (candidates) => candidates.find(name => prisma[name] && typeof prisma[name].findMany === 'function');

  const horarioModel = findModel(['horario', 'horarios']);
  const detalleModel = findModel(['horario_detalle', 'horario_detalles', 'horarioDetalle', 'horarios_detalle']);
  const grupoModel = findModel(['grupo', 'grupos']);
  const materiaModel = findModel(['materia', 'materias']);
  const aulaModel = findModel(['aula', 'aulas']);
  const edificioModel = findModel(['edificio', 'edificios']);
  const bloqueModel = findModel(['bloques_horarios', 'bloque_horario', 'bloquesHorario']);

  if (!horarioModel || !detalleModel || !grupoModel) {
    const error = new Error('Modelos necesarios no encontrados en Prisma (horario / horario_detalle / grupo)');
    error.status = 500;
    throw error;
  }

  const horariosPeriodo = await prisma[horarioModel].findMany({
    where: { periodo_id },
    select: { id: true }
  });
  
  const horarioIds = horariosPeriodo.map(h => h.id);
  if (horarioIds.length === 0) return { horarios: [] };

  const detallesRaw = await prisma[detalleModel].findMany({
    where: { horario_id: { in: horarioIds } }
  });

  if (!detallesRaw || detallesRaw.length === 0) return { horarios: [] };

  const sample = detallesRaw[0];
  const keys = Object.keys(sample);

  const findKey = (candidatesRegex) => {
    return keys.find(k => candidatesRegex.some(re => re.test(k)));
  };

  const grupoKey = findKey([/grupo_id$/i, /grupoId$/i, /^grupo$/i]);
  const aulaKey = findKey([/aula_id$/i, /aulaId$/i, /aula$/i]);
  const bloqueKey = findKey([/bloque_horario_id$/i, /bloqueId$/i, /bloque_id$/i, /bloque_horarioId$/i]);
  const horarioKey = findKey([/horario_id$/i, /horarioId$/i, /^horario$/i]);

  if (!grupoKey) {
    const error = new Error('Campo grupo_id no encontrado en horario_detalle');
    error.status = 500;
    throw error;
  }

  const detalles = detallesRaw.map(d => ({
    id: d.id,
    grupo_id: d[grupoKey] ?? null,
    aula_id: aulaKey ? d[aulaKey] ?? null : null,
    bloque_horario_id: bloqueKey ? d[bloqueKey] ?? null : null,
    horario_id: horarioKey ? d[horarioKey] ?? null : null,
    raw: d
  }));

  const grupoIds = Array.from(new Set(detalles.map(d => d.grupo_id).filter(Boolean)));
  const grupos = await prisma[grupoModel].findMany({
    where: { id: { in: grupoIds }, profesor_id: profesorId },
    select: {
      id: true,
      materia_id: true,
      periodo_id: true,
      seccion: true,
      cupo_max: true
    }
  });
  
  const gruposMap = new Map(grupos.map(g => [g.id, g]));

  const detallesFiltrados = detalles.filter(d => gruposMap.has(d.grupo_id));
  if (detallesFiltrados.length === 0) return { horarios: [] };

  const materiaIds = Array.from(new Set(detallesFiltrados.map(d => gruposMap.get(d.grupo_id).materia_id).filter(Boolean)));
  const aulaIds = Array.from(new Set(detallesFiltrados.map(d => d.aula_id).filter(Boolean)));
  const bloqueIds = Array.from(new Set(detallesFiltrados.map(d => d.bloque_horario_id).filter(Boolean)));

  const [materias, aulas, bloques] = await Promise.all([
    materiaModel ? prisma[materiaModel].findMany({ where: { id: { in: materiaIds } } }) : Promise.resolve([]),
    aulaModel ? prisma[aulaModel].findMany({ where: { id: { in: aulaIds } }, include: edificioModel ? { edificio: true } : undefined }) : Promise.resolve([]),
    bloqueModel ? prisma[bloqueModel].findMany({ where: { id: { in: bloqueIds } } }) : Promise.resolve([])
  ]);

  const materiasMap = new Map((materias || []).map(m => [m.id, m]));
  const aulasMap = new Map((aulas || []).map(a => [a.id, a]));
  const bloquesMap = new Map((bloques || []).map(b => [b.id, b]));

  const schedule = detallesFiltrados.map(d => {
    const grupo = gruposMap.get(d.grupo_id);
    const materia = grupo ? materiasMap.get(grupo.materia_id) : null;
    const aula = aulasMap.get(d.aula_id);
    const bloque = bloquesMap.get(d.bloque_horario_id);

    return {
      id: d.id,
      materia: materia?.nombre || null,
      codigo_materia: materia?.codigo || null,
      seccion: grupo?.seccion || null,
      aula: aula && aula.edificio ? `${aula.edificio.codigo}-${aula.codigo}` : (aula ? aula.codigo : null),
      capacidad_aula: aula?.capacidad || null,
      tipo_aula: aula?.tipo || null,
      dia: bloque?.dia || null,
      hora_inicio: bloque?.hora_inicio || null,
      hora_fin: bloque?.hora_fin || null,
      turno: bloque?.turno || null,
      periodo: grupo ? (grupo.periodo_id || periodo_id) : periodo_id,
      estado_horario: null,
      cupo_max: grupo?.cupo_max || null
    };
  });

  return { horarios: schedule };
}
