import http from "./http";


export const obtenerUsuarios = () => http.get('/users')

export const crearUsuario = (usuario) => http.post('/users', usuario)

export const editarUsuario = (id, data) => http.patch(`/users/${id}`, data)

export const eliminarUsuario = (id) => http.delete(`/users/${id}`)