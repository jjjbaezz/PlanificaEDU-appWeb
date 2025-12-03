import { prisma } from '../prisma.js';

// List subjects with filters and pagination
export async function listSubjects(query) {
  const {
    q,
    carrera_id,
    creditos_min,
    creditos_max,
    page = 1,
    pageSize = 20,
    sort = 'codigo',
    order = 'asc'
  } = query;

  const where = {};
  if (q) {
    where.OR = [
      { nombre: { contains: String(q), mode: 'insensitive' } },
      { codigo: { contains: String(q), mode: 'insensitive' } }
    ];
  }
  if (carrera_id) where.carrera_id = String(carrera_id);
  if (creditos_min || creditos_max) {
    where.creditos = {};
    if (creditos_min) where.creditos.gte = Number(creditos_min);
    if (creditos_max) where.creditos.lte = Number(creditos_max);
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const sortable = ['codigo', 'nombre', 'creditos', 'carrera_id'];
  const sortField = sortable.includes(String(sort)) ? String(sort) : 'codigo';
  const sortOrder = order === 'desc' ? 'desc' : 'asc';

  const [total, items] = await Promise.all([
    prisma.materias.count({ where }),
    prisma.materias.findMany({
      where,
      orderBy: { [sortField]: sortOrder },
      skip,
      take
    })
  ]);

  return {
    total,
    page: Number(page),
    pageSize: Number(pageSize),
    items
  };
}

// Get subject by ID with prerequisites
export async function getSubjectById(id) {
  const materia = await prisma.materias.findUnique({ where: { id } });
  if (!materia) {
    const error = new Error('Materia no encontrada');
    error.status = 404;
    throw error;
  }

  const [requiere, requeridaPor] = await Promise.all([
    prisma.prerrequisitos.findMany({ where: { materia_id: id } }),
    prisma.prerrequisitos.findMany({ where: { requiere_id: id } })
  ]);

  return { ...materia, prerrequisitos: requiere, requerida_por: requeridaPor };
}

// Create subject
export async function createSubject(data) {
  const { codigo, nombre, creditos = 0, carrera_id } = data;

  if (!codigo || !nombre) {
    const error = new Error('codigo y nombre son requeridos');
    error.status = 400;
    throw error;
  }

  const exists = await prisma.materias.findUnique({ where: { codigo } });
  if (exists) {
    const error = new Error('El código ya existe');
    error.status = 409;
    throw error;
  }

  return await prisma.materias.create({
    data: { codigo, nombre, creditos: Number(creditos) || 0, carrera_id: carrera_id || null }
  });
}

// Update subject
export async function updateSubject(id, data) {
  const { codigo, nombre, creditos, carrera_id } = data;

  const materia = await prisma.materias.findUnique({ where: { id } });
  if (!materia) {
    const error = new Error('Materia no encontrada');
    error.status = 404;
    throw error;
  }

  const updateData = {};
  if (codigo) updateData.codigo = codigo;
  if (nombre) updateData.nombre = nombre;
  if (creditos !== undefined) updateData.creditos = Number(creditos);
  if (carrera_id !== undefined) updateData.carrera_id = carrera_id || null;

  if (Object.keys(updateData).length === 0) return materia;

  if (updateData.codigo && updateData.codigo !== materia.codigo) {
    const exists = await prisma.materias.findUnique({ where: { codigo: updateData.codigo } });
    if (exists) {
      const error = new Error('El código ya existe');
      error.status = 409;
      throw error;
    }
  }

  return await prisma.materias.update({ where: { id }, data: updateData });
}

// Delete subject
export async function deleteSubject(id) {
  try {
    await prisma.materias.delete({ where: { id } });
  } catch (error) {
    if (error.code === 'P2003') {
      const err = new Error('No se puede eliminar: existen dependencias (grupos/prerrequisitos).');
      err.status = 409;
      throw err;
    }
    if (error.code === 'P2025') {
      const err = new Error('Materia no encontrada');
      err.status = 404;
      throw err;
    }
    throw error;
  }
}

// List prerequisites
export async function listPrerequisites(id) {
  const requiere = await prisma.prerrequisitos.findMany({ where: { materia_id: id } });
  return { items: requiere };
}

// Add prerequisite
export async function addPrerequisite(id, requiere_id) {
  if (!requiere_id) {
    const error = new Error('requiere_id es requerido');
    error.status = 400;
    throw error;
  }

  if (id === requiere_id) {
    const error = new Error('Una materia no puede requerirse a sí misma');
    error.status = 400;
    throw error;
  }

  try {
    return await prisma.prerrequisitos.create({ data: { materia_id: id, requiere_id } });
  } catch (error) {
    if (error.code === 'P2002') {
      const err = new Error('El prerrequisito ya existe');
      err.status = 409;
      throw err;
    }
    if (error.code === 'P2003') {
      const err = new Error('materia_id o requiere_id no válidos');
      err.status = 400;
      throw err;
    }
    throw error;
  }
}

// Remove prerequisite
export async function removePrerequisite(id, reqId) {
  try {
    await prisma.prerrequisitos.delete({ 
      where: { materia_id_requiere_id: { materia_id: id, requiere_id: reqId } } 
    });
  } catch (error) {
    if (error.code === 'P2025') {
      const err = new Error('Prerrequisito no encontrado');
      err.status = 404;
      throw err;
    }
    throw error;
  }
}

// List subject groups
export async function listSubjectGroups(id, periodo_id) {
  const where = { materia_id: id };
  if (periodo_id) where.periodo_id = String(periodo_id);

  const groups = await prisma.grupos.findMany({ where });
  return { items: groups };
}

// Validate subject code
export async function validateSubjectCode(codigo) {
  if (!codigo) {
    const error = new Error('codigo es requerido');
    error.status = 400;
    throw error;
  }
  const exists = await prisma.materias.findUnique({ where: { codigo: String(codigo) } });
  return { available: !Boolean(exists) };
}
