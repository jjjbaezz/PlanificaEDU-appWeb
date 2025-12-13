import http from './http';

const ENDPOINT = '/classroom';

export default {
  fetchAulas() {
    return http.get(ENDPOINT);
  },
  getAula(id) {
    return http.get(`${ENDPOINT}/${id}`);
  },
  createAula(data) {
    return http.post(ENDPOINT, data);
  },
  updateAula(id, data) {
    return http.put(`${ENDPOINT}/${id}`, data);
  },
  deleteAula(id) {
    return http.delete(`${ENDPOINT}/${id}`);
  },
};
