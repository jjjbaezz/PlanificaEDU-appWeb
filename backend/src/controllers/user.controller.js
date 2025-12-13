import bcrypt from 'bcryptjs';
import * as preferencesService from '../services/preferences.service.js'
import { prisma } from '../prisma.js';


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


export const updatePreferences = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (req.user.id !== id && req.user.rol !== 'ADMIN') {
      return res.status(403).json({ message: 'Sin permisos para modificar estas preferencias' });
    }

    const { turno, diasEvitar = [], compactacion = 'media' } = req.body;

    const turnosValidos = ['manana', 'tarde', 'noche'];
    const compactacionValidos = ['baja', 'media', 'alta'];

    if (!turnosValidos.includes(turno)) {
      return res.status(400).json({ message: 'Turno inválido' });
    }

    if (!compactacionValidos.includes(compactacion)) {
      return res.status(400).json({ message: 'Nivel de compactación inválido' });
    }

    const preferencias = await preferencesService.savePreferences(id, { turno, diasEvitar, compactacion });

    return res.json({ preferencias });
  } catch (err) {
    console.log("Error" + err.message);
  }
};

export async function getPreferences(req, res, next) {
  try {
    const userIdParam = req.params.id

    if (!req.user || req.user.id !== userIdParam) {
      return res.status(403).json({ message: 'No tienes permiso para ver estas preferencias' })
    }

    const preferencias = await preferencesService.getUserPreferences(userIdParam)

    return res.json({ preferencias })
  } catch (err) {
    console.log("Error" + err.message);
  }
}
