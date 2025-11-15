<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import http from '../services/http'
import CarrerasView from './admin/CarrerasView.vue'
import StatCard from '../components/StatCard.vue'
import SectionTitle from '../components/SectionTitle.vue'
import TableCard from '../components/TableCard.vue'

const auth = useAuthStore()
const router = useRouter()

const role = computed(() => auth.user?.rol || 'ESTUDIANTE') // fallback
const nombre = computed(() => auth.user?.nombre || 'Usuario')

// Menú de usuario
const showUserMenu = ref(false)
const sidebarCollapsed = ref(false)

function toggleSidebar() {
  sidebarCollapsed.value = !sidebarCollapsed.value
}

const activeView = ref('dashboard') // 'dashboard' or 'carreras' etc.

function goToCarreras() {
  // only allow if admin
  if (auth.user?.rol === 'ADMIN') activeView.value = 'carreras'
}

// Loading states
const loading = ref(false)
const error = ref(null)

// ===== DATOS DUMMY PARA ADMIN (simulan servicios del backend) =====

// ADMIN - Stats principales
const adminStats = ref({
  totalUsuarios: 1250,
  carrerasActivas: 18,
  periodoActual: 'C3-2025',
  gruposAbiertos: 85
})

// ADMIN - Ocupación por carrera (datos para gráfico de barras)
const ocupacionPorCarrera = ref([
  { carrera: 'Software', ocupacion: 45 },
  { carrera: 'Psicología', ocupacion: 62 },
  { carrera: 'Derecho', ocupacion: 78 },
  { carrera: 'Medicina', ocupacion: 92 },
  { carrera: 'Arquitectura', ocupacion: 55 },
  { carrera: 'Diseño', ocupacion: 48 },
  { carrera: 'Contaduría', ocupacion: 71 }
])

// ADMIN - Alertas y notificaciones
const alertas = ref([
  {
    tipo: 'warning',
    icono: '⚠️',
    titulo: 'Conflicto de Horario',
    descripcion: 'Aula B-201 reservada dos veces el Lunes a las 10am.'
  },
  {
    tipo: 'error',
    icono: '📉',
    titulo: 'Baja Inscripción',
    descripcion: 'El grupo de "Cálculo Avanzado" tiene solo 3 estudiantes.'
  },
  {
    tipo: 'info',
    icono: '✓',
    titulo: 'Aprobación Pendiente',
    descripcion: 'Nueva materia "IA Generativa" espera aprobación del comité.'
  }
])

// ADMIN - Últimas inscripciones
const ultimasInscripciones = ref([
  {
    estudiante: 'Sofía Vergara',
    carrera: 'Ingeniería de Software',
    fecha: '2024-08-15',
    estado: 'Aprobada',
    estadoColor: 'bg-green-100 text-green-700'
  },
  {
    estudiante: 'Juan Carlos Pérez',
    carrera: 'Medicina',
    fecha: '2024-08-15',
    estado: 'Aprobada',
    estadoColor: 'bg-green-100 text-green-700'
  },
  {
    estudiante: 'Valentina Rojas',
    carrera: 'Arquitectura',
    fecha: '2024-08-14',
    estado: 'Pendiente',
    estadoColor: 'bg-yellow-100 text-yellow-700'
  },
  {
    estudiante: 'Mateo González',
    carrera: 'Derecho',
    fecha: '2024-08-13',
    estado: 'Aprobada',
    estadoColor: 'bg-green-100 text-green-700'
  }
])

function logout() {
  auth.logout()
  router.push('/login')
}

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

// ===== FUNCIONES PARA CARGAR DATOS DESDE EL BACKEND =====

