// controllers/group.controller.js
import { prisma } from '../prisma.js';

// GET /groups - Listar grupos
export const listGroups = async (req, res) => {
  try {
    const { periodo_id, materia_id, profesor_id } = req.query;
    
    const where = {};
    if (periodo_id) where.periodo_id = periodo_id;
    if (materia_id) where.materia_id = materia_id;
    if (profesor_id) where.profesor_id = profesor_id;
    
    const groups = await prisma.grupos.findMany({
      where,
      include: {
        materias: true,
        periodos: true,
        usuarios: { select: { id: true, nombre: true } },
        _count: { select: { inscripciones: true } }
      },
      orderBy: [{ periodo_id: 'desc' }, { materias: { nombre: 'asc' } }]
    });
    
    // Calcular cupos disponibles
    const groupsWithAvailability = await Promise.all(
      groups.map(async (group) => {
        const inscritos = group._count.inscripciones;
        const disponibles = Math.max(group.cupo_max - inscritos, 0);
        
        return {
          ...group,
          disponibilidad: {
            inscritos,
            disponibles,
            porcentaje: group.cupo_max > 0 ? 
              Math.round((inscritos / group.cupo_max) * 100) : 0
          }
        };
      })
    );
    
    return res.status(200).json({ groups: groupsWithAvailability });
  } catch (err) {
    console.error('Error listando grupos:', err);
    return res.status(500).json({ 
      message: 'Error al listar grupos', 
      error: err.message 
    });
  }
};

// POST /groups - Crear grupo
export const createGroup = async (req, res) => {
  try {
    const { periodo_id, materia_id, profesor_id, seccion, cupo_max } = req.body;
    
    // Validaciones
    if (!periodo_id || !materia_id || !profesor_id || !seccion || !cupo_max) {
      return res.status(400).json({ 
        message: 'Faltan campos requeridos' 
      });
    }
    
    // Verificar unicidad (periodo + materia + sección)
    const exists = await prisma.grupos.findFirst({
      where: {
        periodo_id,
        materia_id,
        seccion
      }
    });
    
    if (exists) {
      return res.status(409).json({ 
        message: 'Ya existe un grupo con la misma sección en este periodo' 
      });
    }
    
    // Crear grupo
    const group = await prisma.grupos.create({
      data: {
        periodo_id,
        materia_id,
        profesor_id,
        seccion,
        cupo_max: parseInt(cupo_max)
      },
      include: {
        materias: true,
        periodos: true,
        usuarios: { select: { id: true, nombre: true } }
      }
    });
    
    return res.status(201).json({
      message: 'Grupo creado exitosamente',
      group
    });
  } catch (err) {
    console.error('Error creando grupo:', err);
    return res.status(500).json({ 
      message: 'Error al crear grupo', 
      error: err.message 
    });
  }
};

// Más operaciones CRUD para grupos...