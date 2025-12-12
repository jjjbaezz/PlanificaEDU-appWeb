          import { prisma } from '../prisma.js';

const daysOrder = { LUN: 1, MAR: 2, MIE: 3, JUE: 4, VIE: 5, SAB: 6, DOM: 7 };
const validDays = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
const validTurnos = ['MANANA', 'TARDE', 'NOCHE'];
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/;

// Helpers
const convertToDateTime = (timeString) => {
  return new Date(`1970-01-01T${timeString}Z`);
};

const validateDay = (dia) => {
  if (!validDays.includes(dia)) {
    throw new Error(`Día inválido. Valores permitidos: ${validDays.join(', ')}`);
  }
};

const validateTurno = (turno) => {
  if (turno && !validTurnos.includes(turno)) {
    throw new Error(`Turno inválido. Valores permitidos: ${validTurnos.join(', ')}`);
  }
};

const validateTimeFormat = (hora_inicio, hora_fin) => {
  if (!timeRegex.test(hora_inicio) || !timeRegex.test(hora_fin)) {
    throw new Error('Formato de hora inválido. Use HH:MM:SS');
  }
};

const sortTimeBlocks = (timeBlocks) => {
  return timeBlocks.sort((a, b) => {
    if (daysOrder[a.dia] !== daysOrder[b.dia]) {
      return daysOrder[a.dia] - daysOrder[b.dia];
    }
    return a.hora_inicio < b.hora_inicio ? -1 : 1;
  });
};

// Services
export const getAllTimeBlocks = async (filters) => {
  const { dia, turno } = filters;

  const where = {};
  if (dia) where.dia = dia;
  if (turno) where.turno = turno;

  const timeBlocks = await prisma.bloques_horarios.findMany({
    where,
    orderBy: [{ hora_inicio: 'asc' }],
  });

  const sortedBlocks = sortTimeBlocks(timeBlocks);

  return {
    timeBlocks: sortedBlocks,
    total: sortedBlocks.length,
  };
};

export const getTimeBlockById = async (id) => {
  const timeBlock = await prisma.bloques_horarios.findUnique({
    where: { id },
  });

  if (!timeBlock) {
    throw new Error('Bloque horario no encontrado');
  }

  return timeBlock;
};

export const createTimeBlock = async (data) => {
  const { dia, hora_inicio, hora_fin, turno } = data;

  if (!dia || !hora_inicio || !hora_fin) {
    throw new Error('Día, hora de inicio y hora de fin son obligatorios');
  }

  validateDay(dia);
  validateTurno(turno);
  validateTimeFormat(hora_inicio, hora_fin);

  const horaInicioDate = convertToDateTime(hora_inicio);
  const horaFinDate = convertToDateTime(hora_fin);

  const existingBlock = await prisma.bloques_horarios.findFirst({
    where: {
      dia,
      hora_inicio: horaInicioDate,
      hora_fin: horaFinDate,
    },
  });

  if (existingBlock) {
    throw new Error('Ya existe un bloque con el mismo día y horario');
  }

  const timeBlock = await prisma.bloques_horarios.create({
    data: {
      dia,
      hora_inicio: horaInicioDate,
      hora_fin: horaFinDate,
      turno: turno || null,
    },
  });

  return timeBlock;
};

export const updateTimeBlock = async (id, data) => {
  const { dia, hora_inicio, hora_fin, turno } = data;

  const existingBlock = await prisma.bloques_horarios.findUnique({
    where: { id },
  });

  if (!existingBlock) {
    throw new Error('Bloque horario no encontrado');
  }

  if (dia) validateDay(dia);
  if (turno) validateTurno(turno);
  if (hora_inicio || hora_fin) {
    const horaInicioToValidate = hora_inicio || existingBlock.hora_inicio;
    const horaFinToValidate = hora_fin || existingBlock.hora_fin;
    
    if (hora_inicio) validateTimeFormat(hora_inicio, horaFinToValidate);
    if (hora_fin) validateTimeFormat(horaInicioToValidate, hora_fin);
  }

  const newDia = dia || existingBlock.dia;
  const newHoraInicio = hora_inicio ? convertToDateTime(hora_inicio) : existingBlock.hora_inicio;
  const newHoraFin = hora_fin ? convertToDateTime(hora_fin) : existingBlock.hora_fin;

  if (dia || hora_inicio || hora_fin) {
    const duplicateBlock = await prisma.bloques_horarios.findFirst({
      where: {
        dia: newDia,
        hora_inicio: newHoraInicio,
        hora_fin: newHoraFin,
        NOT: { id },
      },
    });

    if (duplicateBlock) {
      throw new Error('Ya existe otro bloque con el mismo día y horario');
    }
  }

  const updateData = {};
  if (dia) updateData.dia = dia;
  if (hora_inicio) updateData.hora_inicio = convertToDateTime(hora_inicio);
  if (hora_fin) updateData.hora_fin = convertToDateTime(hora_fin);
  if (turno !== undefined) updateData.turno = turno || null;

  const timeBlock = await prisma.bloques_horarios.update({
    where: { id },
    data: updateData,
  });

  return timeBlock;
};

export const deleteTimeBlock = async (id) => {
  const existingBlock = await prisma.bloques_horarios.findUnique({
    where: { id },
    include: {
      horario_detalle: true,
      disponibilidad_aula: true,
      disponibilidad_profesor: true,
    },
  });

  if (!existingBlock) {
    throw new Error('Bloque horario no encontrado');
  }

  if (existingBlock.horario_detalle.length > 0) {
    const error = new Error('No se puede eliminar el bloque porque está siendo usado en horarios generados');
    error.usedIn = {
      horarios: existingBlock.horario_detalle.length,
    };
    throw error;
  }

  await prisma.bloques_horarios.delete({
    where: { id },
  });

  return { success: true };
};
