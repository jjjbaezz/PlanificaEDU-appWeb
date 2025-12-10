
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import { useRouter } from 'vue-router'
import Sidebar from '../../components/Sidebar.vue'
import http from '../../services/http'

const auth = useAuthStore()
const router = useRouter()

const searchQuery = ref('')
const filtroEstado = ref('')
const filtroRol = ref('')
const loading = ref(false)
const error = ref(null)

const showUserMenu = ref(false)
const nombre = computed(() => auth.user?.nombre || 'Usuario')

const showModal = ref(false)
const isEditing = ref(false)
const currentUsuario = ref({
  id: null,
  nombre: '',
  email: '',
  password: '',
  rol: '',
  activo: true
})

const usuarios = ref([])
const currentPage = ref(1)
const itemsPerPage = 10

const usuariosFiltrados = computed(() => {
  return usuarios.value.filter(usuario => {
    const queryMatch = searchQuery.value
      ? usuario.nombre.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        usuario.email.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        usuario.rol.toLowerCase().includes(searchQuery.value.toLowerCase())
      : true

    const estadoMatch = filtroEstado.value !== '' ? usuario.activo === (filtroEstado.value === 'activo') : true
    const rolMatch = filtroRol.value !== '' ? usuario.rol === filtroRol.value : true

    return queryMatch && estadoMatch && rolMatch
  })
})

const usuariosPaginados = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return usuariosFiltrados.value.slice(start, end)
})

