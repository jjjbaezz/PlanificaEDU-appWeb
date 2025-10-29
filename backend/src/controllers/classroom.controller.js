import { prisma } from '../prisma.js';


// GET /subjects
export const getAll = async (req, res) => {

    try {

        const classroom = await prisma.aulas.findMany();
        if(classroom.length === 0){
            return res.status(204).json({message: "No hay aulas disponibles"});
        }
        return res.status(200).json({classroom});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener las aulas", error: err.message});
    }
  

}

// GET /subjects/id
export const getById = async (req, res) => {

    try {
        const { id } = req.params;
        const classroom = await prisma.aulas.findUnique({where:{id:String(id)}});

        if(!classroom){
            return res.status().json({message: "Aula no encontrada"});
        }
        return res.status(200).json({classroom});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener la aula", error: err.message});
    }
  

}

// POST /subjects

export const create = async (req, res) => {

    try{
        const {edificio_id, codigo,capacidad,tipo}= req.body;

        if(!edificio_id || !codigo || !capacidad || !tipo  ){

            return res.status(400).json({message:"Faltan datos obligatorios de la aula"});
        }
        
        const newClassroom = await prisma.aulas.create({
            data:{
                edificio_id,
                codigo,
                capacidad,
                tipo,
            }
        });

        return res.status(201).json(newClassroom);
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            message: "Error al crear la aula", 
            error: err.message
        });
    }
}

// PUT /subjects

export const update = async (req, res) => {

    try{
        const {id} = req.params;
       const {edificio_id, codigo,capacidad,tipo}= req.body;


        const newClassroom = await prisma.aulas.update({
            where:{id: String(id)},
            data:{
                edificio_id,
                codigo,
                capacidad,
                tipo,
            }
        });

        return res.status(200).json(newClassroom);
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Aula no encontrada" });
    }
        return res.status(500).json({
            message: "Error al atualizar la aula", 
            error: err.message
        });
    }
}


// REMOVE /subjects

export const remove = async (req, res) => {

    try{
        const {id} = req.params;
       


       await prisma.aulas.delete({
            where:{id:String(id)},
       });

        return res.status(200).json({message: "Aula eliminada correctamente"});
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Aula no encontrada" });
    }
        return res.status(500).json({
            message: "Error al eliminar la Aula", 
            error: err.message
        });
    }
}



