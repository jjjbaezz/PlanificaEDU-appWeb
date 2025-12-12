// services/preferences.service.js
import { prisma } from '../prisma.js';

// Mapeo CORREGIDO - frontend usa minúsculas, Prisma usa mayúsculas
const turnoMap = {
    manana: 'MANANA',
    tarde: 'TARDE',
    noche: 'NOCHE'
};

const diasMap = {
    lunes: 'LUN',
    martes: 'MAR',
    miercoles: 'MIE',
    jueves: 'JUE',
    viernes: 'VIE',
    sabado: 'SAB',
    domingo: 'DOM'
};

const compactacionMap = {
    baja: 3,
    media: 5,
    alta: 8
};

export async function savePreferences(usuarioId, { turno, diasEvitar, compactacion }) {
    console.log('📥 Datos recibidos en savePreferences:', {
        usuarioId,
        turno,
        diasEvitar,
        compactacion,
        tipoDiasEvitar: typeof diasEvitar,
        esArray: Array.isArray(diasEvitar)
    });

    // Validar y mapear turno
    const turnoEnum = turnoMap[turno] || 'MANANA'; 
    console.log('🔄 Turno mapeado:', turno, '→', turnoEnum);

    const compactacionValue = compactacionMap[compactacion] || 5;
    console.log('🔄 Compactación mapeada:', compactacion, '→', compactacionValue);

    const diasEvitarArray = Array.isArray(diasEvitar) ? diasEvitar : [];
    
    // Mapear a valores enum de Prisma
    const evitarDiasEnum = diasEvitarArray
        .map(dia => {
            const mapeado = diasMap[dia.toLowerCase()];
            console.log('📅 Mapeando día:', dia, '→', mapeado);
            return mapeado;
        })
        .filter(Boolean);

    console.log('✅ Días mapeados finales:', evitarDiasEnum);

    // Crear objeto de pesos
    const pesos = {
        turno: turnoEnum,
        pesoTurno: 1,
        pesoCompactacion: 1,
    };

    console.log('📤 Datos a guardar en Prisma:', {
        usuario_id: usuarioId,
        turno_preferido: turnoEnum,
        compactacion: compactacionValue,
        evitar_dias: evitarDiasEnum,
        pesos
    });

    try {
        const preferencias = await prisma.preferencias_usuario.upsert({
            where: { usuario_id: usuarioId },
            update: {
                turno_preferido: turnoEnum,
                compactacion: compactacionValue,
                evitar_dias: evitarDiasEnum, // Array directo, sin { set: }
                pesos,
            },
            create: {
                usuario_id: usuarioId,
                turno_preferido: turnoEnum,
                compactacion: compactacionValue,
                evitar_dias: evitarDiasEnum,
                pesos,
            }
        });

        console.log('✅ Preferencias guardadas exitosamente:', preferencias);
        return preferencias;
    } catch (error) {
        console.error('❌ Error en savePreferences:', {
            mensaje: error.message,
            detalles: error
        });
        throw error;
    }
}

export async function getUserPreferences(usuarioId) {
    return prisma.preferencias_usuario.findUnique({
        where: { usuario_id: usuarioId }
    });
}