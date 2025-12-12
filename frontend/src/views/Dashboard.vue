<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import http from '../services/http'
import Sidebar from '../components/Sidebar.vue'
import StatCard from '../components/StatCard.vue'
import TableCard from '../components/TableCard.vue'

import { useDashboardData } from '../composable/userDashboardData'

const dash = useDashboardData();

const auth = useAuthStore()
const router = useRouter()

const role = computed(() => auth.user?.rol || 'ESTUDIANTE')
const nombre = computed(() => auth.user?.nombre || 'Usuario')

// Loading and error states
const loading = ref(false)
const error = ref(null)

// ADMIN
const adminStats = ref({})
const ocupacionPorCarrera = ref([])

// ADMIN - Últimas inscripciones
const ultimasInscripciones = ref([])

// PROFESOR
const profesorCards = ref({
  totalGrupos: 5,
  periodoActual: '2025-2',
  disponibilidadBloques: 24
})

const profesorTabla = ref([
  { periodo: '2025-2', codigo: 'MAT-101', materia: 'Cálculo I', seccion: '01', cupo_max: 35 },
  { periodo: '2025-2', codigo: 'FIS-110', materia: 'Física I', seccion: 'B', cupo_max: 30 },
  { periodo: '2025-1', codigo: 'MAT-102', materia: 'Cálculo II', seccion: '02', cupo_max: 30 }
])

// ESTUDIANTE
const estudianteStats = ref({
  periodoActual: '2025-2',
  misInscripciones: 4,
  cuposDisponibles: 588
})

const estudiantePreferencias = ref([
  { label: 'Turno Preferido', value: 'Mañana' },
  { label: 'Compactación', value: '7 horas/día' },
  { label: 'Evitar Días', value: 'Viernes, Sábado' }
])

const estudianteMaterias = ref([
  { periodo: '2025-2', codigo: 'MAT-101', materia: 'Cálculo I', seccion: '01', profesor: 'A. Ramírez' },
  { periodo: '2025-2', codigo: 'PRO-120', materia: 'Programación I', seccion: 'A', profesor: 'L. Paredes' },
  { periodo: '2025-2', codigo: 'FIS-110', materia: 'Física I', seccion: 'B', profesor: 'C. Taveras' }
])

function logout() {
  auth.logout()
  router.push('/login')
}

onMounted(() => {
  // Load data based on role
  if (role.value === 'ADMIN') {
    loadAdminDashboard()
  } else if (role.value === 'PROFESOR') {
    loadProfesorDashboard()
  } else {
    loadEstudianteDashboard()
  }
})

async function loadAdminDashboard() {
  if (auth.isDummyMode) return
  loading.value = true
  try {
    await dash.loadAdmin()
    adminStats.value = dash.adminStats.value
    ocupacionPorCarrera.value = dash.ocupacionPorCarrera.value
    alertas.value = dash.alertas.value
    ultimasInscripciones.value = dash.ultimasInscripciones.value
  } catch (e) {
    error.value = dash.error.value
  }
}

