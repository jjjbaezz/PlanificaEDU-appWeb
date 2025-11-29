<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import http from '../services/http'

const auth = useAuthStore()
const router = useRouter()

const showUserMenu = ref(false)
const loading = ref(false)
const nombre = computed(() => auth.user?.nombre || 'Usuario')
const role = computed(() => auth.user?.rol || 'ESTUDIANTE')

// Datos del perfil
const perfil = ref({
  nombre: '',
  apellido: '',
  email: ''
})

// Datos de horario (solo para estudiantes)
const turnoPreferido = ref('')
const diasSeleccionados = ref({
  lunes: false,
  martes: false,
  miercoles: false,
  jueves: false,
  viernes: false,
  sabado: false
})

// Datos de seguridad
const seguridad = ref({
  passwordActual: '',
  passwordNuevo: '',
  passwordConfirmar: ''
})

// Cargar datos del usuario
async function loadUserData() {
  if (auth.isDummyMode) {
    // Modo dummy: usar datos del usuario en sesión
    perfil.value = {
      nombre: auth.user?.nombre?.split(' ')[0] || 'Ana',
      apellido: auth.user?.nombre?.split(' ')[1] || 'Perez',
      email: auth.user?.email || 'ana.perez@universidad.edu'
    }

    // Datos dummy de horario para estudiantes
    if (role.value === 'ESTUDIANTE') {
      turnoPreferido.value = 'manana'
      diasSeleccionados.value = {
        lunes: true,
        martes: false,
        miercoles: true,
        jueves: false,
        viernes: true,
        sabado: false
      }
    }
    return
  }

  loading.value = true
  try {
    // Obtener datos del perfil desde el backend
    const { data } = await http.get('/auth/me')
    if (data) {
      perfil.value = {
        nombre: data.nombre?.split(' ')[0] || '',
        apellido: data.nombre?.split(' ').slice(1).join(' ') || '',
        email: data.email || ''
      }

      // Si es estudiante, cargar preferencias de horario
      if (role.value === 'ESTUDIANTE' && data.preferences) {
        turnoPreferido.value = data.preferences.turno || ''
        if (data.preferences.dias && Array.isArray(data.preferences.dias)) {
          data.preferences.dias.forEach(dia => {
            if (diasSeleccionados.value.hasOwnProperty(dia)) {
              diasSeleccionados.value[dia] = true
            }
          })
        }
      }
    }
  } catch (e) {
    console.error('Error cargando datos del usuario:', e)
    // Fallback a datos dummy
    perfil.value = {
      nombre: auth.user?.nombre?.split(' ')[0] || '',
      apellido: auth.user?.nombre?.split(' ').slice(1).join(' ') || '',
      email: auth.user?.email || ''
    }
  } finally {
    loading.value = false
  }
}

// Guardar cambios del perfil
async function guardarPerfil() {
  if (auth.isDummyMode) {
    // Modo dummy: solo actualizar localmente
    const nombreCompleto = `${perfil.value.nombre} ${perfil.value.apellido}`.trim()
    const updatedUser = { ...auth.user, nombre: nombreCompleto, email: perfil.value.email }
    auth._setSession({ user: updatedUser, token: auth.token, isDummyMode: true })
    alert('Perfil actualizado correctamente (modo demo)')
    return
  }

  loading.value = true
  try {
    const nombreCompleto = `${perfil.value.nombre} ${perfil.value.apellido}`.trim()
    await http.patch(`/users/${auth.user.id}`, {
      nombre: nombreCompleto,
      email: perfil.value.email
    })

    // Actualizar usuario en sesión
    const updatedUser = { ...auth.user, nombre: nombreCompleto, email: perfil.value.email }
    auth._setSession({ user: updatedUser, token: auth.token })

    alert('Perfil actualizado correctamente')
  } catch (e) {
    console.error('Error guardando perfil:', e)
    alert(e.response?.data?.message || 'Error al guardar el perfil')
  } finally {
    loading.value = false
  }
}

// Guardar cambios de horario
async function guardarHorario() {
  const diasArray = Object.keys(diasSeleccionados.value).filter(dia => diasSeleccionados.value[dia])

  if (auth.isDummyMode) {
    alert('Horario actualizado correctamente (modo demo)')
    return
  }

  loading.value = true
  try {
    await http.put(`/users/${auth.user.id}/preferences`, {
      turno: turnoPreferido.value,
      dias: diasArray
    })
    alert('Horario actualizado correctamente')
  } catch (e) {
    console.error('Error guardando horario:', e)
    alert(e.response?.data?.message || 'Error al guardar el horario')
  } finally {
    loading.value = false
  }
}

// Actualizar contraseña
async function actualizarPassword() {
  if (!seguridad.value.passwordActual || !seguridad.value.passwordNuevo || !seguridad.value.passwordConfirmar) {
    alert('Por favor completa todos los campos de contraseña')
    return
  }

  if (seguridad.value.passwordNuevo !== seguridad.value.passwordConfirmar) {
    alert('Las contraseñas no coinciden')
    return
  }

  if (auth.isDummyMode) {
    alert('Contraseña actualizada correctamente (modo demo)')
    seguridad.value = { passwordActual: '', passwordNuevo: '', passwordConfirmar: '' }
    return
  }

  loading.value = true
  try {
    await http.patch(`/users/${auth.user.id}/password`, {
      passwordActual: seguridad.value.passwordActual,
      passwordNuevo: seguridad.value.passwordNuevo
    })
    alert('Contraseña actualizada correctamente')
    seguridad.value = { passwordActual: '', passwordNuevo: '', passwordConfirmar: '' }
  } catch (e) {
    console.error('Error actualizando contraseña:', e)
    alert(e.response?.data?.message || 'Error al actualizar la contraseña')
  } finally {
    loading.value = false
  }
}

