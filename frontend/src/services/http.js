import axios from 'axios';

const http = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    headers: {'Content-Type': 'application/json'},
    withCredentials: false
})

http.interceptors.request.use(config => {
    const token = localStorage.getItem('token');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
})

http.interceptors.response.use(
  (res) => res,
  (err) => {

    if (err?.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
     
    }
    return Promise.reject(err)
  }
)

export default http
