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



// GET /users
export const getAll = async (req, res) => {

    try {

        const users = await prisma.usuarios.findMany({
            // select:{id:true,nombre:true,email:true,rol:true,carrera_id:true,activo:true},
            take:100 }); 

        if(users.length === 0){
            return res.status(204).json({message: "No hay usuarios disponibles"});
        }
        return res.status(200).json({users});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener los usuarios", error: err.message});
    }
  

}

// GET /users/:id
export const getById = async (req, res) => {

    try {

      const {id}= req.params;

        const user = await prisma.usuarios.findUnique({where:{id:String(id)}}); 
        if(!user){
            return res.status().json({message: "Usuario no encontrada"});
        }
        return res.status(200).json({user});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener el usuario", error: err.message});
    }
  

}


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



// PATCH /users/:id
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, rol, activo } = req.body;

    // Validación de rol (opcional)
    if (rol && !['ADMIN', 'PROFESOR', 'ESTUDIANTE'].includes(rol)) {
      return res.status(400).json({ message: 'Rol inválido' });
    }

    const data = {};
    if (nombre) data.nombre = nombre;
    if (rol) data.rol = rol;
    if (typeof activo === 'boolean') data.activo = activo;

    const updated = await prisma.usuarios.update({
      where: { id },
      data
    });

    const { password_hash, ...safe } = updated;
    return res.json({ user: safe });
  } catch (err) {
    return res.status(500).json({ message: 'Error actualizando usuario', error: err.message });
  }
};

// PATCH /users/:id/toggle
export const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.usuarios.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const newStatus = !user.activo;

    const updated = await prisma.usuarios.update({
      where: { id },
      data: { activo: newStatus }
    });

    return res.status(200).json({
      message: `Usuario ${newStatus ? 'activado' : 'desactivado'}`,
      user: updated
    });
  } catch (err) {
    return res.status(500).json({ message: 'Error al cambiar estado de usuario', error: err.message });
  }
};

// PATCH /users/:id/
export const deactivateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await prisma.usuarios.update({
      where: { id },
      data: { activo: false }
    });
    return res.status(200).json({ message: 'Usuario desactivado', user: updated });
  } catch (err) {
    return res.status(500).json({ message: 'Error al desactivar usuario', error: err.message });
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
