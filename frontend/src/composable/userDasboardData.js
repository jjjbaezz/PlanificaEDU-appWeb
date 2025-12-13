// src/composables/useDashboardData.js
import { ref } from 'vue'
import http from '../services/http'

export function useDashboardData() {
  const loading = ref(false)
  const error = ref(null)

  // Admin
  const adminStats = ref({
    totalUsuarios: 0,
    carrerasActivas: 0,
    periodoActual: '—',
    gruposAbiertos: 0,
  })

  const ocupacionPorCarrera = ref([]) // placeholder (no backend)
  const alertas = ref([])             // placeholder (no backend)
  const ultimasInscripciones = ref([])// placeholder (no backend)

  async function loadAdmin() {
    loading.value = true
    error.value = null

    try {
      // 1) usuarios
      const usersRes = await http.get('/users')
      const users = usersRes?.data?.users || []
      adminStats.value.totalUsuarios = users.length

      // 2) carreras
      const careersRes = await http.get('/careers')
      const careers = careersRes?.data?.careers || careersRes?.data?.data || careersRes?.data || []
      adminStats.value.carrerasActivas = Array.isArray(careers) ? careers.length : 0

      // 3) periodo actual (activo)
      const periodsRes = await http.get('/periods')
      const periods = periodsRes?.data?.periods || periodsRes?.data || []
      const activo = Array.isArray(periods) ? periods.find(p => p.activo) : null
      adminStats.value.periodoActual = activo?.nombre || '—'

      // 4) grupos abiertos (si NO tienes endpoint, lo dejamos en 0)
      // Si EXISTE endpoint en tu sistema (ej: /schedules o /groups) lo conectamos aquí.
      adminStats.value.gruposAbiertos = 0

      // placeholders (hasta que haya backend)
      ocupacionPorCarrera.value = []
      alertas.value = []
      ultimasInscripciones.value = []
    } catch (e) {
      error.value = e?.response?.data?.message || e.message || 'Error cargando dashboard'
      throw e
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    error,
    adminStats,
    ocupacionPorCarrera,
    alertas,
    ultimasInscripciones,
    loadAdmin,
  }
}
