<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import Sidebar from '../../components/Sidebar.vue'
import StatCard from '../../components/StatCard.vue'
import http from '../../services/http'

const auth = useAuthStore()
const router = useRouter()

// Búsqueda y filtros
const searchQuery = ref('')
const filtroCupos = ref('')
const filtroDuracion = ref('')
const loading = ref(false)
const error = ref(null)

// Datos del usuario
const showUserMenu = ref(false)
const nombre = computed(() => auth.user?.nombre || 'Usuario')
const role = computed(() => auth.user?.rol || 'ADMIN')

// Modal
const showModal = ref(false)
const isEditing = ref(false)
const currentSubject = ref({
  id: null,
  codigo: '',
  nombre: '',
  creditos: 0,
  cupos: 0,
  duracion: 0,
  carrera_id: null
})

// Datos y paginación del backend
const subjects = ref([])
const carreras = ref([])
const currentPage = ref(1)
const itemsPerPage = 20 // Coincide con pageSize del backend
const totalItems = ref(0)

// Función para obtener nombre de carrera por ID
const getCarreraNombre = (carreraId) => {
  if (!carreraId) return 'Sin carrera asignada'
  const carrera = carreras.value.find(c => c.id === carreraId)
  return carrera ? carrera.nombre : `ID: ${carreraId.substring(0, 8)}...`
}

// Función de reload
function reloadTable() {
  searchQuery.value = ''
  filtroCupos.value = ''
  filtroDuracion.value = ''
  currentPage.value = 1
  loadSubjects()
}

// Filtros computados (frontend)
const subjectsFiltrados = computed(() => {
  const filtrados = subjects.value.filter(subject => {
    const queryMatch = searchQuery.value
      ? subject.nombre?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        subject.codigo?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        getCarreraNombre(subject.carrera_id).toLowerCase().includes(searchQuery.value.toLowerCase())
      : true
    
    // Filtro por cupos (local)
    const cuposMatch = filtroCupos.value !== '' 
      ? (() => {
          switch(filtroCupos.value) {
            case 'disponible': return subject.cupos > 0;
            case 'llena': return subject.cupos === 0;
            default: return true;
          }
        })()
      : true
    
    // Filtro por duración (basado en créditos)
    const duracionMatch = filtroDuracion.value !== ''
      ? (() => {
          switch(filtroDuracion.value) {
            case 'corta': return subject.creditos <= 2;
            case 'media': return subject.creditos > 2 && subject.creditos <= 4;
            case 'larga': return subject.creditos > 4;
            default: return true;
          }
        })()
      : true

    return queryMatch && cuposMatch && duracionMatch
  })

  return filtrados
})

// Paginación frontend (ya que backend devuelve todos los items)
const subjectsPaginados = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return subjectsFiltrados.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(subjectsFiltrados.value.length / itemsPerPage)
})

const paginationPages = computed(() => {
  const pages = []
  const total = totalPages.value
  
  if (total <= 7) {
    for (let i = 1; i <= total; i++) pages.push(i)
  } else {
    pages.push(1)
    
    if (currentPage.value > 4) pages.push('...')
    
    const start = Math.max(2, currentPage.value - 2)
    const end = Math.min(total - 1, currentPage.value + 2)
    
    for (let i = start; i <= end; i++) pages.push(i)
    
    if (currentPage.value < total - 3) pages.push('...')
    
    pages.push(total)
  }
  
  return pages
})

// Funciones de UI
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

// Carga de datos
async function loadSubjects() {
  loading.value = true
  error.value = null

  try {
    const { data } = await http.get('/subjects', {
      params: {
        page: currentPage.value,
        pageSize: itemsPerPage
      }
    })
    
    // Estructura esperada: { total, page, pageSize, items }
    subjects.value = data.items || []
    totalItems.value = data.total || 0
    
    // Si backend devuelve paginación, actualizamos currentPage
    if (data.page) currentPage.value = data.page
    
  } catch (e) {
    console.error('Error cargando asignaturas:', e)
    error.value = e.message
    alert('Error al cargar las asignaturas: ' + (e.response?.data?.message || e.message))
  } finally {
    loading.value = false
  }
}

