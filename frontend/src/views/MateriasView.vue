<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import http from '../services/http'

const auth = useAuthStore()
const router = useRouter()

const searchQuery = ref('')
const loading = ref(false)
const error = ref(null)

// Menú de usuario
const showUserMenu = ref(false)
const nombre = computed(() => auth.user?.nombre || 'Usuario')

// Datos dummy de materias
const todasLasMaterias = ref([
  { id: 1, nombre: 'Cálculo Diferencial', horario: 'Lunes 8:00am-1:00pm', profesor: 'NombreProf1', inscrito: true },
  { id: 2, nombre: 'Programación Orientada a Objetos', horario: 'Lunes 2:00pm-6:00pm', profesor: 'NombreProf2', inscrito: true },
  { id: 3, nombre: 'Bases de Datos', horario: 'Jueves 2:00pm-6:00pm', profesor: 'NombreProf3', inscrito: false },
  { id: 4, nombre: 'Física Mecánica', horario: 'Viernes 8:00pm-10:00pm (Virtual)', profesor: 'NombreProf4', inscrito: false },
  { id: 5, nombre: 'Álgebra Lineal', horario: 'Martes 10:00am-12:00pm', profesor: 'NombreProf5', inscrito: false },
  { id: 6, nombre: 'Estructuras de Datos', horario: 'Miércoles 2:00pm-5:00pm', profesor: 'NombreProf6', inscrito: false }
])

// Vista activa: 'inscritas' o 'disponibles'
const vistaActiva = ref('inscritas')

// Paginación
const currentPage = ref(1)
const itemsPerPage = 10

// Materias inscritas (del estudiante)
const materiasInscritas = computed(() => {
  return todasLasMaterias.value.filter(m => m.inscrito)
})

// Materias disponibles (no inscritas)
const materiasDisponibles = computed(() => {
  return todasLasMaterias.value.filter(m => !m.inscrito)
})

// Materias a mostrar según la vista activa
const materiasParaMostrar = computed(() => {
  return vistaActiva.value === 'inscritas' ? materiasInscritas.value : materiasDisponibles.value
})

// Materias filtradas por búsqueda
const materiasFiltradas = computed(() => {
  if (!searchQuery.value) return materiasParaMostrar.value

  const query = searchQuery.value.toLowerCase()
  return materiasParaMostrar.value.filter(materia =>
    materia.nombre.toLowerCase().includes(query) ||
    materia.profesor.toLowerCase().includes(query)
  )
})

// Materias paginadas
const materiasPaginadas = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return materiasFiltradas.value.slice(start, end)
})

// Total de páginas
const totalPages = computed(() => {
  return Math.ceil(materiasFiltradas.value.length / itemsPerPage)
})

function toggleUserMenu() {
  showUserMenu.value = !showUserMenu.value
}

function logout() {
  auth.logout()
  router.push('/login')
}

function goToDashboard() {
  router.push('/dashboard')
}

// Cargar materias desde el backend
async function loadMaterias() {
  if (auth.isDummyMode) return // Usar datos dummy

  loading.value = true
  error.value = null

  try {
    const { data } = await http.get('/estudiante/materias')
    if (data) {
      todasLasMaterias.value = data
    }
  } catch (e) {
    console.error('Error cargando materias:', e)
    error.value = e.message
    // Mantener datos dummy como fallback
  } finally {
    loading.value = false
  }
}

// Inscribir materia
async function inscribirMateria(materia) {
  if (auth.isDummyMode) {
    // Modo dummy: solo cambiar estado local
    materia.inscrito = true
    currentPage.value = 1 // Resetear paginación
    return
  }

  loading.value = true
  try {
    await http.post(`/estudiante/materias/${materia.id}`)
    materia.inscrito = true
    currentPage.value = 1
  } catch (e) {
    console.error('Error al inscribir materia:', e)
    alert(e.response?.data?.message || e.message || 'Error al inscribir la materia')
  } finally {
    loading.value = false
  }
}

// Retirar materia
async function retirarMateria(materia) {
  if (!confirm(`¿Estás seguro de que deseas retirarte de ${materia.nombre}?`)) {
    return
  }

  if (auth.isDummyMode) {
    // Modo dummy: solo cambiar estado local
    materia.inscrito = false
    currentPage.value = 1 // Resetear paginación
    return
  }

  loading.value = true
  try {
    await http.delete(`/estudiante/materias/${materia.id}`)
    materia.inscrito = false
    currentPage.value = 1
  } catch (e) {
    console.error('Error al retirar materia:', e)
    alert(e.response?.data?.message || e.message || 'Error al retirar la materia')
  } finally {
    loading.value = false
  }
}

// Cambiar vista entre inscritas y disponibles
function cambiarVista(vista) {
  vistaActiva.value = vista
  currentPage.value = 1
  searchQuery.value = ''
}

function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

