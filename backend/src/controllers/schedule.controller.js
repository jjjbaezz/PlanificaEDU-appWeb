import { prisma } from '../prisma.js';


// GET /subjects
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

// GET /subjects/id
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

// POST /subjects

export const create = async (req, res) => {

    try{
        const {periodo_id, estado,score,creado_por,created_at}= req.body;

        if(!periodo_id || !estado || !score || !creado_por || !created_at ){

            return res.status(400).json({message:"Faltan datos obligatorios del horario"});
        }
        
        const newSchedule = await prisma.horarios.create({
            data:{
                periodo_id,
                estado,
                score,
                creado_por,
                created_at


              
            }
        });

        return res.status(201).json(newSchedule);
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            message: "Error al crear el horario", 
            error: err.message
        });
    }
}

// PUT /subjects

export const update = async (req, res) => {

    try{
        const {id} = req.params;
        const {periodo_id, estado,score,creado_por,created_at}= req.body;


        const newPeriod = await prisma.periodos.update({
            where:{id: String(id)},
            data:{
                periodo_id,
                estado,
                score,
                creado_por,
                created_at
            }
        });

        return res.status(200).json(newPeriod);
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Periodo no encontrada" });
    }
        return res.status(500).json({
            message: "Error al atualizar el periodo", 
            error: err.message
        });
    }
}


// REMOVE /subjects

export const remove = async (req, res) => {

    try{
        const {id} = req.params;
       


       await prisma.horarios.delete({
            where:{id:String(id)},
       });

        return res.status(200).json({message: "Periodo eliminada correctamente"});
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Horario no encontrada" });
    }
        return res.status(500).json({
            message: "Error al eliminar el Horario", 
            error: err.message
        });
    }
}



