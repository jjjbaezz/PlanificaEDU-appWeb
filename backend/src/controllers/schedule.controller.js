import { prisma } from '../prisma.js';


// GET /shcedules
export const getAll = async (req, res) => {

    try {

        const schedules = await prisma.horarios.findMany();
        if(schedules.length === 0){
            return res.status(204).json({message: "No hay horarios disponibles"});
        }
        return res.status(200).json({schedules});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener los horarios", error: err.message});
    }
  

}

export const generate = async (req, res) => {
  try {
    const { periodo_id } = req.body;
    if (!periodo_id) return res.status(400).json({ message: 'periodo_id es obligatorio' });

    const adminId = req.user?.id ?? null; // requireAuth middleware usualmente pone req.user
    const result = await generateSchedule(periodo_id, {}, adminId);

    return res.status(201).json({
      message: 'Generación completada',
      horario: result.horario,
      summary: { assigned: result.assignments.length, unassigned: result.unassigned.length, score: result.score },
      unassigned: result.unassigned
    });
  } catch (err) {
    console.error('Generate schedule error:', err);
    return res.status(500).json({ message: 'Error generando horario', error: err.message });
  }
};

// GET /shcedules/id
export const getById = async (req, res) => {

    try {
        const { id } = req.params;
        const schedule = await prisma.horarios.findUnique({where:{id:String(id)}});

        if(!schedule){
            return res.status().json({message: "Horario no encontrada"});
        }
        return res.status(200).json({schedule});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener el horario", error: err.message});
    }
  

}