// Cerrar sesión
function cerrarSesion() {
  if (confirm('¿Estás seguro de que deseas cerrar sesión?')) {
    auth.logout()
    router.push('/login')
  }
}

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

onMounted(() => {
  loadUserData()
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
        <RouterLink :to="role === 'ADMIN' ? '/admin/materias' : '/materias'" class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-600 hover:bg-gray-50">
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
        <RouterLink to="/configuracion" class="flex items-center gap-3 px-4 py-3 rounded-lg bg-sky-50 text-sky-600 font-medium">
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
            <h2 class="text-2xl font-bold text-gray-800">Configuración</h2>
            <p class="text-sm text-gray-500 mt-1">Gestiona la información de tu perfil y la configuración de tu cuenta.</p>
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
                  <p class="text-xs text-gray-500">{{ role === 'ADMIN' ? 'Administrador' : role === 'PROFESOR' ? 'Profesor' : 'Estudiante' }}</p>
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
        <div class="max-w-4xl mx-auto space-y-6">
          <!-- Perfil -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-6">Perfil</h3>

            <div class="flex items-center gap-6 mb-6">
              <div class="w-20 h-20 bg-sky-100 rounded-full flex items-center justify-center">
                <span class="text-sky-600 font-bold text-3xl">{{ nombre.charAt(0) }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-sky-400">Cambiar foto</p>
                <p class="text-xs text-gray-400 mt-1">JPG, GIF or PNG. 1MB max.</p>
              </div>
            </div>

            <form @submit.prevent="guardarPerfil" class="space-y-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input
                    v-model="perfil.nombre"
                    type="text"
                    placeholder="Nombre"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                  <input
                    v-model="perfil.apellido"
                    type="text"
                    placeholder="Apellido"
                    class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
                  />
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                <input
                  v-model="perfil.email"
                  type="email"
                  placeholder="correo@ejemplo.com"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
                />
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="loading"
                  class="px-6 py-2 bg-sky-400 hover:bg-sky-500 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>

          <!-- Cambiar horario (solo para estudiantes) -->
          <div v-if="role === 'ESTUDIANTE'" class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-6">Cambiar tu horario</h3>
            <p class="text-sm text-gray-500 mb-6">Ingresa tus preferencias de horario</p>

            <form @submit.prevent="guardarHorario" class="space-y-6">
              <!-- Turno preferido -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Turno Preferido</label>
                <select
                  v-model="turnoPreferido"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none bg-white"
                >
                  <option value="">Mañana / Tarde / Noche</option>
                  <option value="manana">Mañana</option>
                  <option value="tarde">Tarde</option>
                  <option value="noche">Noche</option>
                </select>
              </div>

              <!-- Días -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">Días</label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="diasSeleccionados.lunes"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400"
                    />
                    <span class="text-gray-700">Lunes</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="diasSeleccionados.jueves"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400"
                    />
                    <span class="text-gray-700">Jueves</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="diasSeleccionados.martes"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400"
                    />
                    <span class="text-gray-700">Martes</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="diasSeleccionados.viernes"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400"
                    />
                    <span class="text-gray-700">Viernes</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="diasSeleccionados.miercoles"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400"
                    />
                    <span class="text-gray-700">Miércoles</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="checkbox"
                      v-model="diasSeleccionados.sabado"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400"
                    />
                    <span class="text-gray-700">Sábado</span>
                  </label>
                </div>
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="loading"
                  class="px-6 py-2 bg-sky-400 hover:bg-sky-500 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>

          <!-- Seguridad -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-6">Seguridad</h3>

            <form @submit.prevent="actualizarPassword" class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Contraseña Actual</label>
                <input
                  v-model="seguridad.passwordActual"
                  type="password"
                  placeholder="••••••••"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña</label>
                <input
                  v-model="seguridad.passwordNuevo"
                  type="password"
                  placeholder="••••••••"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 mb-2">Confirmar Nueva Contraseña</label>
                <input
                  v-model="seguridad.passwordConfirmar"
                  type="password"
                  placeholder="••••••••"
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none"
                />
              </div>

              <div class="flex justify-end">
                <button
                  type="submit"
                  :disabled="loading"
                  class="px-6 py-2 bg-sky-400 hover:bg-sky-500 text-white font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Actualizar Contraseña
                </button>
              </div>
            </form>
          </div>

          <!-- Cuenta -->
          <div class="bg-white rounded-xl shadow-sm p-6">
            <h3 class="text-lg font-semibold text-gray-800 mb-4">Cuenta</h3>
            <p class="text-sm text-gray-500 mb-6">Finaliza la sesión actual en este dispositivo.</p>

            <button
              @click="cerrarSesion"
              class="px-6 py-2 bg-red-50 hover:bg-red-100 text-red-600 font-medium rounded-lg transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </main>
    </div>
  </div>
</template>
