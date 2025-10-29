import { prisma } from '../prisma.js';


// GET /subjects
export const getAll = async (req, res) => {

    try {

        const periods = await prisma.periodos.findMany();
        if(periods.length === 0){
            return res.status(204).json({message: "No hay periodos disponibles"});
        }
        return res.status(200).json({periods});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener los periodos", error: err.message});
    }
  

}

// GET /subjects/id
export const getById = async (req, res) => {

    try {
        const { id } = req.params;
        const period = await prisma.periodos.findUnique({where:{id:String(id)}});

        if(!period){
            return res.status().json({message: "Periodo no encontrada"});
        }
        return res.status(200).json({period});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener el periodo", error: err.message});
    }
  

}

// POST /subjects

export const create = async (req, res) => {

    try{
        const {nombre, fecha_inicio,fecha_fin}= req.body;

        if(!nombre || !fecha_inicio || !fecha_fin ){

            return res.status(400).json({message:"Faltan datos obligatorios del periodo"});
        }
        
        const newPeriod = await prisma.periodos.create({
            data:{
                nombre,
                fecha_inicio,
                fecha_fin
              
            }
        });

        return res.status(201).json(newPeriod);
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            message: "Error al crear el periodo", 
            error: err.message
        });
    }
}

// PUT /subjects

export const update = async (req, res) => {

    try{
        const {id} = req.params;
        const {nombre, fecha_inicio,fecha_fin}= req.body;


        const newPeriod = await prisma.periodos.update({
            where:{id: String(id)},
            data:{
                nombre,
                fecha_inicio,
                fecha_fin
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
       


       await prisma.periodos.delete({
            where:{id:String(id)},
       });

        return res.status(200).json({message: "Periodo eliminada correctamente"});
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Periodo no encontrada" });
    }
        return res.status(500).json({
            message: "Error al eliminar el Periodo", 
            error: err.message
        });
    }
}



