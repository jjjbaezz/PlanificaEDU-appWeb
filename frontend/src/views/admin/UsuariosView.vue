<script setup>
import { ref, computed, onMounted } from 'vue'
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

// Modal para crear/editar usuario
const showModal = ref(false)
const isEditing = ref(false)
const currentUsuario = ref({
  id: null,
  nombre: '',
  email: '',
  rol: '',
  activo: true
})

// Modal de contraseña temporal
const showPasswordModal = ref(false)
const tempPassword = ref('')
const showPassword = ref(false)
const passwordModalTimer = ref(null)

// Datos dummy de usuarios
const usuarios = ref([
  {
    id: 1,
    nombre: 'Dr. Alejandra Vargas',
    email: 'a.vargas@unimal.edu',
    rol: 'PROFESOR',
    iniciales: 'AV',
    colorBadge: 'bg-purple-100 text-purple-600',
    activo: true
  },
  {
    id: 2,
    nombre: 'Sofía Ramírez',
    email: 's.ramirez@unimal.edu',
    rol: 'ESTUDIANTE',
    iniciales: 'SR',
    colorBadge: 'bg-green-100 text-green-600',
    activo: true
  },
  {
    id: 3,
    nombre: 'Carlos Mendoza',
    email: 'c.mendoza@unimal.edu',
    rol: 'ADMIN',
    iniciales: 'CM',
    colorBadge: 'bg-blue-100 text-blue-600',
    activo: true
  }
])

// Paginación
const currentPage = ref(1)
const itemsPerPage = 10

// Usuarios filtrados por búsqueda
const usuariosFiltrados = computed(() => {
  if (!searchQuery.value) return usuarios.value

  const query = searchQuery.value.toLowerCase()
  return usuarios.value.filter(usuario =>
    usuario.nombre.toLowerCase().includes(query) ||
    usuario.email.toLowerCase().includes(query) ||
    usuario.rol.toLowerCase().includes(query)
  )
})

// Usuarios paginados
const usuariosPaginados = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  const end = start + itemsPerPage
  return usuariosFiltrados.value.slice(start, end)
})

// Total de páginas
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

// Cargar usuarios desde el backend
async function loadUsuarios() {
  if (auth.isDummyMode) return // Usar datos dummy

  loading.value = true
  error.value = null

  try {
    const { data } = await http.get('/admin/usuarios')
    if (data) {
      // Agregar propiedades calculadas para UI
      usuarios.value = data.map(usuario => ({
        ...usuario,
        iniciales: getIniciales(usuario.nombre),
        colorBadge: getColorBadge(usuario.rol)
      }))
    }
  } catch (e) {
    console.error('Error cargando usuarios:', e)
    error.value = e.message
    // Mantener datos dummy como fallback
  } finally {
    loading.value = false
  }
}