// ADMIN - Cargar estadísticas del dashboard
async function loadAdminDashboard() {
  if (auth.isDummyMode) return // Usar datos dummy

  loading.value = true
  error.value = null

  try {
    // Cargar stats principales
    const { data: stats } = await http.get('/admin/dashboard/stats')
    if (stats) {
      adminStats.value = stats
    }

    // Cargar ocupación por carrera
    const { data: ocupacion } = await http.get('/admin/dashboard/ocupacion-carreras')
    if (ocupacion) {
      ocupacionPorCarrera.value = ocupacion
    }

    // Cargar alertas
    const { data: alertasData } = await http.get('/admin/dashboard/alertas')
    if (alertasData) {
      alertas.value = alertasData
    }

    // Cargar últimas inscripciones
    const { data: inscripciones } = await http.get('/admin/dashboard/inscripciones-recientes')
    if (inscripciones) {
      ultimasInscripciones.value = inscripciones
    }
  } catch (e) {
    console.error('Error cargando dashboard admin:', e)
    error.value = e.message
    // Mantener datos dummy como fallback
  } finally {
    loading.value = false
  }
}

// PROFESOR - Cargar datos del dashboard
async function loadProfesorDashboard() {
  if (auth.isDummyMode) return // Usar datos dummy

  loading.value = true
  error.value = null

  try {
    // Cargar stats del profesor
    const { data: stats } = await http.get('/profesor/dashboard/stats')
    if (stats) {
      profesorCards.value = stats
    }

    // Cargar grupos del profesor
    const { data: grupos } = await http.get('/profesor/grupos')
    if (grupos) {
      profesorTabla.value = grupos
    }
  } catch (e) {
    console.error('Error cargando dashboard profesor:', e)
    error.value = e.message
    // Mantener datos dummy como fallback
  } finally {
    loading.value = false
  }
}

// ESTUDIANTE - Cargar datos del dashboard
async function loadEstudianteDashboard() {
  if (auth.isDummyMode) return // Usar datos dummy

  loading.value = true
  error.value = null

  try {
    // Cargar stats del estudiante
    const { data: stats } = await http.get('/estudiante/dashboard/stats')
    if (stats) {
      estudianteStats.value = stats
    }

    // Cargar grupos del estudiante
    const { data: grupos } = await http.get('/estudiante/mis-grupos')
    if (grupos) {
      misGrupos.value = grupos
    }

    // Cargar disponibilidad
    const { data: disp } = await http.get('/estudiante/disponibilidad')
    if (disp) {
      disponibilidad.value = disp
    }

    // Cargar notificaciones
    const { data: notif } = await http.get('/estudiante/notificaciones')
    if (notif) {
      misNotificaciones.value = notif
    }
  } catch (e) {
    console.error('Error cargando dashboard estudiante:', e)
    error.value = e.message
    // Mantener datos dummy como fallback
  } finally {
    loading.value = false
  }
}

// Cargar datos según el rol
onMounted(() => {
  if (role.value === 'ADMIN') {
    loadAdminDashboard()
  } else if (role.value === 'PROFESOR') {
    loadProfesorDashboard()
  } else {
    loadEstudianteDashboard()
  }
})

// PROFESOR
const profesorCards = ref({
  totalGrupos: 5,
  periodoActual: '2025-2',
  disponibilidadBloques: 24,
})
const profesorTabla = ref([
  { periodo: '2025-2', codigo: 'MAT-101', materia: 'Cálculo I', seccion: '01', cupo_max: 35 },
  { periodo: '2025-2', codigo: 'FIS-110', materia: 'Física I',  seccion: 'B',  cupo_max: 30 },
  { periodo: '2025-1', codigo: 'MAT-102', materia: 'Cálculo II', seccion: '02', cupo_max: 30 },
])

// ESTUDIANTE
const estudianteStats = ref({
  materiasEsteperiodo: 5,
  periodoActual: 'C3-2025',
  horasSemanales: 18
})

// Grupos del estudiante con datos completos
const misGrupos = ref([
  { materia: 'Ingeniería de Software', seccion: 'S-701', aula: 'A-302', horario: 'Lun, Mié 10-12', alumnos: 32 },
  { materia: 'Sistemas de Bases de Datos', seccion: 'S-702', aula: 'B-105', horario: 'Mar, Jue 14-16', alumnos: 28 },
  { materia: 'Desarrollo Web', seccion: 'S-503', aula: 'C-Lab', horario: 'Vie 09-12', alumnos: 25 },
  { materia: 'Inteligencia Artificial', seccion: 'S-901', aula: 'A-401', horario: 'Lun, Mié 14-16', alumnos: 19 }
])

