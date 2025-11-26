import { prisma } from '../prisma.js';

const validDays = ['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB', 'DOM'];
const validTurnos = ['MANANA', 'TARDE', 'NOCHE'];
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Helpers
const validateEmail = (email) => {
  if (!emailRegex.test(email)) {
    throw new Error('Formato de email inválido');
  }
};

const validateDays = (dias) => {
  if (!dias || !Array.isArray(dias)) return;
  
  const invalidDays = dias.filter(d => !validDays.includes(d));
  if (invalidDays.length > 0) {
    throw new Error(`Días inválidos: ${invalidDays.join(', ')}. Valores permitidos: ${validDays.join(', ')}`);
  }
};

const validateTurno = (turno) => {
  if (turno && !validTurnos.includes(turno)) {
    throw new Error(`Turno inválido. Valores permitidos: ${validTurnos.join(', ')}`);
  }
};

// Students Services
export const getAllStudents = async (filters, pagination) => {
  const { activo, carrera_id, search } = filters;
  const { page = 1, limit = 20 } = pagination;

  const where = { rol: 'ESTUDIANTE' };

  if (activo !== undefined) {
    where.activo = activo === 'true';
  }

  if (carrera_id) {
    where.carrera_id = carrera_id;
  }

  if (search) {
    where.OR = [
      { nombre: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
    ];
  }

  const pageNum = parseInt(page);
  const limitNum = parseInt(limit);
  const skip = (pageNum - 1) * limitNum;

  const [students, total] = await Promise.all([
    prisma.usuarios.findMany({
      where,
      select: {
        id: true,
        nombre: true,
        email: true,
        carrera_id: true,
        activo: true,
        created_at: true,
        carreras: {
          select: {
            id: true,
            nombre: true,
            codigo: true,
          },
        },
      },
      skip,
      take: limitNum,
      orderBy: { created_at: 'desc' },
    }),
    prisma.usuarios.count({ where }),
  ]);

  return {
    students,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum),
    },
  };
};

export const getStudentById = async (id) => {
  const student = await prisma.usuarios.findFirst({
    where: { id, rol: 'ESTUDIANTE' },
    include: {
      carreras: true,
      preferencias_usuario: true,
    },
  });

  if (!student) {
    throw new Error('Estudiante no encontrado');
  }

  const { password_hash, ...studentData } = student;
  return studentData;
};

export const createStudent = async (data) => {
  const { nombre, email, password, carrera_id } = data;

  if (!nombre || !email || !password) {
    throw new Error('Nombre, email y password son obligatorios');
  }

  validateEmail(email);

  const existingUser = await prisma.usuarios.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (existingUser) {
    throw new Error('El email ya está registrado');
  }

  if (carrera_id) {
    const carrera = await prisma.carreras.findUnique({
      where: { id: carrera_id },
    });
    if (!carrera) {
      throw new Error('Carrera no encontrada');
    }
  }

  const student = await prisma.usuarios.create({
    data: {
      nombre,
      email: email.toLowerCase(),
      password_hash: password,
      rol: 'ESTUDIANTE',
      carrera_id: carrera_id || null,
      activo: true,
    },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      carrera_id: true,
      activo: true,
      created_at: true,
    },
  });

  return student;
};

export const updateStudent = async (id, data) => {
  const { nombre, email, carrera_id } = data;

  const existingStudent = await prisma.usuarios.findUnique({
    where: { id, rol: 'ESTUDIANTE' },
  });

  if (!existingStudent) {
    throw new Error('Estudiante no encontrado');
  }

  if (email) {
    validateEmail(email);

    if (email !== existingStudent.email) {
      const emailExists = await prisma.usuarios.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (emailExists) {
        throw new Error('El email ya está en uso');
      }
    }
  }

  if (carrera_id) {
    const carrera = await prisma.carreras.findUnique({
      where: { id: carrera_id },
    });
    if (!carrera) {
      throw new Error('Carrera no encontrada');
    }
  }

  const updateData = {};
  if (nombre) updateData.nombre = nombre;
  if (email) updateData.email = email.toLowerCase();
  if (carrera_id !== undefined) updateData.carrera_id = carrera_id || null;

  const student = await prisma.usuarios.update({
    where: { id },
    data: updateData,
    include: {
      carreras: true,
      preferencias_usuario: true,
    },
  });

  const { password_hash, ...studentData } = student;
  return studentData;
};

