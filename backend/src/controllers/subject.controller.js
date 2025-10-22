import { prisma } from '../prisma.js';


// GET /subjects
export const getAll = async (req, res) => {

    try {

        const subjects = await prisma.materias.findMany();
        if(subjects.length === 0){
            return res.status(204).json({message: "No hay materias disponibles"});
        }
        return res.status(200).json({subjects});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener las materias", error: err.message});
    }
  

}

// GET /subjects/id
export const getById = async (req, res) => {

    try {
        const { id } = req.params;
        const subject = await prisma.materias.findUnique({where:{id:String(id)}});

        if(!subject){
            return res.status().json({message: "Materia no encontrada"});
        }
        return res.status(200).json({subject});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener la materia", error: err.message});
    }
  

}

// POST /subjects

export const create = async (req, res) => {

    try{
        const {carrera_id, codigo,nombre,creditos,}= req.body;

        if(!carrera_id || !codigo || !nombre || !creditos  ){

            return res.status(400).json({message:"Faltan datos obligatorios de la materia"});
        }
        
        const newSubject = await prisma.materias.create({
            data:{
                carrera_id,
                codigo,
                nombre,
                creditos,
            }
        });

        return res.status(201).json(newSubject);
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            message: "Error al crear la materia", 
            error: err.message
        });
    }
}

// PUT /subjects

export const update = async (req, res) => {

    try{
        const {id} = req.params;
        const {carrera_id, codigo,nombre,creditos,}= req.body;


        const newSubject = await prisma.materias.update({
            where:{id: String(id)},
            data:{
                carrera_id,
                codigo,
                nombre,
                creditos,
            }
        });

        return res.status(200).json(newSubject);
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Materia no encontrada" });
    }
        return res.status(500).json({
            message: "Error al atualizar la materia", 
            error: err.message
        });
    }
}


// REMOVE /subjects

export const remove = async (req, res) => {

    try{
        const {id} = req.params;
       


       await prisma.materias.delete({
            where:{id:String(id)},
       });

        return res.status(200).json({message: "Materia eliminada correctamente"});
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Materia no encontrada" });
    }
        return res.status(500).json({
            message: "Error al eliminar la materia", 
            error: err.message
        });
    }
}



