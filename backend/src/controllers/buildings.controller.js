import * as buildingsService from '../services/buildings.service.js';

const ensureAdmin = (user) => {
  if (!user || user.rol !== 'ADMIN') {
    const err = new Error('Requiere rol ADMIN');
    err.status = 403;
    throw err;
  }
};

export const listBuildings = async (req, res) => {
  try {
    const result = await buildingsService.listBuildings(req.query);
    return res.json(result);
  } catch (error) {
    console.error('Error listando edificios:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const getBuildingById = async (req, res) => {
  try {
    const result = await buildingsService.getBuildingById(req.params.id);
    return res.json(result);
  } catch (error) {
    console.error('Error obteniendo edificio:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const createBuilding = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const result = await buildingsService.createBuilding(req.body);
    return res.status(201).json(result);
  } catch (error) {
    console.error('Error creando edificio:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const updateBuilding = async (req, res) => {
  try {
    ensureAdmin(req.user);
    const result = await buildingsService.updateBuilding(req.params.id, req.body);
    return res.json(result);
  } catch (error) {
    console.error('Error actualizando edificio:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const deleteBuilding = async (req, res) => {
  try {
    ensureAdmin(req.user);
    await buildingsService.deleteBuilding(req.params.id);
    return res.status(204).send();
  } catch (error) {
    console.error('Error eliminando edificio:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const validateBuildingCode = async (req, res) => {
  try {
    const result = await buildingsService.validateBuildingCode(req.query.codigo);
    return res.json(result);
  } catch (error) {
    console.error('Error validando c�digo:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};

export const listBuildingClassrooms = async (req, res) => {
  try {
    const result = await buildingsService.listBuildingClassrooms(req.params.id);
    return res.json(result);
  } catch (error) {
    console.error('Error listando aulas:', error);
    return res.status(error.status || 500).json({ message: error.message || 'Error interno del servidor' });
  }
};
