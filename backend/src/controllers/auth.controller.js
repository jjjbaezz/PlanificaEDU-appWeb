import { prisma } from '../prisma.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


const signToken = (user) =>{
    return jwt.sign({
        sub: user.id,
        email: user.email
    }, process.env.JWT_SECRET, {expiresIn: process.env.JWT_EXPIRES_IN});
}

// POST /auth/register
export const register = async (req, res) => {
  try {

    const { nombre, apellido, email, password, carrera_id } = req.body;
    if (!nombre || !email || !password) {
      return res.status(400).json({ message: 'nombre, email y password son obligatorios' });
    }

    const exists = await prisma.usuarios.findUnique({ where: { email } });
    if (exists) return res.status(409).json({ message: 'El email ya está registrado' });

    const password_hash = await bcrypt.hash(password, 12);
    const fullName = apellido ? `${nombre} ${apellido}` : nombre;

    const user = await prisma.usuarios.create({
      data: { nombre: fullName, email, rol: "ESTUDIANTE", password_hash, carrera_id }
    });

    const token = signToken(user);
    const { password_hash: _omit, ...safe } = user;
    return res.status(201).json({ user: safe, token });
  } catch (err) {
    console.error('Register error:', err);
    return res.status(500).json({ message: `Error interno del servidor - ${err.message}` });
  }
};


// POST /auth/login
export const login = async (req, res) => {

  const user = req.user;
  const token = signToken(user);
  return res.json({ user, token });
};


// GET /auth/me
export const me = async (req, res) => {
  return res.json({ user: req.user });
};