async function loadProfesorDashboard() {
  if (auth.isDummyMode) return
  loading.value = true
  try {
    // Cargar datos del profesor
    const { data: stats } = await http.get('/profesor/dashboard/stats')
    if (stats) profesorCards.value = stats
  } catch (e) {
    console.error('Error loading profesor dashboard:', e)
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function loadEstudianteDashboard() {
  if (auth.isDummyMode) return
  loading.value = true
  try {
    // Cargar datos del estudiante
    const { data: stats } = await http.get('/estudiante/dashboard/stats')
    if (stats) estudianteStats.value = stats
  } catch (e) {
    console.error('Error loading estudiante dashboard:', e)
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Sidebar>
    <!-- Header -->
    <header class="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
        </div>
        <div class="flex items-center gap-4">
          <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div
            class="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center font-bold text-orange-700 text-sm">
            {{ nombre.substring(0, 2).toUpperCase() }}
          </div>
          <div>
            <p class="text-sm font-bold text-gray-900">{{ nombre }}</p>
            <p class="text-gray-500 text-sm mt-1">{{ role === 'ADMIN' ? 'Administrador' : role }}</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
      <!-- ADMIN VIEW -->
      <section v-if="role === 'ADMIN'" class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Total Usuarios" :value="adminStats.totalUsuarios"
            sublabel="Profesores: 36 · Estudiantes: 92" />
          <StatCard label="Carreras Activas" :value="adminStats.carrerasActivas" sublabel="Materias: 154" />
          <StatCard label="Período Actual" :value="adminStats.periodoActual" sublabel="Grupos: 47" />
          <StatCard label="Grupos Abiertos" :value="adminStats.gruposAbiertos" sublabel="Cupos: 588" />
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-900">Ocupación por Carrera</h3>
              <span class="text-green-600 text-sm font-semibold">↑ +5.2%</span>
            </div>
            <p class="text-gray-500 text-sm mb-6">Estudiantes inscritos este semestre.</p>
            <div v-if="ocupacionPorCarrera.length === 0" class="text-gray-400 text-sm">
              No hay datos de ocupación todavía.
            </div>

            <div v-if="ocupacionPorCarrera.length > 0"
              class="h-72 bg-gradient-to-b from-sky-50 to-sky-100 rounded-lg flex items-end justify-around px-4 py-8 gap-2">
              <div v-for="item in ocupacionPorCarrera" :key="item.carrera"
                class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-sky-300 rounded-t" :style="{ height: item.ocupacion * 2 + 'px' }"></div>
                <p class="text-xs text-gray-600 font-medium">{{ item.carrera }}</p>
              </div>
            </div>
          </div>

          <!-- Alertas y Notificaciones -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Alertas y Notificaciones</h3>
            <div class="space-y-3">
              <div v-for="(alerta, idx) in alertas" :key="idx" class="flex gap-3 p-3 border rounded-lg" :class="{
                'bg-yellow-50 border-yellow-200': alerta.tipo === 'warning',
                'bg-red-50 border-red-200': alerta.tipo === 'error',
                'bg-green-50 border-green-200': alerta.tipo === 'success'
              }">
                <span class="text-xl flex-shrink-0">{{ alerta.icono }}</span>
                <div>
                  <p class="font-semibold text-sm text-gray-900">{{ alerta.titulo }}</p>
                  <p class="text-xs text-gray-600">{{ alerta.descripcion }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Inscriptions -->
        <TableCard title="Últimas Inscripciones" :headers="[
          { key: 'estudiante', label: 'ESTUDIANTE' },
          { key: 'carrera', label: 'CARRERA' },
          { key: 'fecha', label: 'FECHA' },
          { key: 'estado', label: 'ESTADO' },
        ]" :rows="ultimasInscripciones" />
      </section>

      <!-- PROFESOR VIEW -->
      <section v-else-if="role === 'PROFESOR'" class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Grupos Asignados" :value="profesorCards.totalGrupos" />
          <StatCard label="Período Actual" :value="profesorCards.periodoActual" />
          <StatCard label="Bloques Disponibles" :value="profesorCards.disponibilidadBloques" />
        </div>

        <TableCard title="Tus Grupos (Recientes)" :headers="[
          { key: 'periodo', label: 'Período' },
          { key: 'codigo', label: 'Código' },
          { key: 'materia', label: 'Materia' },
          { key: 'seccion', label: 'Sección' },
          { key: 'cupo_max', label: 'Cupo' },
        ]" :rows="profesorTabla" />
      </section>

      <!-- ESTUDIANTE VIEW -->
      <section v-else class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Período Actual" :value="estudianteStats.periodoActual" />
          <StatCard label="Mis Inscripciones" :value="estudianteStats.misInscripciones" />
          <StatCard label="Cupos Disponibles" :value="estudianteStats.cuposDisponibles" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Mis Preferencias</h3>
            <div class="space-y-3 text-sm text-gray-700">
              <p v-for="pref in estudiantePreferencias" :key="pref.label">
                <span class="text-gray-500">{{ pref.label }}:</span> {{ pref.value }}
              </p>
            </div>
          </div>

          <TableCard title="Mis Inscripciones" :headers="[
            { key: 'periodo', label: 'Período' },
            { key: 'codigo', label: 'Código' },
            { key: 'materia', label: 'Materia' },
            { key: 'seccion', label: 'Sección' },
            { key: 'profesor', label: 'Profesor' },
          ]" :rows="estudianteMaterias" />
        </div>
      </section>
    </main>
  </Sidebar>
</template>

<style scoped>
/* small adjustments to match existing UI */
</style>
