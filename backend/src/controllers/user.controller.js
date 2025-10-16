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
