import { prisma } from '../prisma.js';


// GET /subjects
export const getAll = async (req, res) => {

    try {

        const buildings = await prisma.edificios.findMany();
        if(buildings.length === 0){
            return res.status(204).json({message: "No hay edificios disponibles"});
        }
        return res.status(200).json({buildings});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener los edificios", error: err.message});
    }
  

}

// GET /subjects/id
export const getById = async (req, res) => {

    try {
        const { id } = req.params;
        const building = await prisma.edificios.findUnique({where:{id:String(id)}});

        if(!building){
            return res.status().json({message: "Edificio no encontrada"});
        }
        return res.status(200).json({building});
    }
    catch(err){
        console.error(err);
        return res.status(500).json({message: "Error al obtener el edificio", error: err.message});
    }
  

}

// POST /subjects

export const create = async (req, res) => {

    try{
        const {codigo, nombre}= req.body;

        if(!nombre || !codigo   ){

            return res.status(400).json({message:"Faltan datos obligatorios del edificio"});
        }
        
        const newBuilding = await prisma.edificios.create({
            data:{
                codigo,
                nombre,
              
            }
        });

        return res.status(201).json(newBuilding);
    }
    catch(err){
        console.error(err);
        return res.status(500).json({
            message: "Error al crear el edificio", 
            error: err.message
        });
    }
}

// PUT /subjects

export const update = async (req, res) => {

    try{
        const {id} = req.params;
       const {codigo, nombre}= req.body;


        const newBuilding = await prisma.edificios.update({
            where:{id: String(id)},
            data:{
                nombre,
                codigo,
            }
        });

        return res.status(200).json(newBuilding);
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Edificio no encontrada" });
    }
        return res.status(500).json({
            message: "Error al atualizar el edificio", 
            error: err.message
        });
    }
}


// REMOVE /subjects

export const remove = async (req, res) => {

    try{
        const {id} = req.params;
       


       await prisma.edificios.delete({
            where:{id:String(id)},
       });

        return res.status(200).json({message: "Edficio eliminada correctamente"});
    }
    catch(err){
        console.error(err);

        if (err.code === "P2025") {
        return res.status(404).json({ message: "Edificio no encontrada" });
    }
        return res.status(500).json({
            message: "Error al eliminar el Edificio", 
            error: err.message
        });
    }
}



