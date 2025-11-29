import bcrypt from 'bcryptjs';
// POST /users
export const createUser = async (req, res) => {
  try {
    const { nombre, email, password, rol } = req.body;
    if (!nombre || !email || !password || !rol) {
      return res.status(400).json({ message: 'Faltan campos requeridos' });
    }
    const exists = await prisma.usuarios.findUnique({ where: { email } });
    if (exists) {
      return res.status(409).json({ message: 'El usuario ya existe' });
    }
    const password_hash = await bcrypt.hash(password, 12);
    const user = await prisma.usuarios.create({
      data: {
        nombre,
        email,
        password_hash,
        rol
      }
    });
    const { password_hash: _, ...safe } = user;
    return res.status(201).json({ user: safe });
  } catch (err) {
    return res.status(500).json({ message: 'Error creando usuario', error: err.message });
  }
};
import { prisma } from '../prisma.js';

// PATCH /users/:id/role
export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { rol } = req.body;

    if (!['PROFESOR', 'ESTUDIANTE', 'ADMIN'].includes(rol)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    // (Opcional) validar que solo dueño o admin cambie su rol
    if (req.user.id !== id && req.user.rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Sin permisos para modificar este rol' });
    }

    const updated = await prisma.usuarios.update({
      where: { id },
      data: { rol }
    });

    const { password_hash, ...safe } = updated;
    return res.json({ user: safe });
  } catch (err) {
    return res.status(500).json({ message: 'Error actualizando rol', error: err.message });
  }
};

// PUT /users/:id/preferences
export const upsertPreferences = async (req, res) => {
  try {
    const { id } = req.params;
    const { turno_preferido, compactacion, evitar_dias, pesos } = req.body;

    if (req.user.id !== id && req.user.rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Sin permisos para modificar estas preferencias' });
    }

    const result = await prisma.preferencias_usuario.upsert({
      where: { usuario_id: id },
      create: {
        usuario_id: id,
        turno_preferido: turno_preferido ?? null,
        compactacion: typeof compactacion === 'number' ? compactacion : 5,
        evitar_dias: evitar_dias ?? null,
        pesos: pesos ?? undefined
      },
      update: {
        turno_preferido: turno_preferido ?? null,
        compactacion: typeof compactacion === 'number' ? compactacion : 5,
        evitar_dias: evitar_dias ?? null,
        pesos: pesos ?? undefined
      }
    });

    return res.json({ preferencias: result });
  } catch (err) {
    return res.status(500).json({ message: 'Error guardando preferencias', error: err.message });
  }
};
