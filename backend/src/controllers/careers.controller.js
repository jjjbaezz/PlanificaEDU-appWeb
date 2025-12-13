import carreraService from '../services/careers.service.js';

export const listCarreras = async (req, res) => {
  try {
    const carreras = await carreraService.getAllCarreras();
    return res.status(200).json(carreras);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error al listar carreras' });
  }
};

export const createCarrera = async (req, res) => {
  try {
    const { codigo, nombre } = req.body;
    if (!codigo || !nombre) {
      return res.status(400).json({ error: 'Código y nombre son requeridos' });
    }
    const nuevaCarrera = await carreraService.createCarrera({ codigo, nombre });
    return res.status(201).json({ message: 'Carrera creada exitosamente', carrera: nuevaCarrera });
  } catch (error) {
    if (error.code === 'P2002' || error.message === 'DUPLICATE') {
      return res.status(409).json({ error: 'El código o nombre de carrera ya existe' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Error al crear carrera' });
  }
};

export const updateCarrera = async (req, res) => {
  try {
    const carreraId = String(req.params.id);
    const { codigo, nombre } = req.body;
    if (!codigo && !nombre) {
      return res.status(400).json({ error: 'No hay datos para actualizar' });
    }
    const carreraActualizada = await carreraService.updateCarrera(carreraId, { codigo, nombre });
    return res.status(200).json({ message: 'Carrera actualizada', carrera: carreraActualizada });
  } catch (error) {
    if (error.message === 'DUPLICATE') {
      return res.status(409).json({ error: 'Código o nombre duplicado' });
    }
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Error al actualizar carrera' });
  }
};

export const deleteCarrera = async (req, res) => {
  try {
    const carreraId = String(req.params.id);
    await carreraService.deleteCarrera(carreraId);
    return res.status(204).send();
  } catch (error) {
    if (error.message === 'NOT_FOUND') {
      return res.status(404).json({ error: 'Carrera no encontrada' });
    }
    if (error.message === 'FORBIDDEN_DELETE') {
      return res.status(400).json({ error: 'No se puede eliminar la carrera porque tiene elementos asociados' });
    }
    console.error(error);
    return res.status(500).json({ error: 'Error al eliminar carrera' });
  }
};
