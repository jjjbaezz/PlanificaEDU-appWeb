import http from './http';

export const fetchCareers = (params = {}) =>
  http.get('/careers', { params });

export const fetchCareerById = (id) =>
  http.get(`/careers/${id}`);

export const createCareer = (data) =>
  http.post('/careers', data);

export const updateCareer = (id, data) =>
  http.put(`/careers/${id}`, data);

export const deleteCareer = (id) =>
  http.delete(`/careers/${id}`);

export default {
  fetchCareers,
  fetchCareerById,
  createCareer,
  updateCareer,
  deleteCareer,
};