async function loadCarreras() {
  try {
    const { data } = await http.get('/careers')
    // El backend devuelve un array de carreras
    carreras.value = Array.isArray(data) ? data : []
    console.log('Carreras cargadas:', carreras.value)
  } catch (e) {
    console.error('Error cargando carreras:', e)
    alert('Error al cargar las carreras: ' + (e.response?.data?.error || e.message))
  }
}

function getColorBadge(creditos) {
  if (creditos >= 4) return 'bg-red-100 text-red-600'
  if (creditos >= 3) return 'bg-orange-100 text-orange-600'
  if (creditos >= 2) return 'bg-yellow-100 text-yellow-600'
  return 'bg-green-100 text-green-600'
}

function getCuposBadge(cupos) {
  if (cupos === 0) return 'bg-red-100 text-red-700'
  if (cupos <= 10) return 'bg-yellow-100 text-yellow-700'
  return 'bg-green-100 text-green-700'
}

function getDuracionBadge(creditos) {
  if (creditos <= 2) return 'bg-blue-100 text-blue-700'
  if (creditos <= 4) return 'bg-purple-100 text-purple-700'
  return 'bg-indigo-100 text-indigo-700'
}

// Funciones del modal
function abrirModalCrear() {
  isEditing.value = false
  currentSubject.value = {
    id: null,
    codigo: '',
    nombre: '',
    creditos: 0,
    cupos: 0,
    duracion: 0,
    carrera_id: null
  }
  showModal.value = true
}

function abrirModalEditar(subject) {
  isEditing.value = true
  currentSubject.value = { 
    ...subject,
    creditos: Number(subject.creditos) || 0,
    cupos: Number(subject.cupos) || 0,
    duracion: Number(subject.duracion) || 0
  }
  showModal.value = true
}

function cerrarModal() {
  showModal.value = false
  currentSubject.value = {
    id: null,
    codigo: '',
    nombre: '',
    creditos: 0,
    cupos: 0,
    duracion: 0,
    carrera_id: null
  }
}

async function guardarSubject() {
  if (!currentSubject.value.codigo || !currentSubject.value.nombre) {
    alert('Por favor completa los campos obligatorios: código y nombre')
    return
  }

  if (currentSubject.value.creditos < 0) {
    alert('Los créditos no pueden ser negativos')
    return
  }

  loading.value = true
  try {
    if (isEditing.value) {
      const payload = {
        codigo: currentSubject.value.codigo,
        nombre: currentSubject.value.nombre,
        creditos: Number(currentSubject.value.creditos),
        carrera_id: currentSubject.value.carrera_id
        // Nota: cupos y duración no están en el backend del ejemplo
      }
      
      const { data } = await http.put(`/subjects/${currentSubject.value.id}`, payload)
      
      // Actualizar en la lista local
      const index = subjects.value.findIndex(s => s.id === currentSubject.value.id)
      if (index !== -1) {
        subjects.value[index] = {
          ...data,
          cupos: currentSubject.value.cupos, // Mantener localmente
          duracion: currentSubject.value.duracion // Mantener localmente
        }
      }
      
      cerrarModal()
      alert('Asignatura actualizada correctamente')
    } else {
      const payload = {
        codigo: currentSubject.value.codigo,
        nombre: currentSubject.value.nombre,
        creditos: Number(currentSubject.value.creditos) || 0,
        carrera_id: currentSubject.value.carrera_id
      }
      
      const { data } = await http.post('/subjects', payload)
      
      // Agregar con campos adicionales locales
      subjects.value.push({
        ...data,
        cupos: currentSubject.value.cupos || 0,
        duracion: currentSubject.value.duracion || 0
      })
      
      cerrarModal()
      alert('Asignatura creada correctamente')
    }
  } catch (e) {
    console.error('Error guardando asignatura:', e)
    alert(e.response?.data?.message || 'Error al guardar la asignatura')
  } finally {
    loading.value = false
  }
}