// Disponibilidad del estudiante (horario semanal)
const disponibilidad = ref([
  { hora: '08:00', lun: 'libre', mar: 'libre', mie: 'libre', jue: 'ocupado', vie: 'libre', sab: 'libre', dom: 'libre' },
  { hora: '10:00', lun: 'ocupado', mar: 'libre', mie: 'ocupado', jue: 'libre', vie: 'ocupado', sab: 'libre', dom: 'libre' },
  { hora: '12:00', lun: 'libre', mar: 'libre', mie: 'libre', jue: 'libre', vie: 'libre', sab: 'libre', dom: 'libre' },
  { hora: '14:00', lun: 'ocupado', mar: 'ocupado', mie: 'ocupado', jue: 'ocupado', vie: 'libre', sab: 'libre', dom: 'libre' }
])

// Notificaciones del estudiante
const misNotificaciones = ref([
  { icono: '👥', titulo: 'Se le ha asignado al Grupo #2', tiempo: 'Hace 2 días', color: 'bg-blue-50' },
  { icono: '📝', titulo: 'Solicitud de cambio de materia enviada', tiempo: 'Hace 1 día', color: 'bg-yellow-50' },
  { icono: '🔧', titulo: 'Anuncio de mantenimiento del sistema', tiempo: 'Hace 3 días', color: 'bg-gray-50' },
  { icono: '✅', titulo: 'Se le ha añadido a la materia Programación', tiempo: 'Hace 5 días', color: 'bg-green-50' }
])

// ===== HEADERS REUSABLES =====
const hdrGrupos = [
  { key: 'periodo', label: 'Periodo' },
  { key: 'codigo', label: 'Código' },
  { key: 'materia', label: 'Materia' },
  { key: 'seccion', label: 'Sección' },
  { key: 'cupo_max', label: 'Cupo' },
]