// Obtener iniciales del nombre
function getIniciales(nombre) {
  const partes = nombre.split(' ')
  if (partes.length >= 2) {
    return `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase()
  }
  return nombre.substring(0, 2).toUpperCase()
}

// Obtener color de badge según el rol
function getColorBadge(rol) {
  const colores = {
    'ADMIN': 'bg-blue-100 text-blue-600',
    'PROFESOR': 'bg-purple-100 text-purple-600',
    'ESTUDIANTE': 'bg-green-100 text-green-600'
  }
  return colores[rol] || 'bg-gray-100 text-gray-600'
}

// Abrir modal para crear usuario
function abrirModalCrear() {
  isEditing.value = false
  currentUsuario.value = {
    id: null,
    nombre: '',
    email: '',
    rol: '',
    activo: true
  }
  showModal.value = true
}

// Abrir modal para editar usuario
function abrirModalEditar(usuario) {
  isEditing.value = true
  currentUsuario.value = { ...usuario }
  showModal.value = true
}

// Cerrar modal
function cerrarModal() {
  showModal.value = false
  currentUsuario.value = {
    id: null,
    nombre: '',
    email: '',
    rol: '',
    activo: true
  }
}

// Generar contraseña aleatoria
function generarPassword() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

// Mostrar modal de contraseña con timer
function mostrarPasswordModal(password) {
  tempPassword.value = password
  showPassword.value = false
  showPasswordModal.value = true

  // Auto-cerrar después de 10 segundos
  if (passwordModalTimer.value) {
    clearTimeout(passwordModalTimer.value)
  }
  passwordModalTimer.value = setTimeout(() => {
    cerrarPasswordModal()
  }, 10000)
}

// Cerrar modal de contraseña
function cerrarPasswordModal() {
  showPasswordModal.value = false
  tempPassword.value = ''
  showPassword.value = false
  if (passwordModalTimer.value) {
    clearTimeout(passwordModalTimer.value)
    passwordModalTimer.value = null
  }
}

// Copiar contraseña al portapapeles
async function copiarPassword() {
  try {
    await navigator.clipboard.writeText(tempPassword.value)
    alert('Contraseña copiada al portapapeles')
  } catch (e) {
    console.error('Error copiando contraseña:', e)
    alert('Error al copiar la contraseña')
  }
}

// Guardar usuario (crear o editar)
async function guardarUsuario() {
  if (!currentUsuario.value.nombre || !currentUsuario.value.email || !currentUsuario.value.rol) {
    alert('Por favor completa todos los campos')
    return
  }

  if (auth.isDummyMode) {
    // Modo dummy: actualizar lista local
    if (isEditing.value) {
      const index = usuarios.value.findIndex(u => u.id === currentUsuario.value.id)
      if (index !== -1) {
        usuarios.value[index] = {
          ...currentUsuario.value,
          iniciales: getIniciales(currentUsuario.value.nombre),
          colorBadge: getColorBadge(currentUsuario.value.rol)
        }
      }
    } else {
      const newId = Math.max(...usuarios.value.map(u => u.id), 0) + 1
      const password = generarPassword()
      usuarios.value.push({
        ...currentUsuario.value,
        id: newId,
        iniciales: getIniciales(currentUsuario.value.nombre),
        colorBadge: getColorBadge(currentUsuario.value.rol)
      })
      // Mostrar modal con contraseña generada
      cerrarModal()
      mostrarPasswordModal(password)
      return
    }
    cerrarModal()
    return
  }

  loading.value = true
  try {
    if (isEditing.value) {
      // Actualizar usuario existente
      const { data } = await http.patch(`/admin/usuarios/${currentUsuario.value.id}`, currentUsuario.value)
      const index = usuarios.value.findIndex(u => u.id === currentUsuario.value.id)
      if (index !== -1) {
        usuarios.value[index] = {
          ...data,
          iniciales: getIniciales(data.nombre),
          colorBadge: getColorBadge(data.rol)
        }
      }
      cerrarModal()
    } else {
      // Crear nuevo usuario
      const { data } = await http.post('/admin/usuarios', currentUsuario.value)
      usuarios.value.push({
        ...data.user,
        iniciales: getIniciales(data.user.nombre),
        colorBadge: getColorBadge(data.user.rol)
      })
      cerrarModal()
      // Mostrar modal con contraseña temporal del backend
      mostrarPasswordModal(data.tempPassword)
    }
  } catch (e) {
    console.error('Error guardando usuario:', e)
    alert(e.response?.data?.message || 'Error al guardar el usuario')
  } finally {
    loading.value = false
  }
}

// Eliminar usuario
async function eliminarUsuario(usuario) {
  if (!confirm(`¿Estás seguro de que deseas eliminar al usuario ${usuario.nombre}?`)) {
    return
  }

  if (auth.isDummyMode) {
    // Modo dummy: eliminar de la lista local
    usuarios.value = usuarios.value.filter(u => u.id !== usuario.id)
    return
  }

  loading.value = true
  try {
    await http.delete(`/admin/usuarios/${usuario.id}`)
    usuarios.value = usuarios.value.filter(u => u.id !== usuario.id)
  } catch (e) {
    console.error('Error eliminando usuario:', e)
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
        <RouterLink to="/usuarios" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-sky-50 text-sky-600 font-medium">
          <span>👥</span>
          <span>Usuarios</span>
        </RouterLink>
        <RouterLink to="/admin/materias" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
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
            <h2 class="text-2xl font-bold text-gray-800">Gestión de Usuarios</h2>
            <p class="text-sm text-gray-500 mt-1">Crea, edita y elimina perfiles de usuario en el sistema.</p>
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
          <!-- Search Bar y Botón Añadir -->
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
              @click="abrirModalCrear"
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
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre Completo</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Correo Electrónico</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rol</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200">
                <tr v-for="usuario in usuariosPaginados" :key="usuario.id" class="hover:bg-gray-50">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-3">
                      <div :class="['w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm', usuario.colorBadge]">
                        {{ usuario.iniciales }}
                      </div>
                      <span class="text-sm text-gray-800">{{ usuario.nombre }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-sm text-gray-600">{{ usuario.email }}</td>
                  <td class="px-4 py-3">
                    <span
                      :class="['px-3 py-1 rounded-full text-xs font-medium', usuario.colorBadge]"
                    >
                      {{ usuario.rol === 'ADMIN' ? 'Admin' : usuario.rol === 'PROFESOR' ? 'Profesor' : 'Estudiante' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <button
                        @click="abrirModalEditar(usuario)"
                        class="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition"
                        title="Editar usuario"
                      >
                        ✏️
                      </button>
                      <button
                        @click="eliminarUsuario(usuario)"
                        class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar usuario"
                      >
                        🗑️
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="usuariosPaginados.length === 0">
                  <td colspan="4" class="px-4 py-8 text-center text-gray-500">
                    No se encontraron usuarios
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

    <!-- Modal Crear/Editar Usuario -->
    <div
      v-if="showModal"
      class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      @click.self="cerrarModal"
    >
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        <h3 class="text-xl font-semibold text-gray-800 mb-6">
          {{ isEditing ? 'Editar Usuario' : 'Añadir Usuario' }}
        </h3>

        <form @submit.prevent="guardarUsuario" class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre Completo</label>
            <input
              v-model="currentUsuario.nombre"
              type="text"
              placeholder="Ej: Juan Pérez"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
            <input
              v-model="currentUsuario.email"
              type="email"
              placeholder="correo@ejemplo.com"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
              required
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Rol</label>
            <select
              v-model="currentUsuario.rol"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none bg-white"
              required
            >
              <option value="">Seleccionar rol</option>
              <option value="ADMIN">Admin</option>
              <option value="PROFESOR">Profesor</option>
              <option value="ESTUDIANTE">Estudiante</option>
            </select>
          </div>

          <div class="flex items-center gap-3">
            <input
              v-model="currentUsuario.activo"
              type="checkbox"
              id="activo"
              class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400"
            />
            <label for="activo" class="text-sm font-medium text-gray-700">Usuario activo</label>
          </div>

          <div class="flex gap-3 pt-4">
            <button
              type="button"
              @click="cerrarModal"
              class="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              :disabled="loading"
              class="flex-1 px-4 py-2 bg-sky-400 hover:bg-sky-500 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ isEditing ? 'Guardar' : 'Crear' }}
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
      <div class="bg-white rounded-xl shadow-xl max-w-md w-full p-6 animate-fade-in">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-xl font-semibold text-gray-800">Usuario Creado</h3>
          <button
            @click="cerrarPasswordModal"
            class="text-gray-400 hover:text-gray-600 transition"
          >
            ✕
          </button>
        </div>

        <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
          <p class="text-sm text-yellow-700">
            ⚠️ Esta contraseña solo se mostrará una vez. Asegúrate de copiarla antes de cerrar esta ventana.
          </p>
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
              class="w-full px-4 py-3 pr-20 border border-gray-300 rounded-lg bg-gray-50 font-mono text-sm"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="absolute right-12 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition"
              title="Mostrar/Ocultar contraseña"
            >
              <span v-if="showPassword" class="text-xl">👁️</span>
              <span v-else class="text-xl">👁️‍🗨️</span>
            </button>
            <button
              type="button"
              @click="copiarPassword"
              class="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-sky-600 hover:bg-sky-50 rounded transition"
              title="Copiar contraseña"
            >
              📋
            </button>
          </div>
        </div>

        <div class="bg-gray-50 rounded-lg p-3 mb-4">
          <p class="text-xs text-gray-600">
            💡 El usuario deberá cambiar esta contraseña en su primer inicio de sesión.
          </p>
        </div>

        <button
          @click="copiarPassword"
          class="w-full px-4 py-2 bg-sky-400 hover:bg-sky-500 text-white rounded-lg transition font-medium"
        >
          Copiar Contraseña
        </button>

        <p class="text-xs text-center text-gray-500 mt-3">
          Esta ventana se cerrará automáticamente en 10 segundos
        </p>
      </div>
    </div>
  </div>
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