async function eliminarSubject(subject) {
  if (!confirm(`¿Estás seguro de eliminar la asignatura ${subject.nombre}?`)) return

  loading.value = true
  try {
    await http.delete(`/subjects/${subject.id}`)
    
    // Eliminar de la lista local
    const index = subjects.value.findIndex(s => s.id === subject.id)
    if (index !== -1) {
      subjects.value.splice(index, 1)
    }
    
    alert('Asignatura eliminada correctamente')
  } catch (e) {
    console.error('Error eliminando asignatura:', e)
    alert(e.response?.data?.message || 'Error al eliminar la asignatura')
  } finally {
    loading.value = false
  }
}

function changePage(page) {
  if (page >= 1 && page <= totalPages.value) {
    currentPage.value = page
  }
}

// Watch para recargar cuando cambie currentPage
watch(currentPage, () => {
  loadSubjects()
})

onMounted(() => {
  loadSubjects()
  loadCarreras()
})
</script>

<template>
  <Sidebar>
    <!-- Header -->
    <header class="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Gestión de Asignaturas</h1>
          <p class="text-gray-600 mt-1">Administra las asignaturas del sistema académico.</p>
        </div>
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center font-bold text-orange-700 text-sm">
            {{ nombre.charAt(0) }}
          </div>
          <div>
            <p class="text-sm font-bold text-gray-900">{{ nombre }}</p>
            <p class="text-gray-500 text-sm mt-1">{{ role }}</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard 
          label="Total asignaturas" 
          :value="totalItems" 
          icon="📚"
          color="bg-blue-500"
        />
        <StatCard 
          label="Asignaturas con código" 
          :value="subjects.filter(s => s.codigo).length" 
          icon="🔢"
          color="bg-green-500"
        />
        <StatCard 
          label="Créditos promedio" 
          :value="(subjects.reduce((total, s) => total + (s.creditos || 0), 0) / (subjects.length || 1)).toFixed(1)" 
          icon="⭐"
          color="bg-purple-500"
        />
        <StatCard 
          label="Con carrera asignada" 
          :value="subjects.filter(s => s.carrera_id).length" 
          icon="🎓"
          color="bg-orange-500"
        />
      </div>

      <!-- Search and Actions Bar -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div class="flex-1 relative w-full md:w-auto">
            <svg class="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar por código, nombre o carrera..."
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div class="flex gap-3 flex-wrap items-center">
            <!-- Filtro por Cupos (local) -->
            <select
              v-model="filtroCupos"
              class="px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los cupos</option>
              <option value="disponible">Con cupos</option>
              <option value="llena">Sin cupos</option>
            </select>

            <!-- Filtro por Duración (basado en créditos) -->
            <select
              v-model="filtroDuracion"
              class="px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las duraciones</option>
              <option value="corta">Corta (≤ 2 créditos)</option>
              <option value="media">Media (3-4 créditos)</option>
              <option value="larga">Larga (> 4 créditos)</option>
            </select>

            <!-- Botón Reload -->
            <button
              @click="reloadTable"
              class="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition flex items-center gap-2 whitespace-nowrap"
              title="Recargar y restablecer filtros"
              :disabled="loading"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" :class="{'animate-spin': loading}">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Recargar
            </button>

            <!-- Botón Crear -->
            <button
              @click="abrirModalCrear"
              class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center gap-2 whitespace-nowrap"
              :disabled="loading"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nueva asignatura
            </button>
          </div>
        </div>
      </div>

      <!-- Subjects Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Código</th>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Nombre</th>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Créditos</th>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Cupos</th>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Duración</th>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Carrera</th>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="subject in subjectsPaginados" :key="subject.id" class="hover:bg-gray-50 transition-colors">
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div :class="['w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm', getColorBadge(subject.creditos)]">
                      {{ subject.codigo?.substring(0, 2) || '--' }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ subject.codigo }}</p>
                      <p class="text-xs text-gray-500 mt-1">ID: {{ subject.id?.substring(0, 8) }}...</p>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-6">
                  <p class="font-medium text-gray-900">{{ subject.nombre }}</p>
                </td>
                <td class="py-4 px-6">
                  <span :class="['px-3 py-1 rounded-full text-xs font-medium', getColorBadge(subject.creditos)]">
                    {{ subject.creditos }} créditos
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span :class="['px-3 py-1 rounded-full text-xs font-medium', getCuposBadge(subject.cupos)]">
                    {{ subject.cupos || 0 }} cupos
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span :class="['px-3 py-1 rounded-full text-xs font-medium', getDuracionBadge(subject.creditos)]">
                    {{ subject.duracion || subject.creditos * 15 || 0 }} horas
                  </span>
                </td>
                <td class="py-4 px-6">
                  <span class="text-gray-700">
                    {{ getCarreraNombre(subject.carrera_id) }}
                  </span>
                </td>
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <button
                      @click="abrirModalEditar(subject)"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar asignatura"
                      :disabled="loading"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="eliminarSubject(subject)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar asignatura"
                      :disabled="loading"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              
              <tr v-if="subjectsPaginados.length === 0">
                <td colspan="7" class="py-8 px-6 text-center text-gray-500">
                  <div class="flex flex-col items-center justify-center">
                    <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75l-3.75 3.75m0 0l-3.75-3.75M3 12h18" />
                    </svg>
                    <p class="text-lg font-medium text-gray-900">No se encontraron asignaturas</p>
                    <p class="text-gray-600 mt-1">Intenta con otros términos de búsqueda o crea una nueva asignatura.</p>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div v-if="totalPages > 1" class="flex items-center justify-between border-t border-gray-200 px-6 py-4">
          <div class="text-sm text-gray-700">
            Mostrando <span class="font-medium">{{ (currentPage - 1) * itemsPerPage + 1 }}</span> a 
            <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, subjectsFiltrados.length) }}</span> de 
            <span class="font-medium">{{ subjectsFiltrados.length }}</span> asignaturas
            <span class="ml-2 text-gray-500">(Total: {{ totalItems }})</span>
          </div>
          <div class="flex items-center gap-2">
            <button
              @click="changePage(currentPage - 1)"
              :disabled="currentPage === 1"
              class="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            <template v-for="page in paginationPages" :key="page">
              <button
                v-if="page === '...'"
                disabled
                class="px-3 py-2 text-gray-500"
              >
                ...
              </button>
              <button
                v-else
                @click="changePage(page)"
                :class="[
                  'px-3 py-2 rounded-lg font-medium transition-colors',
                  currentPage === page 
                    ? 'bg-blue-500 text-white' 
                    : 'text-gray-700 hover:bg-gray-100'
                ]"
              >
                {{ page }}
              </button>
            </template>
            
            <button
              @click="changePage(currentPage + 1)"
              :disabled="currentPage === totalPages"
              class="px-3 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </main>

    <!-- Modal Crear/Editar Asignatura -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="cerrarModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900">
            {{ isEditing ? 'Editar Asignatura' : 'Nueva Asignatura' }}
          </h3>
          <button
            @click="cerrarModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
            :disabled="loading"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="guardarSubject" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Código *</label>
            <input
              v-model="currentSubject.codigo"
              type="text"
              placeholder="Ej: MAT101"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              :disabled="isEditing"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre *</label>
            <input
              v-model="currentSubject.nombre"
              type="text"
              placeholder="Ej: Matemáticas I"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Créditos</label>
            <input
              v-model.number="currentSubject.creditos"
              type="number"
              min="0"
              step="1"
              placeholder="0"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <!-- Campos locales (no se envían al backend) -->
          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Cupos (local)</label>
              <input
                v-model.number="currentSubject.cupos"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 mb-2">Duración (horas) (local)</label>
              <input
                v-model.number="currentSubject.duracion"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Carrera</label>
            <select
              v-model="currentSubject.carrera_id"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
            >
              <option :value="null">Sin carrera asignada</option>
              <option v-for="carrera in carreras" :key="carrera.id" :value="carrera.id">
                {{ carrera.nombre }} ({{ carrera.codigo || 'Sin código' }})
              </option>
            </select>
          </div>

          <div class="flex gap-3 pt-6">
            <button
              type="button"
              @click="cerrarModal"
              class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              :disabled="loading"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span v-if="loading">Guardando...</span>
              <span v-else>{{ isEditing ? 'Guardar cambios' : 'Crear asignatura' }}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  </Sidebar>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>