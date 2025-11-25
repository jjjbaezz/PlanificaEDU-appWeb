import { prisma } from '../prisma.js';

const parseOptionalBoolean = (value) => {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
        if (value.toLowerCase() === 'true') return true;
        if (value.toLowerCase() === 'false') return false;
    }
    return undefined;
};

const validateDates = (start, end) => {
    const fechaInicio = new Date(start);
    const fechaFin = new Date(end);
    if (Number.isNaN(fechaInicio.getTime()) || Number.isNaN(fechaFin.getTime())) {
        return { valid: false, message: 'Fechas inválidas. Usa un formato ISO (YYYY-MM-DD).' };
    }
    if (fechaInicio > fechaFin) {
        return { valid: false, message: 'La fecha de inicio debe ser anterior a la fecha de fin.' };
    }
    return { valid: true };
};

const getDeletionConstraints = async (periodId) => {
    const [schedules, enrollments] = await Promise.all([
        prisma.horarios.count({ where: { periodo_id: periodId } }),
        prisma.inscripciones.count({ where: { grupos: { periodo_id: periodId } } }),
    ]);
    return { schedules, enrollments };
};

// GET /periods
export const getAll = async (_req, res) => {
    try {
        const periods = await prisma.periodos.findMany({
            orderBy: { fecha_inicio: 'desc' },
            include: {
                _count: {
                    select: {
                        horarios: true,
                        grupos: true,
                    },
                },
            },
        });

        if (!periods.length) {
            return res.status(200).json({ periods: [] });
        }

        const withEnrollments = await Promise.all(
            periods.map(async (period) => {
                const enrollments = await prisma.inscripciones.count({
                    where: { grupos: { periodo_id: period.id } },
                });

                return {
                    id: period.id,
                    nombre: period.nombre,
                    fecha_inicio: period.fecha_inicio,
                    fecha_fin: period.fecha_fin,
                    activo: period.activo,
                    _count: {
                        horarios: period._count.horarios,
                        grupos: period._count.grupos,
                        inscripciones: enrollments,
                    },
                };
            })
        );

        return res.status(200).json({ periods: withEnrollments });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al obtener los periodos', error: err.message });
    }
};

// GET /periods/:id
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const period = await prisma.periodos.findUnique({ where: { id: String(id) } });

        if (!period) {
            return res.status(404).json({ message: 'Periodo no encontrado' });
        }
        return res.status(200).json({ period });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al obtener el periodo', error: err.message });
    }
};

// POST /periods
export const create = async (req, res) => {
    try {
        const { nombre, fecha_inicio, fecha_fin } = req.body;
        const booleanFlag = parseOptionalBoolean(req.body.activo);

        if (!nombre || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({ message: 'Faltan datos obligatorios del periodo' });
        }

        const validation = validateDates(fecha_inicio, fecha_fin);
        if (!validation.valid) {
            return res.status(400).json({ message: validation.message });
        }

        const data = {
            nombre: nombre.trim(),
            fecha_inicio,
            fecha_fin,
        };

        if (typeof booleanFlag === 'boolean') {
            data.activo = booleanFlag;
        }

        const newPeriod = await prisma.$transaction(async (tx) => {
            const created = await tx.periodos.create({ data });
            if (created.activo) {
                await tx.periodos.updateMany({
                    where: { id: { not: created.id } },
                    data: { activo: false },
                });
            }
            return created;
        });

        return res.status(201).json(newPeriod);
    } catch (err) {
        console.error(err);
        return res.status(500).json({
            message: 'Error al crear el periodo',
            error: err.message,
        });
    }
};

// PUT /periods/:id
export const update = async (req, res) => {
    try {
        const { id } = req.params;
        const { nombre, fecha_inicio, fecha_fin } = req.body;
        const booleanFlag = parseOptionalBoolean(req.body.activo);

        if (!nombre || !fecha_inicio || !fecha_fin) {
            return res.status(400).json({ message: 'Faltan datos obligatorios del periodo' });
        }

        const validation = validateDates(fecha_inicio, fecha_fin);
        if (!validation.valid) {
            return res.status(400).json({ message: validation.message });
        }

        const data = {
            nombre: nombre.trim(),
            fecha_inicio,
            fecha_fin,
        };

        if (typeof booleanFlag === 'boolean') {
            data.activo = booleanFlag;
        }

        const updatedPeriod = await prisma.$transaction(async (tx) => {
            const updated = await tx.periodos.update({
                where: { id: String(id) },
                data,
            });

            if (updated.activo) {
                await tx.periodos.updateMany({
                    where: { id: { not: updated.id } },
                    data: { activo: false },
                });
            }

            return updated;
        });

        return res.status(200).json(updatedPeriod);
    } catch (err) {
        console.error(err);

        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Periodo no encontrado' });
        }
        return res.status(500).json({
            message: 'Error al actualizar el periodo',
            error: err.message,
        });
    }
};

// PATCH /periods/:id/activate
export const setActive = async (req, res) => {
    try {
        const { id } = req.params;
        const updated = await prisma.$transaction(async (tx) => {
            await tx.periodos.updateMany({ data: { activo: false } });
            return tx.periodos.update({ where: { id: String(id) }, data: { activo: true } });
        });
        return res.status(200).json(updated);
    } catch (err) {
        console.error(err);
        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Periodo no encontrado' });
        }
        return res.status(500).json({ message: 'Error al activar el periodo', error: err.message });
    }
};

// DELETE /periods/:id
export const remove = async (req, res) => {
    try {
        const { id } = req.params;

        const locks = await getDeletionConstraints(String(id));
        if (locks.schedules > 0 || locks.enrollments > 0) {
            return res.status(409).json({
                message: 'No se puede eliminar el periodo porque ya tiene horarios o inscripciones generadas',
                detail: locks,
            });
        }

        await prisma.periodos.delete({
            where: { id: String(id) },
        });

        return res.status(200).json({ message: 'Periodo eliminado correctamente' });
    } catch (err) {
        console.error(err);

        if (err.code === 'P2025') {
            return res.status(404).json({ message: 'Periodo no encontrado' });
        }
        return res.status(500).json({
            message: 'Error al eliminar el periodo',
            error: err.message,
        });
    }
};