onMounted(() => {
  loadMaterias()
})
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex">
    <!-- Sidebar -->
    <aside class="w-64 bg-white border-r flex flex-col overflow-y-auto">
      <!-- Logo -->
      <div class="p-6 border-b">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-sky-400 rounded-full flex items-center justify-center">
            <span class="text-white font-bold text-lg">P</span>
          </div>
          <h1 class="text-xl font-bold text-gray-800">PlanificaEDU</h1>
        </div>
      </div>

      <!-- Menu -->
      <nav class="flex-1 p-4 space-y-2">
        <a @click="goToDashboard" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50 cursor-pointer">
          <span>📊</span>
          <span>Dashboard</span>
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>👥</span>
          <span>Usuarios</span>
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-sky-50 text-sky-600 font-medium">
          <span>📚</span>
          <span>Materias</span>
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>🎓</span>
          <span>Carreras</span>
        </a>
        <a href="#" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>🕐</span>
          <span>Horarios</span>
        </a>
      </nav>

      <!-- Footer del sidebar -->
      <div class="p-4 border-t space-y-2">
        <RouterLink to="/configuracion" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>⚙️</span>
          <span>Configuración</span>
        </RouterLink>
        <button
          @click="logout"
          class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition">
          <span>🚪</span>
          <span>Cerrar sesión</span>
        </button>
      </div>
    </aside>

    <!-- Main Content -->
    <div class="flex-1 flex flex-col">
      <!-- Header -->
      <header class="bg-white border-b">
        <div class="px-8 py-6 flex items-center justify-between">
          <div>
            <h2 class="text-2xl font-bold text-gray-800">Materias</h2>
            <p class="text-sm text-gray-500 mt-1">Selecciona o Retira tus materias.</p>
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
                  <p class="text-xs text-gray-500">Estudiante</p>
                </div>
                <button
                  @click="toggleUserMenu"
                  class="w-10 h-10 bg-sky-100 rounded-full flex items-center justify-center hover:bg-sky-200 transition-colors cursor-pointer"
                  title="Ver opciones de usuario"
                >
                  <span class="text-sky-600 font-bold">{{ nombre.charAt(0) }}</span>
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
        <div class="bg-white rounded-xl shadow-sm p-6">
          <!-- Tabs -->
          <div class="flex gap-4 border-b mb-6">
            <button
              @click="cambiarVista('inscritas')"
              :class="[
                'px-6 py-3 font-medium transition border-b-2',
                vistaActiva === 'inscritas'
                  ? 'text-sky-600 border-sky-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              ]"
            >
              Mis Materias ({{ materiasInscritas.length }})
            </button>
            <button
              @click="cambiarVista('disponibles')"
              :class="[
                'px-6 py-3 font-medium transition border-b-2',
                vistaActiva === 'disponibles'
                  ? 'text-sky-600 border-sky-600'
                  : 'text-gray-500 border-transparent hover:text-gray-700'
              ]"
            >
              Disponibles ({{ materiasDisponibles.length }})
            </button>
          </div>

          <!-- Search Bar -->
          <div class="flex items-center justify-between mb-6">
            <div class="relative flex-1 max-w-md">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por nombre de materia o profesor..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
              />
              <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre de Asignatura</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesor</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="materia in materiasPaginadas" :key="materia.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-800">{{ materia.nombre }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ materia.horario }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ materia.profesor }}</td>
                  <td class="px-4 py-3">
                    <!-- Botón para inscribirse (solo en vista "disponibles") -->
                    <button
                      v-if="vistaActiva === 'disponibles'"
                      @click="inscribirMateria(materia)"
                      class="px-4 py-2 bg-sky-400 hover:bg-sky-500 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="loading"
                    >
                      + Inscribir
                    </button>

                    <!-- Botón para retirar (solo en vista "inscritas") -->
                    <button
                      v-if="vistaActiva === 'inscritas'"
                      @click="retirarMateria(materia)"
                      class="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                      :disabled="loading"
                    >
                      🗑️ Retirar
                    </button>
                  </td>
                </tr>
                <tr v-if="materiasPaginadas.length === 0">
                  <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                    <div v-if="vistaActiva === 'inscritas'">
                      No tienes materias inscritas aún
                    </div>
                    <div v-else>
                      No hay materias disponibles para inscribirse
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div v-if="totalPages > 1" class="flex items-center justify-center gap-2 mt-6">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ←
            </button>
            <button
              @click="changePage(1)"
              :class="['px-3 py-1 rounded', currentPage === 1 ? 'bg-sky-400 text-white' : 'border border-gray-300 hover:bg-gray-50']"
            >
              1
            </button>
            <button
              v-if="totalPages > 1"
              @click="changePage(2)"
              :class="['px-3 py-1 rounded', currentPage === 2 ? 'bg-sky-400 text-white' : 'border border-gray-300 hover:bg-gray-50']"
            >
              2
            </button>
            <button
              v-if="totalPages > 2"
              @click="changePage(3)"
              :class="['px-3 py-1 rounded', currentPage === 3 ? 'bg-sky-400 text-white' : 'border border-gray-300 hover:bg-gray-50']"
            >
              3
            </button>
            <span v-if="totalPages > 4" class="px-2">...</span>
            <button
              v-if="totalPages > 3"
              @click="changePage(totalPages)"
              :class="['px-3 py-1 rounded', currentPage === totalPages ? 'bg-sky-400 text-white' : 'border border-gray-300 hover:bg-gray-50']"
            >
              {{ totalPages }}
            </button>
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-1 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              →
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
