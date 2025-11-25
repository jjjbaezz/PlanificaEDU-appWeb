import { Prisma } from '@prisma/client';
import { prisma } from '../prisma.js';

const studentSelect = {
  id: true,
  nombre: true,
  email: true,
  rol: true,
  carrera_id: true,
};

const professorSelect = { id: true, nombre: true };

const blockSelect = {
  id: true,
  dia: true,
  hora_inicio: true,
  hora_fin: true,
  turno: true,
};

const httpError = (status, message, extra = {}) => Object.assign(new Error(message), { status, ...extra });

const mapEnrollment = (record) => ({
  id: record.id,
  usuario_id: record.usuario_id,
  grupo_id: record.grupo_id,
  created_at: record.created_at,
  estudiante: record.usuarios
    ? {
        id: record.usuarios.id,
        nombre: record.usuarios.nombre,
        email: record.usuarios.email,
        carrera_id: record.usuarios.carrera_id,
      }
    : null,
});

const buildCapacityMap = async (groupIds = []) => {
  const map = new Map();
  if (!groupIds.length) return map;

  try {
    const rows = await prisma.$queryRaw`SELECT * FROM v_grupos_cupos WHERE grupo_id IN (${Prisma.join(groupIds)})`;
    rows.forEach((row) => {
      const idKey = Object.keys(row).find((k) => k.toLowerCase().includes('grupo'));
      const availableKey = Object.keys(row).find((k) => k.toLowerCase().includes('disponible'));
      const usedKey = Object.keys(row).find((k) => k.toLowerCase().includes('inscrito') || k.toLowerCase().includes('ocupado'));
      const maxKey = Object.keys(row).find((k) => k.toLowerCase().includes('cupo_max'));
      const groupId = row[idKey];
      map.set(groupId, {
        cupo_max: maxKey !== undefined ? Number(row[maxKey]) : null,
        inscritos: usedKey !== undefined ? Number(row[usedKey]) : null,
        disponibles: availableKey !== undefined ? Number(row[availableKey]) : null,
        raw: row,
      });
    });
    return map;
  } catch (err) {
    const [groups, counts] = await Promise.all([
      prisma.grupos.findMany({ where: { id: { in: groupIds } }, select: { id: true, cupo_max: true } }),
      prisma.inscripciones.groupBy({
        by: ['grupo_id'],
        where: { grupo_id: { in: groupIds } },
        _count: { grupo_id: true },
      }),
    ]);
    const countMap = new Map(counts.map((c) => [c.grupo_id, c._count.grupo_id]));
    groups.forEach((group) => {
      const ocupados = countMap.get(group.id) || 0;
      const disponibles = typeof group.cupo_max === 'number' ? Math.max(group.cupo_max - ocupados, 0) : null;
      map.set(group.id, {
        cupo_max: group.cupo_max ?? null,
        inscritos: ocupados,
        disponibles,
        raw: null,
      });
    });
    return map;
  }
};

const getGroupWithDetails = async (groupId) =>
  prisma.grupos.findUnique({
    where: { id: groupId },
    include: {
      materias: { select: { id: true, nombre: true, codigo: true, carrera_id: true, creditos: true } },
      periodos: { select: { id: true, nombre: true, fecha_inicio: true, fecha_fin: true, activo: true } },
      usuarios: { select: professorSelect },
      horario_detalle: {
        select: {
          bloque_id: true,
          bloques_horarios: { select: blockSelect },
        },
      },
      _count: { select: { inscripciones: true } },
    },
  });

const getPrerequisitesMap = async (materiaIds = []) => {
  if (!materiaIds.length) return new Map();
  const rows = await prisma.prerrequisitos.findMany({
    where: { materia_id: { in: materiaIds } },
    select: {
      materia_id: true,
      requiere_id: true,
      materias_prerrequisitos_requiere_idTomaterias: { select: { id: true, nombre: true, codigo: true } },
    },
  });
  const map = new Map();
  rows.forEach((row) => {
    if (!map.has(row.materia_id)) map.set(row.materia_id, []);
    map.get(row.materia_id).push({
      id: row.requiere_id,
      materia: row.materias_prerrequisitos_requiere_idTomaterias,
    });
  });
  return map;
};

const getCompletedSubjects = async (studentId, beforeDate = null) => {
  const rows = await prisma.inscripciones.findMany({
    where: {
      usuario_id: studentId,
      ...(beforeDate
        ? {
            grupos: {
              periodos: {
                fecha_fin: { lt: beforeDate },
              },
            },
          }
        : {}),
    },
    select: {
      grupos: { select: { materia_id: true } },
    },
  });
  const set = new Set();
  rows.forEach((row) => {
    const materiaId = row.grupos?.materia_id;
    if (materiaId) set.add(materiaId);
  });
  return set;
};

