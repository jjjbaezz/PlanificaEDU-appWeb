import { prisma } from '../prisma.js';

const ensureAdmin = (user) => {
  if (!user || user.rol !== 'ADMIN') {
    const err = new Error('Requiere rol ADMIN');
    err.status = 403;
    throw err;
  }
};

// GET /subjects
export const listSubjects = async (req, res) => {
  try {
    const {
      q,
      carrera_id,
      creditos_min,
      creditos_max,
      page = 1,
      pageSize = 20,
      sort = 'codigo',
      order = 'asc'
    } = req.query;

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

    const [total, items] = await Promise.all([
      prisma.materias.count({ where }),
      prisma.materias.findMany({
        where,
        orderBy: { [String(sort)]: order === 'desc' ? 'desc' : 'asc' },
        skip,
        take
      })
    ]);

    res.json({
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      items
    });
  } catch (error) {
    console.error('Error listSubjects:', error);
    res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// GET /subjects/:id
export const getSubjectById = async (req, res) => {
  try {
    const { id } = req.params;

    const materia = await prisma.materias.findUnique({ where: { id } });
    if (!materia) return res.status(404).json({ message: 'Materia no encontrada' });

    const [requiere, requeridaPor] = await Promise.all([
      prisma.prerrequisitos.findMany({ where: { materia_id: id } }),
      prisma.prerrequisitos.findMany({ where: { requiere_id: id } })
    ]);

    res.json({ ...materia, prerrequisitos: requiere, requerida_por: requeridaPor });
  } catch (error) {
    console.error('Error getSubjectById:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /subjects
export const createSubject = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const { codigo, nombre, creditos = 0, carrera_id } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ message: 'codigo y nombre son requeridos' });
    }

    const exists = await prisma.materias.findUnique({ where: { codigo } });
    if (exists) return res.status(409).json({ message: 'El código ya existe' });

    const created = await prisma.materias.create({
      data: { codigo, nombre, creditos: Number(creditos) || 0, carrera_id: carrera_id || null }
    });

    res.status(201).json(created);
  } catch (error) {
    console.error('Error createSubject:', error);
    res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// PUT /subjects/:id
export const updateSubject = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const { id } = req.params;
    const { codigo, nombre, creditos, carrera_id } = req.body;

    const materia = await prisma.materias.findUnique({ where: { id } });
    if (!materia) return res.status(404).json({ message: 'Materia no encontrada' });

    const data = {};
    if (codigo) data.codigo = codigo;
    if (nombre) data.nombre = nombre;
    if (creditos !== undefined) data.creditos = Number(creditos);
    if (carrera_id !== undefined) data.carrera_id = carrera_id || null;

    if (Object.keys(data).length === 0) return res.json(materia);

    if (data.codigo && data.codigo !== materia.codigo) {
      const exists = await prisma.materias.findUnique({ where: { codigo: data.codigo } });
      if (exists) return res.status(409).json({ message: 'El código ya existe' });
    }

    const updated = await prisma.materias.update({ where: { id }, data });
    res.json(updated);
  } catch (error) {
    console.error('Error updateSubject:', error);
    res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// DELETE /subjects/:id
export const deleteSubject = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const { id } = req.params;

    await prisma.materias.delete({ where: { id } });
    res.status(204).send();
  } catch (error) {
    console.error('Error deleteSubject:', error);
    // Prisma foreign key violation
    if (error.code === 'P2003') {
      return res.status(409).json({ message: 'No se puede eliminar: existen dependencias (grupos/prerrequisitos).' });
    }
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Materia no encontrada' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /subjects/:id/prerequisites
export const listPrerequisites = async (req, res) => {
  try {
    const { id } = req.params;
    const requiere = await prisma.prerrequisitos.findMany({ where: { materia_id: id } });
    res.json({ items: requiere });
  } catch (error) {
    console.error('Error listPrerequisites:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /subjects/:id/prerequisites
export const addPrerequisite = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const { id } = req.params;
    const { requiere_id } = req.body;
    if (!requiere_id) return res.status(400).json({ message: 'requiere_id es requerido' });

    if (id === requiere_id) return res.status(400).json({ message: 'Una materia no puede requerirse a sí misma' });

    const created = await prisma.prerrequisitos.create({ data: { materia_id: id, requiere_id } });
    res.status(201).json(created);
  } catch (error) {
    console.error('Error addPrerequisite:', error);
    if (error.code === 'P2002') {
      return res.status(409).json({ message: 'El prerrequisito ya existe' });
    }
    if (error.code === 'P2003') {
      return res.status(400).json({ message: 'materia_id o requiere_id no válidos' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /subjects/:id/prerequisites/:reqId
export const removePrerequisite = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const { id, reqId } = req.params;
    await prisma.prerrequisitos.delete({ where: { materia_id_requiere_id: { materia_id: id, requiere_id: reqId } } });
    res.status(204).send();
  } catch (error) {
    console.error('Error removePrerequisite:', error);
    if (error.code === 'P2025') {
      return res.status(404).json({ message: 'Prerrequisito no encontrado' });
    }
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};


// GET /subjects/validate?codigo=ABC123
export const validateSubjectCode = async (req, res) => {
  try {
    const { codigo } = req.query;
    if (!codigo) return res.status(400).json({ message: 'codigo es requerido' });
    const exists = await prisma.materias.findUnique({ where: { codigo: String(codigo) } });
    res.json({ available: !Boolean(exists) });
  } catch (error) {
    console.error('Error validateSubjectCode:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
