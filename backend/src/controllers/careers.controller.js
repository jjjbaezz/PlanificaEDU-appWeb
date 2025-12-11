import { prisma } from '../prisma.js';


// GET /careers
export const getAll = async (req, res) => {

    try {
        console.log('[GET /careers] Request received');
        const careers = await prisma.carreras.findMany();
        console.log('[GET /careers] Careers found:', Array.isArray(careers) ? careers.length : 0);
        if (!Array.isArray(careers) || careers.length === 0) {
            return res.status(204).json({message: "No hay carreras disponibles"});
        }
        return res.status(200).json({careers});
    }
    catch(err){
        console.error('[GET /careers] Error:', err);
        return res.status(500).json({message: "Error al obtener las carreras", error: err.message});
    }
}

// GET /careers/id
export const getById = async (req, res) => {

    try {

        const { id } = req.params;
        const careers = await prisma.carreras.findUnique({where:{id:String(id)}});

        if(!careers){
            return res.status().json({message: "Carrera no encontrada"});
        }
        return res.status(200).json({careers});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener la carrera", error: err.message});
    }
  

}

// POST /careers

export const create = async (req, res) => {

    try{
        const {codigo, nombre}= req.body;

        if(!codigo || !nombre){

            return res.status(400).json({message:"Faltan datos obligatorios de la carrera"});
        }
        
        const newCareer = await prisma.carreras.create({
            data:{
                codigo,
                nombre,
            }
        });

        return res.status(201).json(newCareer);
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            message: "Error al crear la carrera", 
            error: err.message
        });
    }
}

// PUT /careers

export const update = async (req, res) => {

    try{
        const {id} = req.params;
        const {codigo, nombre}= req.body;


        const newCareer = await prisma.carreras.update({
            where:{id: String(id)},
            data:{
                codigo,
                nombre,
           
            }
        });

        return res.status(200).json(newCareer);
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Carrera no encontrada" });
    }
        return res.status(500).json({
            message: "Error al atualizar la carrera", 
            error: err.message
        });
    }
}

// PATCH /careers

export const partialUpdate = async (req, res) => {

    try{
        const {id} = req.params;
        const data= req.body;



        const updatedCareers = await prisma.carreras.update({
        where: { id },
        data, 
        });

        return res.status(200).json(updatedCareers);
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Carrera no encontrada" });
    }
        return res.status(500).json({
            message: "Error al atualizar la carrera", 
            error: err.message
        });
    }
}



// REMOVE /careers

export const remove = async (req, res) => {

    try{
        const {id} = req.params;
       


       await prisma.carreras.delete({
            where:{id:String(id)},
       });

        return res.status(200).json({message: "Carrera eliminada correctamente"});
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Carrera no encontrada" });
    }
        return res.status(500).json({
            message: "Error al eliminar la carrera", 
            error: err.message
        });
    }
}