const getExistingBlocksForStudent = async (studentId, periodoId) => {
  if (!periodoId) return new Map();
  const rows = await prisma.horario_detalle.findMany({
    where: {
      grupos: {
        periodo_id: periodoId,
        inscripciones: { some: { usuario_id: studentId } },
      },
    },
    select: {
      bloque_id: true,
      grupo_id: true,
      grupos: {
        select: {
          id: true,
          materias: { select: { id: true, nombre: true, codigo: true } },
        },
      },
      bloques_horarios: { select: blockSelect },
    },
  });
  const map = new Map();
  rows.forEach((row) => map.set(row.bloque_id, row));
  return map;
};

const getGroupBlocks = async (groupId) =>
  prisma.horario_detalle.findMany({
    where: { grupo_id: groupId },
    select: {
      bloque_id: true,
      grupo_id: true,
      bloques_horarios: { select: blockSelect },
    },
  });

const detectScheduleConflict = (groupBlocks = [], existingBlocks = new Map()) => {
  for (const block of groupBlocks) {
    const conflict = existingBlocks.get(block.bloque_id);
    if (conflict) {
      return {
        bloque: block,
        con_grupo: conflict.grupo_id,
        materia: conflict.grupos?.materias || null,
        horario_existente: conflict.bloques_horarios,
      };
    }
  }
  return null;
};

const validateEnrollmentConstraints = async (studentId, group) => {
  const groupId = group.id;
  const [capacityMap, prereqMap, completedSet, groupBlocks, existingBlocks] = await Promise.all([
    buildCapacityMap([groupId]),
    getPrerequisitesMap([group.materia_id]),
    getCompletedSubjects(studentId, group.periodos?.fecha_inicio ?? null),
    getGroupBlocks(groupId),
    getExistingBlocksForStudent(studentId, group.periodo_id),
  ]);

  const capacity = capacityMap.get(groupId);
  if (capacity && capacity.disponibles !== null && capacity.disponibles <= 0) {
    throw httpError(409, 'El grupo ya alcanzó el cupo máximo', { code: 'GROUP_FULL', capacity });
  }

  const missing = (prereqMap.get(group.materia_id) || []).filter((req) => !completedSet.has(req.id));
  if (missing.length) {
    throw httpError(409, 'Existen prerrequisitos pendientes', { code: 'PREREQ_NOT_MET', missing });
  }

  const conflict = detectScheduleConflict(groupBlocks, existingBlocks);
  if (conflict) {
    throw httpError(409, 'Conflicto de horario con otra inscripción', { code: 'SCHEDULE_CONFLICT', conflict });
  }

  return { capacity, groupBlocks };
};

const enrollStudent = async ({ studentId, groupId }) => {
  const group = await getGroupWithDetails(groupId);
  if (!group) {
    throw httpError(404, 'Grupo no encontrado');
  }

  await validateEnrollmentConstraints(studentId, group);

  try {
    const enrollment = await prisma.inscripciones.create({
      data: {
        usuario_id: studentId,
        grupo_id: groupId,
      },
      include: { usuarios: { select: studentSelect } },
    });

    const capacity = await buildCapacityMap([groupId]);
    return {
      enrollment: mapEnrollment(enrollment),
      group: {
        id: group.id,
        materia: group.materias,
        periodo: group.periodos,
        seccion: group.seccion,
      },
      capacity: capacity.get(groupId) || null,
    };
  } catch (error) {
    if (error.code === 'P2002') {
      throw httpError(409, 'El estudiante ya está inscrito en este grupo', { code: 'ALREADY_ENROLLED' });
    }
    throw error;
  }
};

const formatGroupResponse = (group, capacity) => ({
  id: group.id,
  periodo: group.periodos,
  materia: group.materias,
  profesor: group.usuarios,
  seccion: group.seccion,
  cupo_max: group.cupo_max,
  capacidad: capacity || null,
});

const handleError = (res, err, fallbackMessage) => {
  console.error(err);
  if (err.status) {
    const { status, message, code, missing, conflict, capacity, details } = err;
    return res.status(status).json({
      message,
      ...(code ? { code } : {}),
      ...(missing ? { missing } : {}),
      ...(conflict ? { conflict } : {}),
      ...(capacity ? { capacity } : {}),
      ...(details ? { details } : {}),
    });
  }
  return res.status(500).json({ message: fallbackMessage, error: err.message });
};

const ensureStudentUser = async (studentId) => {
  const student = await prisma.usuarios.findUnique({ where: { id: studentId }, select: studentSelect });
  if (!student) throw httpError(404, 'Estudiante no encontrado');
  if (student.rol !== 'ESTUDIANTE') {
    throw httpError(400, 'Solo se pueden inscribir usuarios con rol ESTUDIANTE');
  }
  return student;
};

