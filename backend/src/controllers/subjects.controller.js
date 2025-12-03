import * as subjectsService from '../services/subjects.service.js';
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
    const result = await subjectsService.listSubjects(req.query);
    return res.json(result);
  } catch (error) {
    console.error('Error listando materias:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// GET /subjects/:id
export const getSubjectById = async (req, res) => {
  try {
    const result = await subjectsService.getSubjectById(req.params.id);
    return res.json(result);
  } catch (error) {
    console.error('Error obteniendo materia:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// POST /subjects
export const createSubject = async (req, res) => {
  try {
    const { codigo, nombre, creditos = 0, carrera_id } = req.body;

    if (!codigo || !nombre) {
      return res.status(400).json({ message: 'codigo y nombre son requeridos' });
    }

    const exists = await prisma.materias.findUnique({ where: { codigo } });
    if (exists) return res.status(409).json({ message: 'El código ya existe' });

    // Convertir carrera_id a string si existe
    const carreraIdValue = carrera_id ? String(carrera_id) : null;

    const created = await prisma.materias.create({
      data: { codigo, nombre, creditos: Number(creditos) || 0, carrera_id: carreraIdValue }
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
    const result = await subjectsService.updateSubject(req.params.id, req.body);
    return res.json(result);
  } catch (error) {
    console.error('Error actualizando materia:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// DELETE /subjects/:id
export const deleteSubject = async (req, res) => {
  try {
    ensureAdmin(req.user);
    await subjectsService.deleteSubject(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error('Error eliminando materia:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// GET /subjects/:id/prerequisites
export const listPrerequisites = async (req, res) => {
  try {
    const result = await subjectsService.listPrerequisites(req.params.id);
    return res.json(result);
  } catch (error) {
    console.error('Error listando prerrequisitos:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// POST /subjects/:id/prerequisites
export const addPrerequisite = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const result = await subjectsService.addPrerequisite(req.params.id, req.body.requiere_id || req.body.prerequisito_id);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error a�adiendo prerrequisito:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// DELETE /subjects/:id/prerequisites/:reqId
export const removePrerequisite = async (req, res) => {
  try {
    ensureAdmin(req.user);
    await subjectsService.removePrerequisite(req.params.id, req.params.reqId || req.params.prereqId);
    return res.status(204).send();
  } catch (error) {
    console.error('Error eliminando prerrequisito:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// GET /subjects/:id/groups
export const listSubjectGroups = async (req, res) => {
  try {
    const result = await subjectsService.listSubjectGroups(req.params.id, req.query.periodo_id);
    return res.json(result);
  } catch (error) {
    console.error('Error listando grupos:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

// GET /subjects/validate
export const validateSubjectCode = async (req, res) => {
  try {
    const result = await subjectsService.validateSubjectCode(req.query.codigo);
    return res.json(result);
  } catch (error) {
    console.error('Error validando c�digo:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};
