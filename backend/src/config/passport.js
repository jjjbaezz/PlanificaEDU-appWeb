import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import {Strategy as LocalStrategy} from 'passport-local';
import bcrypt from 'bcryptjs';
import {prisma} from '../prisma.js';
import dotenv from 'dotenv';

dotenv.config();

// Estrategia local
passport.use(new LocalStrategy({
    usernameField: 'email',
    passwordField: 'password',
    session: false},
    
    async (email, password, done) =>{
        try {
            const user = await prisma.usuarios.findUnique({where: {email}});

            if(!user || !user.password_hash){
                return done(null, false, {message: 'Usuario no encontrado'});
            }

            const ok = await bcrypt.compare(password, user.password_hash);

            if(!ok) return done(null, false, {message: 'Credenciales incorrectas'});

            const {password_hash, ...safeUser} = user;

            return done(null, safeUser);

        } catch (error) {
            return done(error);
        }
    }
     ))


// Estrategia JWT
passport.use(new JwtStrategy({
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET
}, async (payload, done) =>{ 
    try {
        const user = await prisma.usuarios.findUnique({where: {id: payload.sub}});
        if(!user || user.activo === false) return done(null, false, {message: 'Usuario no encontrado'});
        const {password_hash, ...safeUser} = user;
        return done(null, safeUser);
    } catch (error) {
        return done(error);
    }
}))


export default passport;