const totalPages = computed(() => {
  return Math.ceil(usuariosFiltrados.value.length / itemsPerPage)
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

async function loadUsuarios() {
  loading.value = true
  error.value = null

  try {
    const { data } = await http.get('/users')
    const lista = Array.isArray(data) ? data : data.users || []
    usuarios.value = lista.map(usuario => ({
      ...usuario,
      iniciales: getIniciales(usuario.nombre),
      colorBadge: getColorBadge(usuario.rol)
    }))
    
  } catch (e) {
    console.error('Error cargando usuarios:', e)
    error.value = e.message
  } finally {
    loading.value = false
  }
}

function getIniciales(nombre) {
  const partes = nombre.split(' ')
  return partes.length >= 2
    ? `${partes[0][0]}${partes[1][0]}`.toUpperCase()
    : nombre.substring(0, 2).toUpperCase()
}

function getColorBadge(rol) {
  const colores = {
    'ADMIN': 'bg-blue-100 text-blue-600',
    'PROFESOR': 'bg-purple-100 text-purple-600',
    'ESTUDIANTE': 'bg-green-100 text-green-600'
  }
  return colores[rol] || 'bg-gray-100 text-gray-600'
}

function abrirModalCrear() {
  isEditing.value = false
  currentUsuario.value = {
    id: null,
    nombre: '',
    email: '',
    password: '',
    rol: '',
    activo: true
  }
  showModal.value = true
}

function abrirModalEditar(usuario) {
  isEditing.value = true
  currentUsuario.value = { ...usuario }
  showModal.value = true
}

function cerrarModal() {
  showModal.value = false
  currentUsuario.value = {
    id: null,
    nombre: '',
    email: '',
    password: '',
    rol: '',
    activo: true
  }
}

async function guardarUsuario() {
  if (!currentUsuario.value.nombre || !currentUsuario.value.email || !currentUsuario.value.rol) {
    alert('Por favor completa todos los campos')
    return
  }

  loading.value = true
  try {
    if (isEditing.value) {
      const { data } = await http.patch(`/users/${currentUsuario.value.id}`, currentUsuario.value)
      const index = usuarios.value.findIndex(u => u.id === currentUsuario.value.id)
      if (index !== -1) {
        usuarios.value[index] = {
          ...data,
          iniciales: getIniciales(data.nombre),
          colorBadge: getColorBadge(data.rol)
        }
      }
      cerrarModal()
      alert('Usuario actualizado correctamente')
    } else {
      const payload = {
        nombre: currentUsuario.value.nombre,
        email: currentUsuario.value.email,
        rol: currentUsuario.value.rol,
        password: currentUsuario.value.password,
        activo: currentUsuario.value.activo
      }
      const { data } = await http.post('/users', payload)
      usuarios.value.push({
        ...data.user,
        iniciales: getIniciales(data.user.nombre),
        colorBadge: getColorBadge(data.user.rol)
      })
      cerrarModal()
      alert('Usuario creado correctamente')
    }
  } catch (e) {
    console.error('Error guardando usuario:', e)
    alert(e.response?.data?.message || 'Error al guardar el usuario')
  } finally {
    loading.value = false
  }
}

async function eliminarUsuario(usuario) {
  if (!confirm(`¿Marcar como inactivo al usuario ${usuario.nombre}?`)) return

  loading.value = true
  try {
    const { data } = await http.patch(`/users/${usuario.id}`, { activo: false })
    const index = usuarios.value.findIndex(u => u.id === usuario.id)
    if (index !== -1) {
      usuarios.value[index] = {
        ...data,
        iniciales: getIniciales(data.nombre),
        colorBadge: getColorBadge(data.rol)
      }
    }
  } catch (e) {
    console.error('Error marcando usuario como inactivo:', e)
    alert(e.response?.data?.message || 'Error al eliminar el usuario')
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
  loadUsuarios()
})
</script>






<template>
  <Sidebar>
    <!-- Header -->
    <header class="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Gestión de Usuarios</h1>
          <p class="text-gray-600 mt-1">Crea, edita y elimina perfiles de usuario en el sistema.</p>
        </div>
        <div class="flex items-center gap-4">
          <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div class="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm">
            {{ nombre.charAt(0) }}
          </div>
          <div>
            <p class="text-sm font-bold text-gray-900">{{ nombre }}</p>
            <p class="text-gray-500 text-sm mt-1">Administrador</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard 
          label="Total usuarios" 
          :value="usuarios.length" 
          icon="👥"
          color="bg-blue-500"
        />
        <StatCard 
          label="Estudiantes" 
          :value="usuarios.filter(u => u.rol === 'ESTUDIANTE').length" 
          icon="🎓"
          color="bg-green-500"
        />
        <StatCard 
          label="Profesores" 
          :value="usuarios.filter(u => u.rol === 'PROFESOR').length" 
          icon="👨‍🏫"
          color="bg-purple-500"
        />
        <StatCard 
          label="Administradores" 
          :value="usuarios.filter(u => u.rol === 'ADMIN').length" 
          icon="⚙️"
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
              placeholder="Buscar por nombre, email o rol..."
              class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <div class="flex gap-3 flex-wrap">
            <button
              @click="abrirModalCrear"
              class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center gap-2 whitespace-nowrap"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Nuevo usuario
            </button>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Usuario</th>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Rol</th>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Email</th>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Estado</th>
                <th class="text-left py-4 px-6 font-semibold text-gray-700 text-xs uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="usuario in usuariosPaginados" :key="usuario.id" class="hover:bg-gray-50 transition-colors">
                <td class="py-4 px-6">
                  <div class="flex items-center gap-3">
                    <div :class="['w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm', usuario.colorBadge]">
                      {{ usuario.iniciales }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900">{{ usuario.nombre }}</p>
                      <p class="text-xs text-gray-500 mt-1">ID: {{ usuario.id }}</p>
                    </div>
                  </div>
                </td>
                <td class="py-4 px-6">
                  <span :class="['px-3 py-1 rounded-full text-xs font-medium', usuario.colorBadge]">
                    {{ usuario.rol === 'ADMIN' ? 'Admin' : usuario.rol === 'PROFESOR' ? 'Profesor' : 'Estudiante' }}
                  </span>
                </td>
                <td class="py-4 px-6 text-gray-700">{{ usuario.email }}</td>
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <span :class="['w-2 h-2 rounded-full', usuario.activo ? 'bg-green-500' : 'bg-red-500']"></span>
                    <span :class="['px-3 py-1 rounded-full text-xs font-medium', usuario.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                      {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </div>
                </td>
                <td class="py-4 px-6">
                  <div class="flex items-center gap-2">
                    <button
                      @click="abrirModalEditar(usuario)"
                      class="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="Editar usuario"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      @click="eliminarUsuario(usuario)"
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar usuario"
                    >
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              
              <tr v-if="usuariosPaginados.length === 0">
                <td colspan="5" class="py-8 px-6 text-center text-gray-500">
                  <div class="flex flex-col items-center justify-center">
                    <svg class="w-12 h-12 text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75l-3.75 3.75m0 0l-3.75-3.75M3 12h18" />
                    </svg>
                    <p class="text-lg font-medium text-gray-900">No se encontraron usuarios</p>
                    <p class="text-gray-600 mt-1">Intenta con otros términos de búsqueda o crea un nuevo usuario.</p>
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
            <span class="font-medium">{{ Math.min(currentPage * itemsPerPage, usuariosFiltrados.length) }}</span> de 
            <span class="font-medium">{{ usuariosFiltrados.length }}</span> usuarios
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

    <!-- Modal Crear/Editar Usuario -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="cerrarModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
        <div class="flex items-center justify-between mb-6">
          <h3 class="text-xl font-bold text-gray-900">
            {{ isEditing ? 'Editar Usuario' : 'Nuevo Usuario' }}
          </h3>
          <button
            @click="cerrarModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form @submit.prevent="guardarUsuario" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre completo</label>
            <input
              v-model="currentUsuario.nombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div v-if="!isEditing">
            <label class="block text-sm font-medium text-gray-700 mb-2">Correo electrónico</label>
            <input
              v-model="currentUsuario.email"
              type="email"
              placeholder="correo@ejemplo.com"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          <div v-if="!isEditing">
            <label class="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
            <input
              v-model="currentUsuario.password"
              type="password"
              placeholder="Contraseña segura"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>


          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <select
              v-model="currentUsuario.rol"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
              required
            >
              <option value="">Seleccionar rol</option>
              <option value="ESTUDIANTE">Estudiante</option>
              <option value="PROFESOR">Profesor</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>

          <div class="flex items-center gap-3">
            <input
              v-model="currentUsuario.activo"
              type="checkbox"
              id="activo"
              class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
            />
            <label for="activo" class="text-sm font-medium text-gray-700">Usuario activo</label>
          </div>

          <div class="flex gap-3 pt-6">
            <button
              type="button"
              @click="cerrarModal"
              class="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isEditing ? 'Guardar cambios' : 'Crear usuario' }}
            </button>
          </div>
        </form>
      </div>
    </div>

    <!-- Modal Contraseña Temporal -->
    <div
      v-if="showPasswordModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="cerrarPasswordModal"
    >
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-bold text-gray-900">Usuario Creado</h3>
          <button
            @click="cerrarPasswordModal"
            class="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <div class="flex">
            <svg class="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <p class="text-sm text-yellow-700">
              Esta contraseña solo se mostrará una vez. Asegúrate de copiarla antes de cerrar esta ventana.
            </p>
          </div>
        </div>

        <p class="text-sm text-gray-600 mb-4">
          Contraseña temporal generada para el nuevo usuario:
        </p>

        <div class="mb-6">
          <label class="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
          <div class="relative">
            <input
              :type="showPassword ? 'text' : 'password'"
              :value="tempPassword"
              readonly
              class="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div class="absolute right-2 top-1/2 -translate-y-1/2 flex gap-2">
              <button
                type="button"
                @click="showPassword = !showPassword"
                class="p-2 text-gray-500 hover:text-gray-700 transition-colors rounded"
                :title="showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'"
              >
                <svg v-if="showPassword" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                </svg>
                <svg v-else class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </button>
              <button
                type="button"
                @click="copiarPassword"
                class="p-2 text-blue-600 hover:bg-blue-50 transition-colors rounded"
                title="Copiar contraseña"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-3 mb-6">
          <div class="flex">
            <svg class="w-5 h-5 text-gray-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
            <p class="text-xs text-gray-600">
              El usuario deberá cambiar esta contraseña en su primer inicio de sesión por motivos de seguridad.
            </p>
          </div>
        </div>

        <button
          @click="copiarPassword"
          class="w-full px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors font-medium"
        >
          Copiar Contraseña
        </button>

        <p class="text-xs text-center text-gray-500 mt-4">
          Esta ventana se cerrará automáticamente en 10 segundos
        </p>
      </div>
    </div>
  </Sidebar>
</template>
<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.animate-fade-in {
  animation: fade-in 0.2s ease-out;
}
</style>