export const deactivateStudent = async (id) => {
  const existingStudent = await prisma.usuarios.findUnique({
    where: { id, rol: 'ESTUDIANTE' },
  });

  if (!existingStudent) {
    throw new Error('Estudiante no encontrado');
  }

  const student = await prisma.usuarios.update({
    where: { id },
    data: { activo: false },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
    },
  });

  return student;
};

export const activateStudent = async (id) => {
  const existingStudent = await prisma.usuarios.findUnique({
    where: { id, rol: 'ESTUDIANTE' },
  });

  if (!existingStudent) {
    throw new Error('Estudiante no encontrado');
  }

  const student = await prisma.usuarios.update({
    where: { id },
    data: { activo: true },
    select: {
      id: true,
      nombre: true,
      email: true,
      activo: true,
    },
  });

  return student;
};

export const getMyProfile = async (userId) => {
  const user = await prisma.usuarios.findUnique({
    where: { id: userId },
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      carrera_id: true,
      activo: true,
      created_at: true,
      carreras: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
        },
      },
      preferencias_usuario: {
        select: {
          id: true,
          turno_preferido: true,
          compactacion: true,
          evitar_dias: true,
          pesos: true,
        },
      },
    },
  });

  if (!user) {
    throw new Error('Usuario no encontrado');
  }

  return user;
};

export const updateMyProfile = async (userId, data) => {
  const { nombre, email, carrera_id } = data;

  const existingUser = await prisma.usuarios.findUnique({
    where: { id: userId },
  });

  if (!existingUser) {
    throw new Error('Usuario no encontrado');
  }

  if (email) {
    validateEmail(email);

    if (email.toLowerCase() !== existingUser.email.toLowerCase()) {
      const emailExists = await prisma.usuarios.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (emailExists) {
        throw new Error('El email ya está en uso');
      }
    }
  }

  if (carrera_id !== undefined && carrera_id !== null) {
    const carrera = await prisma.carreras.findUnique({
      where: { id: carrera_id },
    });
    if (!carrera) {
      throw new Error('Carrera no encontrada');
    }
  }

  const updateData = {};
  if (nombre) updateData.nombre = nombre;
  if (email) updateData.email = email.toLowerCase();
  if (carrera_id !== undefined) updateData.carrera_id = carrera_id || null;

  const user = await prisma.usuarios.update({
    where: { id: userId },
    data: updateData,
    select: {
      id: true,
      nombre: true,
      email: true,
      rol: true,
      carrera_id: true,
      activo: true,
      carreras: {
        select: {
          id: true,
          nombre: true,
          codigo: true,
        },
      },
    },
  });

  return user;
};

export const updateMyPreferences = async (userId, data) => {
  const { turno_preferido, compactacion, evitar_dias, pesos } = data;

  validateTurno(turno_preferido);
  validateDays(evitar_dias);

  if (compactacion !== undefined) {
    const comp = parseInt(compactacion);
    if (isNaN(comp) || comp < 0 || comp > 10) {
      throw new Error('La compactación debe ser un número entre 0 y 10');
    }
  }

  const preferenceData = {};
  if (turno_preferido !== undefined) preferenceData.turno_preferido = turno_preferido || null;
  if (compactacion !== undefined) preferenceData.compactacion = parseInt(compactacion);
  if (evitar_dias !== undefined) preferenceData.evitar_dias = evitar_dias || [];
  if (pesos !== undefined) preferenceData.pesos = pesos || null;

  const preferences = await prisma.preferencias_usuario.upsert({
    where: { usuario_id: userId },
    update: preferenceData,
    create: {
      usuario_id: userId,
      ...preferenceData,
    },
  });

  return preferences;
};