const hdrInscripciones = [
  { key: 'periodo', label: 'Periodo' },
  { key: 'codigo', label: 'Código' },
  { key: 'materia', label: 'Materia' },
  { key: 'seccion', label: 'Sección' },
  { key: 'profesor', label: 'Profesor' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
  <!-- Sidebar -->
  <aside :class="[sidebarCollapsed ? 'w-16' : 'w-64', 'bg-white border-r flex flex-col overflow-y-auto']">
      <!-- Logo -->
      <div class="p-6 border-b">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center">
            <span class="text-white font-bold text-lg">P</span>
          </div>
          <h1 v-show="!sidebarCollapsed" class="text-xl font-bold text-gray-800">PlanificaEDU</h1>
        </div>
      </div>

      <!-- Menu -->
      <nav class="flex-1 p-4 space-y-2">
        <RouterLink to="/dashboard" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-sky-50 text-sky-600 font-medium">
          <span>📊</span>
          <span v-show="!sidebarCollapsed">Dashboard</span>
        </RouterLink>
        <RouterLink v-if="role === 'ADMIN'" to="/usuarios" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>👥</span>
          <span v-show="!sidebarCollapsed">Usuarios</span>
        </RouterLink>
        <RouterLink :to="role === 'ADMIN' ? '/admin/materias' : '/materias'" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>📚</span>
          <span v-show="!sidebarCollapsed">Materias</span>
        </RouterLink>
        <RouterLink v-if="role === 'ADMIN'" to="/admin/carreras" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>🎓</span>
          <span v-show="!sidebarCollapsed">Carreras</span>
        </RouterLink>
        <RouterLink :to="role === 'ADMIN' ? '/admin/horarios' : '/dashboard'" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>🕐</span>
          <span v-show="!sidebarCollapsed">Horarios</span>
        </RouterLink>
      </nav>

      <!-- Footer del sidebar -->
      <div class="p-4 border-t space-y-2">
        <RouterLink to="/configuracion" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>⚙️</span>
          <span v-show="!sidebarCollapsed">Configuración</span>
        </RouterLink>
        <button
          @click="logout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
          <span>🚪</span>
          <span v-show="!sidebarCollapsed">Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <!-- Mini toolbar (visible when sidebar is collapsed) -->
    <div v-if="sidebarCollapsed" class="fixed left-2 bottom-6 z-40 flex flex-col gap-2">
      <RouterLink to="/dashboard" title="Dashboard" class="bg-white p-2 rounded shadow">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 3h7v7H3V3zM14 3h7v4h-7V3zM14 12h7v9h-7v-9zM3 12h7v9H3v-9z" /></svg>
      </RouterLink>
      <RouterLink to="/configuracion" title="Configuración" class="bg-white p-2 rounded shadow">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-2.21 0-4 .895-4 2s1.79 2 4 2 4-.895 4-2-1.79-2-4-2zM6 20h12"/></svg>
      </RouterLink>
      <button @click="logout" title="Cerrar sesión" class="bg-white p-2 rounded shadow text-red-600">
        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H7a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1"/></svg>
      </button>
    </div>
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="bg-white border-b">
        <div class="px-8 py-6 flex items-center justify-between">
          <div class="flex items-center gap-4">
            <button @click="toggleSidebar" class="p-2 rounded-lg hover:bg-gray-100">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <h2 class="text-2xl font-bold text-gray-800">Dashboard</h2>
          </div>
          <div class="flex items-center gap-4">
            <button class="p-2 rounded-lg hover:bg-gray-100 relative">
              <span class="text-2xl">🔔</span>
              <span class="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div class="relative">
              <div class="flex items-center gap-3">
                <div class="text-right">
                  <p class="text-sm font-medium text-gray-800">{{ nombre }}</p>
                  <p class="text-xs text-gray-500">{{ role === 'ADMIN' ? 'Administrador' : role }}</p>
                </div>
                <button
                  @click="toggleUserMenu"
                  class="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center hover:bg-sky-200 transition-colors cursor-pointer overflow-hidden"
                  title="Ver opciones de usuario"
                >
                  <img v-if="auth.user?.avatar" :src="auth.user.avatar" alt="avatar" class="w-10 h-10 object-cover" />
                  <span v-else class="text-sky-600 font-bold">{{ nombre.charAt(0) }}</span>
                </button>
              </div>

              <!-- Menú desplegable -->
              <div
                v-if="showUserMenu"
                class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50"
              >
                <div class="px-4 py-3 border-b border-gray-100">
                  <p class="text-sm font-medium text-gray-800">{{ nombre }}</p>
                  <p class="text-xs text-gray-500">{{ auth.user?.email }}</p>
                </div>
                <RouterLink
                  to="/configuracion"
                  class="flex items-center gap-3 px-4 py-3 text-gray-700 hover:bg-gray-50 transition"
                  @click="showUserMenu = false"
                >
                  <span>⚙️</span>
                  <span>Configuración</span>
                </RouterLink>
                <button
                  @click="logout"
                  class="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 transition"
                >
                  <span>🚪</span>
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      <!-- Content -->
      <main class="flex-1 p-8 overflow-y-auto">
        <!-- ADMIN Dashboard -->
        <section v-if="role === 'ADMIN'" class="space-y-6">
          <!-- Stats Cards -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div class="bg-white rounded-xl shadow-sm p-6">
              <p class="text-sm text-gray-500 mb-1">Total Usuarios</p>
              <p class="text-3xl font-bold text-gray-800">{{ adminStats.totalUsuarios.toLocaleString() }}</p>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-6">
              <p class="text-sm text-gray-500 mb-1">Carreras Activas</p>
              <p class="text-3xl font-bold text-gray-800">{{ adminStats.carrerasActivas }}</p>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-6">
              <p class="text-sm text-gray-500 mb-1">Periodo Actual</p>
              <p class="text-3xl font-bold text-gray-800">{{ adminStats.periodoActual }}</p>
            </div>
            <div class="bg-white rounded-xl shadow-sm p-6">
              <p class="text-sm text-gray-500 mb-1">Grupos Abiertos</p>
              <p class="text-3xl font-bold text-gray-800">{{ adminStats.gruposAbiertos }}</p>
            </div>
          </div>

          <!-- Gráfico y Alertas -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Ocupación por Carrera -->
            <div class="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
              <div class="flex items-center justify-between mb-6">
                <div>
                  <h3 class="text-lg font-semibold text-gray-800">Ocupación por Carrera</h3>
                  <p class="text-sm text-gray-500">Estudiantes inscritos este semestre.</p>
                </div>
                <span class="text-green-600 text-sm font-medium">↗ +5.2%</span>
              </div>

              <!-- Gráfico de barras simple -->
              <div class="space-y-4">
                <div v-for="item in ocupacionPorCarrera" :key="item.carrera" class="space-y-1">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">{{ item.carrera }}</span>
                    <span class="text-gray-500">{{ item.ocupacion }}%</span>
                  </div>
                  <div class="w-full bg-gray-100 rounded-full h-2">
                    <div
                      class="bg-sky-400 h-2 rounded-full transition-all"
                      :style="{ width: item.ocupacion + '%' }"
                    ></div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Alertas y Notificaciones -->
            <div class="bg-white rounded-xl shadow-sm p-6">
              <h3 class="text-lg font-semibold text-gray-800 mb-4">Alertas y Notificaciones</h3>
              <div class="space-y-4">
                <div
                  v-for="(alerta, index) in alertas"
                  :key="index"
                  class="p-3 rounded-lg border-l-4"
                  :class="{
                    'bg-yellow-50 border-yellow-400': alerta.tipo === 'warning',
                    'bg-red-50 border-red-400': alerta.tipo === 'error',
                    'bg-blue-50 border-blue-400': alerta.tipo === 'info'
                  }"
                >
                  <div class="flex gap-2">
                    <span class="text-lg">{{ alerta.icono }}</span>
                    <div class="flex-1">
                      <p class="text-sm font-medium text-gray-800">{{ alerta.titulo }}</p>
                      <p class="text-xs text-gray-600 mt-1">{{ alerta.descripcion }}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Últimas Inscripciones -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Últimas Inscripciones</h3>
            <p class="text-sm text-gray-500 mb-4">Actividad reciente de inscripciones de estudiantes.</p>

            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estudiante</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrera</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(inscripcion, index) in ultimasInscripciones" :key="index" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-800">{{ inscripcion.estudiante }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ inscripcion.carrera }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ inscripcion.fecha }}</td>
                    <td class="px-4 py-3">
                      <span class="px-3 py-1 rounded-full text-xs font-medium" :class="inscripcion.estadoColor">
                        {{ inscripcion.estado }}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </section>

      <!-- PROFESOR -->
      <section v-else-if="role === 'PROFESOR'" class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Grupos asignados" :value="profesorCards.totalGrupos" />
          <StatCard label="Periodo actual" :value="profesorCards.periodoActual" />
          <StatCard label="Bloques de disponibilidad" :value="profesorCards.disponibilidadBloques" />
        </div>

        <TableCard title="Tus grupos (recientes)" :headers="hdrGrupos" :rows="profesorTabla" emptyText="No tienes grupos asignados." />
      </section>

      <!-- ESTUDIANTE -->
      <section v-else class="space-y-6">
        <!-- Bienvenida -->
        <div>
          <h2 class="text-2xl font-bold text-gray-800">Bienvenido, {{ nombre }}</h2>
        </div>

        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div class="bg-white rounded-xl shadow-sm p-6">
            <p class="text-sm text-gray-500 mb-1">Materias de este Periodo</p>
            <p class="text-3xl font-bold text-gray-800">{{ estudianteStats.materiasEsteperiodo }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6">
            <p class="text-sm text-gray-500 mb-1">Periodo actual</p>
            <p class="text-3xl font-bold text-gray-800">{{ estudianteStats.periodoActual }}</p>
          </div>
          <div class="bg-white rounded-xl shadow-sm p-6">
            <p class="text-sm text-gray-500 mb-1">Horas semanales totales</p>
            <p class="text-3xl font-bold text-gray-800">{{ estudianteStats.horasSemanales }}</p>
          </div>
        </div>

        <!-- Mis grupos y Notificaciones -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Mis grupos -->
          <div class="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Mis grupos</h3>
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 border-b">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Materia</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Sección</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aula</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                    <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Alumnos</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr v-for="(grupo, index) in misGrupos" :key="index" class="hover:bg-gray-50">
                    <td class="px-4 py-3 text-sm text-gray-800">{{ grupo.materia }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ grupo.seccion }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ grupo.aula }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ grupo.horario }}</td>
                    <td class="px-4 py-3 text-sm text-gray-600">{{ grupo.alumnos }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- Mis notificaciones -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Mis notificaciones</h3>
            <div class="space-y-3">
              <div
                v-for="(notif, index) in misNotificaciones"
                :key="index"
                class="p-3 rounded-lg"
                :class="notif.color"
              >
                <div class="flex gap-3">
                  <span class="text-xl">{{ notif.icono }}</span>
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-800">{{ notif.titulo }}</p>
                    <p class="text-xs text-gray-500 mt-1">{{ notif.tiempo }}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mi disponibilidad -->
        <div class="bg-white rounded-xl shadow-sm p-6">
          <h3 class="text-lg font-semibold text-gray-800 mb-4">Mi disponibilidad</h3>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b">
                  <th class="px-3 py-2 text-left text-gray-600 font-medium">Hora</th>
                  <th class="px-3 py-2 text-center text-gray-600 font-medium">Lun</th>
                  <th class="px-3 py-2 text-center text-gray-600 font-medium">Mar</th>
                  <th class="px-3 py-2 text-center text-gray-600 font-medium">Mié</th>
                  <th class="px-3 py-2 text-center text-gray-600 font-medium">Jue</th>
                  <th class="px-3 py-2 text-center text-gray-600 font-medium">Vie</th>
                  <th class="px-3 py-2 text-center text-gray-600 font-medium">Sáb</th>
                  <th class="px-3 py-2 text-center text-gray-600 font-medium">Dom</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(slot, index) in disponibilidad" :key="index" class="border-b">
                  <td class="px-3 py-3 text-gray-600 font-medium">{{ slot.hora }}</td>
                  <td class="px-3 py-3">
                    <div class="h-10 rounded" :class="slot.lun === 'ocupado' ? 'bg-red-100' : 'bg-green-100'"></div>
                  </td>
                  <td class="px-3 py-3">
                    <div class="h-10 rounded" :class="slot.mar === 'ocupado' ? 'bg-red-100' : 'bg-green-100'"></div>
                  </td>
                  <td class="px-3 py-3">
                    <div class="h-10 rounded" :class="slot.mie === 'ocupado' ? 'bg-red-100' : 'bg-green-100'"></div>
                  </td>
                  <td class="px-3 py-3">
                    <div class="h-10 rounded" :class="slot.jue === 'ocupado' ? 'bg-red-100' : 'bg-green-100'"></div>
                  </td>
                  <td class="px-3 py-3">
                    <div class="h-10 rounded" :class="slot.vie === 'ocupado' ? 'bg-red-100' : 'bg-green-100'"></div>
                  </td>
                  <td class="px-3 py-3">
                    <div class="h-10 rounded" :class="slot.sab === 'ocupado' ? 'bg-red-100' : 'bg-green-100'"></div>
                  </td>
                  <td class="px-3 py-3">
                    <div class="h-10 rounded" :class="slot.dom === 'ocupado' ? 'bg-red-100' : 'bg-green-100'"></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </main>
    </div>
  </div>
</template>
