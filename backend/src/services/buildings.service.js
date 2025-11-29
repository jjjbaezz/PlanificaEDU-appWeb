import { prisma } from '../prisma.js';

// List buildings with filters and pagination
export async function listBuildings(query) {
  const { q, page = 1, pageSize = 20, sort = 'codigo', order = 'asc' } = query;
  
  const where = {};
  if (q) {
    where.OR = [
      { nombre: { contains: String(q), mode: 'insensitive' } },
      { codigo: { contains: String(q), mode: 'insensitive' } }
    ];
  }

  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  const sortable = ['codigo', 'nombre'];
  const sortField = sortable.includes(String(sort)) ? String(sort) : 'codigo';
  const sortOrder = order === 'desc' ? 'desc' : 'asc';

  const [total, items] = await Promise.all([
    prisma.edificios.count({ where }),
    prisma.edificios.findMany({ where, orderBy: { [sortField]: sortOrder }, skip, take })
  ]);

  return { total, page: Number(page), pageSize: Number(pageSize), items };
}

// Get building by ID
export async function getBuildingById(id) {
  const edificio = await prisma.edificios.findUnique({ where: { id } });
  if (!edificio) {
    const error = new Error('Edificio no encontrado');
    error.status = 404;
    throw error;
  }
  return edificio;
}

// Create building
export async function createBuilding(data) {
  const { codigo, nombre } = data;

  if (!codigo || !nombre) {
    const error = new Error('codigo y nombre son requeridos');
    error.status = 400;
    throw error;
  }

  const exists = await prisma.edificios.findUnique({ where: { codigo } });
  if (exists) {
    const error = new Error('El código ya existe');
    error.status = 409;
    throw error;
  }

  return await prisma.edificios.create({ data: { codigo, nombre } });
}

// Update building
export async function updateBuilding(id, data) {
  const { codigo, nombre } = data;

  const edificio = await prisma.edificios.findUnique({ where: { id } });
  if (!edificio) {
    const error = new Error('Edificio no encontrado');
    error.status = 404;
    throw error;
  }

  const updateData = {};
  if (codigo) updateData.codigo = codigo;
  if (nombre) updateData.nombre = nombre;

  if (updateData.codigo && updateData.codigo !== edificio.codigo) {
    const exists = await prisma.edificios.findUnique({ where: { codigo: updateData.codigo } });
    if (exists) {
      const error = new Error('El código ya existe');
      error.status = 409;
      throw error;
    }
  }

  return await prisma.edificios.update({ where: { id }, data: updateData });
}

// Delete building
export async function deleteBuilding(id) {
  try {
    await prisma.edificios.delete({ where: { id } });
  } catch (error) {
    if (error.code === 'P2003') {
      const err = new Error('No se puede eliminar: existen aulas asociadas.');
      err.status = 409;
      throw err;
    }
    if (error.code === 'P2025') {
      const err = new Error('Edificio no encontrado');
      err.status = 404;
      throw err;
    }
    throw error;
  }
}

// Validate building code
export async function validateBuildingCode(codigo) {
  if (!codigo) {
    const error = new Error('codigo es requerido');
    error.status = 400;
    throw error;
  }
  const exists = await prisma.edificios.findUnique({ where: { codigo: String(codigo) } });
  return { available: !Boolean(exists) };
}

// List building classrooms
export async function listBuildingClassrooms(id) {
  const aulas = await prisma.aulas.findMany({
    where: { edificio_id: id },
    orderBy: [{ codigo: 'asc' }]
  });
  return { items: aulas };
}
