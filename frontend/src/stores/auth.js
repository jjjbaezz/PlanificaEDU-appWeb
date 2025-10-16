
import { defineStore } from 'pinia'
import http from '../services/http'

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: JSON.parse(localStorage.getItem('user') || 'null'),
    token: localStorage.getItem('token') || '',
    loading: false,
    error: null,
  }),
  getters: {
    isAuth: (s) => !!s.token && !!s.user,
    userId: (s) => s.user?.id || null,
    userRole: (s) => s.user?.rol || null,
  },
  actions: {
    _setSession({ user, token }) {
      this.user = user
      this.token = token
      localStorage.setItem('user', JSON.stringify(user))
      localStorage.setItem('token', token)
    },
    _clearSession() {
      this.user = null
      this.token = ''
      localStorage.removeItem('user')
      localStorage.removeItem('token')
    },

    async register(payload) {
      this.loading = true; this.error = null
      try {
        const { data } = await http.post('/auth/register', payload)
        this._setSession(data)
        return data.user
      } catch (e) {
        this.error = e.response?.data?.message || e.message
        throw e
      } finally { this.loading = false }
    },

    async login(payload) {
      this.loading = true; this.error = null
      try {
        const { data } = await http.post('/auth/login', payload)
        this._setSession(data)
        return data.user
      } catch (e) {
        this.error = e.response?.data?.message || e.message
        throw e
      } finally { this.loading = false }
    },

    async me() {
      if (!this.token) return null
      try {
        const { data } = await http.get('/auth/me')
        this._setSession({ user: data.user, token: this.token })
        return data.user
      } catch (e) {
        // Token inválido
        this._clearSession()
        return null
      }
    },

    logout() {
      this._clearSession()
    },
  },
})
