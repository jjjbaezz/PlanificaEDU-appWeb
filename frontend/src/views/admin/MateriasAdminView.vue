<script setup>
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import http from '../../services/http'

const auth = useAuthStore()
const router = useRouter()

const searchQuery = ref('')
const loading = ref(false)
const error = ref(null)

// Menú de usuario
const showUserMenu = ref(false)
const nombre = computed(() => auth.user?.nombre || 'Usuario')

// Modal para crear/editar materia
const showModal = ref(false)
const isEditing = ref(false)
const currentMateria = ref({
  id: null,
  nombre: '',
  duracion: '',
  cuposMaximos: ''
})

// Datos dummy de materias (para cuando el backend no responde)
const materias = ref([
  { id: 1, nombre: 'Cálculo Diferencial', duracion: '4h', cuposMaximos: 40 },
  { id: 2, nombre: 'Programación Orientada a Objetos', duracion: '3h', cuposMaximos: 35 },
  { id: 3, nombre: 'Bases de Datos', duracion: '3h', cuposMaximos: 35 },
  { id: 4, nombre: 'Física Mecánica', duracion: '4h', cuposMaximos: 50 }
])

// Paginación
const currentPage = ref(1)
const itemsPerPage = 10

// Materias filtradas por búsqueda
const materiasFiltradas = computed(() => {
  if (!searchQuery.value) return materias.value

  const query = searchQuery.value.toLowerCase()
  return materias.value.filter(materia =>
    materia.nombre.toLowerCase().includes(query)
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
    const { data } = await http.get('/admin/materias')
    if (data) {
      materias.value = data
    }
  } catch (e) {
    console.error('Error cargando materias:', e)
    error.value = e.message
    // Mantener datos dummy como fallback
  } finally {
    loading.value = false
  }
}

// Abrir modal para crear nueva materia
function openCreateModal() {
  isEditing.value = false
  currentMateria.value = {
    id: null,
    nombre: '',
    duracion: '',
    cuposMaximos: ''
  }
  showModal.value = true
}

// Abrir modal para editar materia
function openEditModal(materia) {
  isEditing.value = true
  currentMateria.value = { ...materia }
  showModal.value = true
}

// Cerrar modal
function closeModal() {
  showModal.value = false
  currentMateria.value = {
    id: null,
    nombre: '',
    duracion: '',
    cuposMaximos: ''
  }
}

// Guardar materia (crear o editar)
async function saveMateria() {
  if (!currentMateria.value.nombre || !currentMateria.value.duracion || !currentMateria.value.cuposMaximos) {
    alert('Por favor completa todos los campos')
    return
  }

  if (auth.isDummyMode) {
    // Modo dummy: actualizar datos localmente
    if (isEditing.value) {
      const index = materias.value.findIndex(m => m.id === currentMateria.value.id)
      if (index !== -1) {
        materias.value[index] = { ...currentMateria.value }
      }
    } else {
      const newId = Math.max(...materias.value.map(m => m.id), 0) + 1
      materias.value.push({ ...currentMateria.value, id: newId })
    }
    closeModal()
    return
  }

  loading.value = true
  try {
    if (isEditing.value) {
      // Actualizar materia existente
      await http.put(`/admin/materias/${currentMateria.value.id}`, currentMateria.value)
      const index = materias.value.findIndex(m => m.id === currentMateria.value.id)
      if (index !== -1) {
        materias.value[index] = { ...currentMateria.value }
      }
    } else {
      // Crear nueva materia
      const { data } = await http.post('/admin/materias', currentMateria.value)
      materias.value.push(data)
    }
    closeModal()
  } catch (e) {
    console.error('Error guardando materia:', e)
    alert(e.response?.data?.message || e.message || 'Error al guardar la materia')
  } finally {
    loading.value = false
  }
}

// Eliminar materia
async function deleteMateria(materia) {
  if (!confirm(`¿Estás seguro de eliminar la materia "${materia.nombre}"?`)) {
    return
  }

  if (auth.isDummyMode) {
    // Modo dummy: eliminar localmente
    materias.value = materias.value.filter(m => m.id !== materia.id)
    return
  }

  loading.value = true
  try {
    await http.delete(`/admin/materias/${materia.id}`)
    materias.value = materias.value.filter(m => m.id !== materia.id)
  } catch (e) {
    console.error('Error eliminando materia:', e)
    alert(e.response?.data?.message || e.message || 'Error al eliminar la materia')
  } finally {
    loading.value = false
  }
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
        <RouterLink to="/usuarios" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
          <span>👥</span>
          <span>Usuarios</span>
        </RouterLink>
        <RouterLink to="/admin/materias" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-sky-50 text-sky-600 font-medium">
          <span>📚</span>
          <span>Materias</span>
        </RouterLink>
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
            <h2 class="text-2xl font-bold text-gray-800">Gestión de Asignaturas</h2>
            <p class="text-sm text-gray-500 mt-1">Añade, edita o elimina asignaturas del sistema.</p>
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
                  <p class="text-xs text-gray-500">Administrador</p>
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
          <!-- Search Bar -->
          <div class="flex items-center justify-between mb-6">
            <div class="relative flex-1 max-w-md">
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por nombre, apellido o email..."
                class="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
              />
              <span class="absolute left-3 top-2.5 text-gray-400">🔍</span>
            </div>
            <button
              @click="openCreateModal"
              class="ml-4 px-6 py-2 bg-sky-400 hover:bg-sky-500 text-white font-medium rounded-lg transition"
            >
              + Añadir Usuario
            </button>
          </div>

          <!-- Table -->
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 border-b">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre de Asignatura</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duración (Horas)</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cupos Máximos</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="materia in materiasPaginadas" :key="materia.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3 text-sm text-gray-800">{{ materia.nombre }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ materia.duracion }}</td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ materia.cuposMaximos }}</td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <button
                        @click="openEditModal(materia)"
                        class="text-sky-500 hover:text-sky-700 transition"
                        title="Editar"
                        :disabled="loading"
                      >
                        ✏️
                      </button>
                      <button
                        @click="deleteMateria(materia)"
                        class="text-red-500 hover:text-red-700 transition"
                        title="Eliminar"
                        :disabled="loading"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="materiasPaginadas.length === 0">
                  <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                    No se encontraron materias
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

    <!-- Modal para Crear/Editar Materia -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      @click.self="closeModal"
    >
      <div class="bg-white rounded-xl shadow-xl p-8 max-w-md w-full mx-4">
        <h3 class="text-2xl font-bold text-gray-800 mb-6">
          {{ isEditing ? 'Editar Materia' : 'Nueva Materia' }}
        </h3>

        <form @submit.prevent="saveMateria" class="space-y-4">
          <!-- Nombre -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre de la Asignatura</label>
            <input
              v-model="currentMateria.nombre"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
              placeholder="Ej: Cálculo Diferencial"
            />
          </div>

          <!-- Duración -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Duración (Horas)</label>
            <input
              v-model="currentMateria.duracion"
              type="text"
              required
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
              placeholder="Ej: 4h"
            />
          </div>

          <!-- Cupos Máximos -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Cupos Máximos</label>
            <input
              v-model.number="currentMateria.cuposMaximos"
              type="number"
              required
              min="1"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
              placeholder="Ej: 40"
            />
          </div>

          <!-- Botones -->
          <div class="flex gap-3 mt-6">
            <button
              type="button"
              @click="closeModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 px-4 py-2 bg-sky-400 hover:bg-sky-500 text-white rounded-lg transition disabled:opacity-50"
            >
              {{ loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear') }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
