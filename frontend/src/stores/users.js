// src/stores/users.js
import { defineStore } from 'pinia'
import http from '../services/http'
import { useAuthStore } from './auth'

export const useUsersStore = defineStore('users', {
  state: () => ({
    saving: false,
    error: null,
    preferences: null,
  }),
  actions: {
    async updateRole(rol) {
      const auth = useAuthStore()
      if (!auth.userId) throw new Error('No userId')
      this.saving = true; this.error = null
      try {
        const { data } = await http.patch(`/users/${auth.userId}/role`, { rol })
        auth.user = data.user
        localStorage.setItem('user', JSON.stringify(data.user))
        return data.user
      } catch (e) {
        this.error = e.response?.data?.message || e.message
        throw e
      } finally { this.saving = false }
    },

    async savePreferences(payload) {
      const auth = useAuthStore()
      if (!auth.userId) throw new Error('No userId')
      this.saving = true; this.error = null
      try {
        const { data } = await http.put(`/users/${auth.userId}/preferences`, payload)
        this.preferences = data.preferencias
        return data.preferencias
      } catch (e) {
        this.error = e.response?.data?.message || e.message
        throw e
      } finally { this.saving = false }
    },

    async fetchPreferences(){
      const auth = useAuthStore();

      if(!auth.userId) throw new Error('No existe un usuario logueado ahora mismo');

      this.error = null;

      try {
        const { data } = await http.get(`/users/${auth.userId}/preferences`)

        this.preferences = data.preferencias

        return data.preferencias

      } catch (error) {
        if (e.response?.status === 404) {
          this.preferences = null
          return null
        }
        this.error = e.response?.data?.message || e.message
        throw e
      }
    }
  },
})