export const listByGroup = async (req, res) => {
  try {
    const groupId = String(req.params.groupId);
    const group = await prisma.grupos.findUnique({
      where: { id: groupId },
      include: {
        materias: { select: { id: true, nombre: true, codigo: true } },
        periodos: { select: { id: true, nombre: true } },
        usuarios: { select: professorSelect },
        inscripciones: {
          include: { usuarios: { select: studentSelect } },
          orderBy: { created_at: 'asc' },
        },
        _count: { select: { inscripciones: true } },
      },
    });

    if (!group) {
      return res.status(404).json({ message: 'Grupo no encontrado' });
    }

    const capacity = await buildCapacityMap([groupId]);

    return res.status(200).json({
      group: formatGroupResponse(group, capacity.get(groupId)),
      enrollments: group.inscripciones.map(mapEnrollment),
    });
  } catch (err) {
    return handleError(res, err, 'Error al obtener las inscripciones del grupo');
  }
};

export const addStudentToGroup = async (req, res) => {
  try {
    const groupId = String(req.params.groupId);
    const { studentId } = req.body;

    if (!studentId) {
      return res.status(400).json({ message: 'El campo studentId es obligatorio' });
    }

    await ensureStudentUser(String(studentId));
    const result = await enrollStudent({ studentId: String(studentId), groupId });
    return res.status(201).json(result);
  } catch (err) {
    return handleError(res, err, 'Error al inscribir al estudiante');
  }
};

export const removeEnrollment = async (req, res) => {
  try {
    const groupId = String(req.params.groupId);
    const enrollmentId = String(req.params.enrollmentId);

    const enrollment = await prisma.inscripciones.findUnique({
      where: { id: enrollmentId },
      select: { id: true, grupo_id: true },
    });

    if (!enrollment) {
      return res.status(404).json({ message: 'Inscripción no encontrada' });
    }

    if (enrollment.grupo_id !== groupId) {
      return res.status(400).json({ message: 'La inscripción no pertenece al grupo indicado' });
    }

    await prisma.inscripciones.delete({ where: { id: enrollmentId } });
    const capacity = await buildCapacityMap([groupId]);

    return res.status(200).json({
      message: 'Inscripción eliminada correctamente',
      capacity: capacity.get(groupId) || null,
    });
  } catch (err) {
    return handleError(res, err, 'Error al eliminar la inscripción');
  }
};

const getActiveOrSelectedPeriod = async (periodoId) => {
  if (periodoId) {
    const period = await prisma.periodos.findUnique({ where: { id: periodoId } });
    if (!period) throw httpError(404, 'Período no encontrado');
    return period;
  }
  const active = await prisma.periodos.findFirst({ where: { activo: true } });
  if (!active) throw httpError(404, 'No existe un período activo');
  return active;
};

const describeSchedule = (blocks = []) =>
  blocks.map((block) => ({
    bloque_id: block.bloque_id,
    ...block.bloques_horarios,
  }));

export const listAvailableGroupsForStudent = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { periodoId } = req.query;
    const period = await getActiveOrSelectedPeriod(periodoId ? String(periodoId) : null);

    const student = await prisma.usuarios.findUnique({
      where: { id: studentId },
      select: { carrera_id: true },
    });

    const where = {
      periodo_id: period.id,
      ...(student?.carrera_id
        ? {
            materias: {
              carrera_id: student.carrera_id,
            },
          }
        : {}),
    };

    const groups = await prisma.grupos.findMany({
      where,
      include: {
        materias: { select: { id: true, nombre: true, codigo: true, carrera_id: true, creditos: true } },
        usuarios: { select: professorSelect },
        periodos: { select: { id: true, nombre: true } },
        horario_detalle: { select: { bloque_id: true, bloques_horarios: { select: blockSelect } } },
        _count: { select: { inscripciones: true } },
      },
      orderBy: { materias: { nombre: 'asc' } },
    });

    const groupIds = groups.map((g) => g.id);
    const [capacityMap, prereqMap, completedSet, existingBlocks] = await Promise.all([
      buildCapacityMap(groupIds),
      getPrerequisitesMap([...new Set(groups.map((g) => g.materia_id))]),
      getCompletedSubjects(studentId, period.fecha_inicio),
      getExistingBlocksForStudent(studentId, period.id),
    ]);

    const items = groups.map((group) => {
      const capacity = capacityMap.get(group.id);
      const disponibles = capacity?.disponibles ?? (typeof group.cupo_max === 'number'
        ? Math.max(group.cupo_max - (capacity?.inscritos ?? group._count?.inscripciones ?? 0), 0)
        : null);
      const missing = (prereqMap.get(group.materia_id) || []).filter((req) => !completedSet.has(req.id));
      const conflict = detectScheduleConflict(group.horario_detalle, existingBlocks);
      const elegible = (disponibles === null || disponibles > 0) && missing.length === 0 && !conflict;
      return {
        id: group.id,
        materia: group.materias,
        profesor: group.usuarios,
        periodo: group.periodos,
        seccion: group.seccion,
        cupo_max: group.cupo_max,
        capacidad: capacity || null,
        horarios: describeSchedule(group.horario_detalle),
        elegible,
        restricciones: {
          prerequisitos: missing,
          conflicto,
          cupo: disponibles === 0,
        },
      };
    });

    return res.status(200).json({ periodo: period, carrera_id: student?.carrera_id || null, items });
  } catch (err) {
    return handleError(res, err, 'Error al obtener los grupos disponibles');
  }
};

