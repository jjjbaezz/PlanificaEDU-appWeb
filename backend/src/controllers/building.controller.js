import * as buildingsService from '../services/buildings.service.js';


// GET /buildings
export const getAll = async (req, res) => {
    try {
        const result = await buildingsService.listBuildings(req.query);
        if (!result.items.length) {
            return res.status(204).json({ message: 'No hay edificios disponibles' });
        }
        return res.status(200).json(result);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error al obtener los edificios', error: err.message });
    }
};
  


// GET /buildings/:id
export const getById = async (req, res) => {
    try {
        const { id } = req.params;
        const building = await buildingsService.getBuildingById(String(id));
        return res.status(200).json(building);
    } catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Error al obtener el edificio' });
    }
};


// POST /buildings
export const create = async (req, res) => {
  try {
    const newBuilding = await buildingsService.createBuilding(req.body);
    return res.status(201).json(newBuilding);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Error al crear el edificio' });
  }
};

// PUT /buildings/:id
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await buildingsService.updateBuilding(String(id), req.body);
    return res.status(200).json(updated);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({ message: err.message || 'Error al actualizar el edificio' });
  }
};


// DELETE /buildings/:id
export const remove = async (req, res) => {
    try {
        const { id } = req.params;
        await buildingsService.deleteBuilding(String(id));
        return res.status(200).json({ message: 'Edificio eliminado correctamente' });
    } catch (err) {
        console.error(err);
        return res.status(err.status || 500).json({ message: err.message || 'Error al eliminar el edificio' });
    }
};



