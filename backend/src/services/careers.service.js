import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const carreraService = {
  // Lista todas las carreras
  getAllCarreras: async () => {
    return prisma.carreras.findMany({
      include: {
        materias: true,
        _count: {
          select: {
            usuarios: true,
            materias: true
          }
        }
      }
    });
  },

  // Crea nueva carrera
  createCarrera: async ({ codigo, nombre }) => {

    const existeCodigo = await prisma.carreras.findUnique({ where: { codigo } });
    const existeNombre = await prisma.carreras.findFirst({ where: { nombre } });

    if (existeCodigo || existeNombre) {
      const error = new Error('Código o nombre duplicado');
      error.message = 'DUPLICATE';
      throw error;
    }

    return prisma.carreras.create({ data: { codigo, nombre } });
  },

  // Actualiza carrera
  updateCarrera: async (carreraId, { codigo, nombre }) => {
    const carrera = await prisma.carreras.findUnique({ where: { id: carreraId } });
    if (!carrera) {
      const error = new Error('Carrera no encontrada');
      error.message = 'NOT_FOUND';
      throw error;
    }

    if (codigo || nombre) {
      const existeOtro = await prisma.carreras.findFirst({
        where: {
          id: { not: carreraId },
          OR: [
            codigo ? { codigo } : undefined,
            nombre ? { nombre } : undefined
          ].filter(Boolean)
        }
      });
      if (existeOtro) {
        const error = new Error('Código o nombre duplicado');
        error.message = 'DUPLICATE';
        throw error;
      }
    }

    return prisma.carreras.update({
      where: { id: carreraId },
      data: {
        codigo: codigo || carrera.codigo,
        nombre: nombre || carrera.nombre
      }
    });
  },


  deleteCarrera: async (carreraId) => {
    const carrera = await prisma.carreras.findUnique({ where: { id: carreraId } });
    if (!carrera) {
      const error = new Error('Carrera no encontrada');
      error.message = 'NOT_FOUND';
      throw error;
    }
    await prisma.materias.deleteMany({ where: { carrera_id: carreraId } });

    await prisma.carreras.delete({ where: { id: carreraId } });
    return true;
  }
};

export default carreraService;
