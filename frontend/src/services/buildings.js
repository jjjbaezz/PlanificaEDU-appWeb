import http from './http';

export const fetchBuildings = (params = {}) => http.get('/buildings', { params });
export const fetchBuildingById = (id) => http.get(`/buildings/${id}`);
export const createBuilding = (data) => http.post('/buildings', data);
export const updateBuilding = (id, data) => http.put(`/buildings/${id}`, data);
export const deleteBuilding = (id) => http.delete(`/buildings/${id}`);

export default {
  fetchBuildings,
  fetchBuildingById,
  createBuilding,
  updateBuilding,
  deleteBuilding,
};