export const listMyEnrollments = async (req, res) => {
  try {
    const studentId = req.user.id;
    const enrollments = await prisma.inscripciones.findMany({
      where: { usuario_id: studentId },
      include: {
        grupos: {
          select: {
            id: true,
            seccion: true,
            cupo_max: true,
            periodo_id: true,
            periodos: { select: { id: true, nombre: true, fecha_inicio: true, fecha_fin: true } },
            materias: { select: { id: true, nombre: true, codigo: true, creditos: true } },
            usuarios: { select: professorSelect },
            horario_detalle: { select: { bloque_id: true, bloques_horarios: { select: blockSelect } } },
          },
        },
      },
      orderBy: { created_at: 'desc' },
    });

    return res.status(200).json({
      items: enrollments.map((enrollment) => ({
        id: enrollment.id,
        creado_el: enrollment.created_at,
        grupo: {
          id: enrollment.grupo_id,
          seccion: enrollment.grupos?.seccion,
          materia: enrollment.grupos?.materias,
          periodo: enrollment.grupos?.periodos,
          profesor: enrollment.grupos?.usuarios,
          horarios: describeSchedule(enrollment.grupos?.horario_detalle || []),
        },
      })),
    });
  } catch (err) {
    return handleError(res, err, 'Error al obtener tus inscripciones');
  }
};

export const selfEnroll = async (req, res) => {
  try {
    const studentId = req.user.id;
    const { groupId } = req.body;
    if (!groupId) {
      return res.status(400).json({ message: 'El campo groupId es obligatorio' });
    }
    await ensureStudentUser(studentId);
    const result = await enrollStudent({ studentId, groupId: String(groupId) });
    return res.status(201).json(result);
  } catch (err) {
    return handleError(res, err, 'Error al inscribirte en el grupo');
  }
};

const allowCancelAfterStart = process.env.ENROLL_ALLOW_CANCEL_AFTER_START === 'true';
const cancelDaysBefore = Number(process.env.ENROLL_CANCEL_DAYS_BEFORE || 0);

const canCancelEnrollment = (periodStart) => {
  if (!periodStart) return true;
  if (allowCancelAfterStart) return true;
  const now = new Date();
  const start = new Date(periodStart);
  if (Number.isFinite(cancelDaysBefore) && cancelDaysBefore > 0) {
    const limit = new Date(start);
    limit.setDate(limit.getDate() - cancelDaysBefore);
    return now <= limit;
  }
  return now < start;
};

export const cancelSelfEnrollment = async (req, res) => {
  try {
    const studentId = req.user.id;
    const enrollmentId = String(req.params.enrollmentId);

    const enrollment = await prisma.inscripciones.findUnique({
      where: { id: enrollmentId },
      include: {
        grupos: {
          select: {
            id: true,
            periodo_id: true,
            periodos: { select: { id: true, nombre: true, fecha_inicio: true } },
          },
        },
      },
    });

    if (!enrollment || enrollment.usuario_id !== studentId) {
      return res.status(404).json({ message: 'Inscripción no encontrada' });
    }

    if (!canCancelEnrollment(enrollment.grupos?.periodos?.fecha_inicio)) {
      return res.status(409).json({ message: 'El período ya inició o venció la fecha límite para cancelar la inscripción' });
    }

    await prisma.inscripciones.delete({ where: { id: enrollmentId } });
    const capacity = await buildCapacityMap([enrollment.grupo_id]);

    return res.status(200).json({
      message: 'Inscripción cancelada correctamente',
      capacity: capacity.get(enrollment.grupo_id) || null,
    });
  } catch (err) {
    return handleError(res, err, 'Error al cancelar la inscripción');
  }
};
