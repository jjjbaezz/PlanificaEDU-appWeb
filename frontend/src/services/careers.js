import http from './http';

export const fetchCareers = (params = {}) =>
  http.get('/admin/carreras', { params });

export const fetchCareerById = (id) =>
  http.get(`/admin/carreras/${id}`);

export const createCareer = (data) =>
  http.post('/admin/carreras', data);

export const updateCareer = (id, data) =>
  http.put(`/admin/carreras/${id}`, data);

export const deleteCareer = (id) =>
  http.delete(`/admin/carreras/${id}`);

export default {
  fetchCareers,
  fetchCareerById,
  createCareer,
  updateCareer,
  deleteCareer,
};
