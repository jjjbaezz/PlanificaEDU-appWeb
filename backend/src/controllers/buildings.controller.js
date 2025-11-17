import { prisma } from '../prisma.js';
const ensureAdmin = (user) => {
  if (!user || user.rol !== 'ADMIN') {
    const err = new Error('Requiere rol ADMIN');
    err.status = 403;
    throw err;
  }
};

export const listBuildings = async (req, res) => {
  try {
    const { q, page = 1, pageSize = 20, sort = 'codigo', order = 'asc' } = req.query;
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

    res.json({ total, page: Number(page), pageSize: Number(pageSize), items });
  } catch (error) {
    console.error('Error listBuildings:', error);
    res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const getBuildingById = async (req, res) => {
  try {
    const { id } = req.params;
    const edificio = await prisma.edificios.findUnique({ where: { id } });
    if (!edificio) return res.status(404).json({ message: 'Edificio no encontrado' });
    res.json(edificio);
  } catch (error) {
    console.error('Error getBuildingById:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const createBuilding = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const { codigo, nombre } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ message: 'codigo y nombre son requeridos' });
    }

    const exists = await prisma.edificios.findUnique({ where: { codigo } });
    if (exists) return res.status(409).json({ message: 'El código ya existe' });

    const created = await prisma.edificios.create({ data: { codigo, nombre } });
    res.status(201).json(created);
  } catch (error) {
    console.error('Error createBuilding:', error);
    res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const updateBuilding = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const { id } = req.params;
    const { codigo, nombre } = req.body;

    const edificio = await prisma.edificios.findUnique({ where: { id } });
    if (!edificio) return res.status(404).json({ message: 'Edificio no encontrado' });

    const data = {};
    if (codigo) data.codigo = codigo;
    if (nombre) data.nombre = nombre;

    if (data.codigo && data.codigo !== edificio.codigo) {
      const exists = await prisma.edificios.findUnique({ where: { codigo: data.codigo } });
      if (exists) return res.status(409).json({ message: 'El código ya existe' });
    }

    const updated = await prisma.edificios.update({ where: { id }, data });
    res.json(updated);
  } catch (error) {
    console.error('Error updateBuilding:', error);
    res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const deleteBuilding = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const { id } = req.params;
    await prisma.edificios.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleteBuilding:', error);
    if (error.code === 'P2003') {
      return res.status(409).json({ message: 'No se puede eliminar: existen aulas asociadas.' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Edificio no encontrado' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const validateBuildingCode = async (req, res) => {
  try {
    const { codigo } = req.query;
    if (!codigo) return res.status(400).json({ message: 'codigo es requerido' });
    const exists = await prisma.edificios.findUnique({ where: { codigo: String(codigo) } });
    res.json({ available: !Boolean(exists) });
  } catch (error) {
    console.error('Error validateBuildingCode:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

export const listBuildingClassrooms = async (req, res) => {
  try {
    const { id } = req.params;
    const aulas = await prisma.aulas.findMany({
      where: { edificio_id: id },
      orderBy: [{ codigo: 'asc' }]
    });
    res.json({ items: aulas });
  } catch (error) {
    console.error('Error listBuildingClassrooms:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
