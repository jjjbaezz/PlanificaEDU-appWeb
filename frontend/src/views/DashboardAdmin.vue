<template>
  <Sidebar>
    <!-- Header -->
    <header class="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Panel de Administración</h1>
          <p class="text-gray-600 mt-1">Gestión completa del sistema</p>
        </div>
        <div class="flex items-center gap-4">
          <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div class="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm">
            {{ iniciales }}
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
          label="Usuarios totales" 
          :value="estadisticas.usuariosTotales" 
          icon="👥"
          color="bg-blue-500"
          @click="router.push('/admin/usuarios')"
        />
        <StatCard 
          label="Materias activas" 
          :value="estadisticas.materiasActivas" 
          icon="📚"
          color="bg-purple-500"
          @click="router.push('/admin/materias')"
        />
        <StatCard 
          label="Carreras registradas" 
          :value="estadisticas.carrerasRegistradas" 
          icon="🎓"
          color="bg-green-500"
          @click="router.push('/admin/carreras')"
        />
        <StatCard 
          label="Grupos activos" 
          :value="estadisticas.gruposActivos" 
          icon="🏫"
          color="bg-orange-500"
          @click="router.push('/admin/inscripciones')"
        />
      </div>

      <!-- Main Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
        <!-- Acciones Rápidas -->
        <div class="lg:col-span-1 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Acciones rápidas</h3>
          
          <div class="space-y-3">
            <RouterLink 
              v-for="(accion, idx) in accionesRapidas" 
              :key="idx" 
              :to="accion.ruta"
              class="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition-colors cursor-pointer"
            >
              <span class="text-xl flex-shrink-0">{{ accion.icono }}</span>
              <div class="flex-1">
                <p class="font-semibold text-gray-900">{{ accion.titulo }}</p>
                <p class="text-xs text-gray-600 mt-1">{{ accion.descripcion }}</p>
              </div>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </RouterLink>
          </div>
        </div>

        <!-- Últimos Usuarios Registrados -->
        <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-lg font-bold text-gray-900">Últimos usuarios registrados</h3>
            <RouterLink to="/admin/usuarios" class="text-sm text-blue-600 hover:text-blue-800 font-medium">
              Ver todos →
            </RouterLink>
          </div>
          
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr class="border-b border-gray-200">
                  <th class="text-left py-3 px-2 font-semibold text-gray-700 text-xs uppercase">Usuario</th>
                  <th class="text-left py-3 px-2 font-semibold text-gray-700 text-xs uppercase">Rol</th>
                  <th class="text-left py-3 px-2 font-semibold text-gray-700 text-xs uppercase">Correo</th>
                  <th class="text-left py-3 px-2 font-semibold text-gray-700 text-xs uppercase">Fecha registro</th>
                  <th class="text-left py-3 px-2 font-semibold text-gray-700 text-xs uppercase">Estado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(usuario, idx) in ultimosUsuarios" :key="idx" class="border-b border-gray-100 hover:bg-gray-50">
                  <td class="py-4 px-2">
                    <div class="flex items-center gap-3">
                      <div :class="['w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold', usuario.colorBadge]">
                        {{ usuario.iniciales }}
                      </div>
                      <span class="text-gray-900">{{ usuario.nombre }}</span>
                    </div>
                  </td>
                  <td class="py-4 px-2">
                    <span :class="['px-3 py-1 rounded-full text-xs font-medium', usuario.colorBadge]">
                      {{ usuario.rol }}
                    </span>
                  </td>
                  <td class="py-4 px-2 text-gray-700">{{ usuario.email }}</td>
                  <td class="py-4 px-2 text-gray-700">{{ usuario.fechaRegistro }}</td>
                  <td class="py-4 px-2">
                    <span :class="['px-3 py-1 rounded-full text-xs font-medium', usuario.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700']">
                      {{ usuario.activo ? 'Activo' : 'Inactivo' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sistema y Estadísticas -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-8">
        <!-- Estadísticas por Rol -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Distribución de usuarios por rol</h3>
          
          <div class="space-y-4">
            <div v-for="(rol, idx) in distribucionRoles" :key="idx" class="flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-3 h-3 rounded-full" :class="rol.color"></div>
                <span class="text-sm font-medium text-gray-700">{{ rol.nombre }}</span>
              </div>
              <div class="flex items-center gap-4">
                <span class="text-sm font-bold text-gray-900">{{ rol.cantidad }}</span>
                <div class="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    class="h-full rounded-full" 
                    :class="rol.color"
                    :style="{ width: rol.porcentaje + '%' }"
                  ></div>
                </div>
                <span class="text-sm text-gray-500 w-10 text-right">{{ rol.porcentaje }}%</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Actividad Reciente -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Actividad reciente del sistema</h3>
          
          <div class="space-y-4">
            <div v-for="(actividad, idx) in actividadReciente" :key="idx" class="flex gap-3">
              <div :class="['w-10 h-10 rounded-full flex items-center justify-center', actividad.colorFondo]">
                <span class="text-lg">{{ actividad.icono }}</span>
              </div>
              <div class="flex-1">
                <p class="font-medium text-gray-900 text-sm">{{ actividad.descripcion }}</p>
                <div class="flex items-center gap-2 mt-1">
                  <span class="text-xs text-gray-500">{{ actividad.usuario }}</span>
                  <span class="text-xs text-gray-400">•</span>
                  <span class="text-xs text-gray-500">{{ actividad.tiempo }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Información del Sistema -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div class="bg-blue-50 rounded-2xl border border-blue-100 p-6">
          <div class="flex items-center gap-3 mb-3">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-blue-600 text-xl">⚙️</span>
            </div>
            <h4 class="font-bold text-gray-900">Estado del sistema</h4>
          </div>
          <p class="text-sm text-gray-700 mb-4">Todos los servicios funcionando correctamente.</p>
          <div class="space-y-2">
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">API</span>
              <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Operativa</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Base de datos</span>
              <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Estable</span>
            </div>
            <div class="flex items-center justify-between text-sm">
              <span class="text-gray-600">Servidor</span>
              <span class="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Online</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div class="flex items-center justify-between mb-4">
            <h4 class="font-bold text-gray-900">Próximas tareas</h4>
            <span class="text-xs text-gray-500">Hoy</span>
          </div>
          <div class="space-y-3">
            <div v-for="(tarea, idx) in proximasTareas" :key="idx" class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div class="flex items-center gap-3">
                <input type="checkbox" class="w-4 h-4 text-blue-600 rounded" />
                <span class="text-sm text-gray-900">{{ tarea.descripcion }}</span>
              </div>
              <span class="text-xs text-gray-500">{{ tarea.hora }}</span>
            </div>
          </div>
        </div>

        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h4 class="font-bold text-gray-900 mb-4">Enlaces útiles</h4>
          <div class="space-y-3">
            <a 
              v-for="(enlace, idx) in enlacesUtiles" 
              :key="idx" 
              :href="enlace.url" 
              target="_blank"
              class="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <span class="text-xl">{{ enlace.icono }}</span>
              <div class="flex-1">
                <p class="font-medium text-sm text-gray-900">{{ enlace.titulo }}</p>
                <p class="text-xs text-gray-500">{{ enlace.descripcion }}</p>
              </div>
            </a>
          </div>
        </div>
      </div>
    </main>
  </Sidebar>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import Sidebar from '../components/Sidebar.vue'
import StatCard from '../components/StatCard.vue'

const router = useRouter()
const auth = useAuthStore()

const nombre = computed(() => auth.user?.nombre || 'Administrador')
const iniciales = computed(() => {
  if (!auth.user?.nombre) return 'AD'
  const partes = auth.user.nombre.split(' ')
  if (partes.length >= 2) {
    return `${partes[0].charAt(0)}${partes[1].charAt(0)}`.toUpperCase()
  }
  return auth.user.nombre.substring(0, 2).toUpperCase()
})

// Estadísticas
const estadisticas = ref({
  usuariosTotales: 1247,
  materiasActivas: 89,
  carrerasRegistradas: 12,
  gruposActivos: 245
})

// Acciones rápidas
const accionesRapidas = ref([
  {
    titulo: 'Gestionar usuarios',
    descripcion: 'Añadir, editar o eliminar usuarios del sistema',
    icono: '👥',
    ruta: '/admin/usuarios'
  },
  {
    titulo: 'Crear nueva materia',
    descripcion: 'Añadir una nueva materia al catálogo',
    icono: '📚',
    ruta: '/admin/materias'
  },
  {
    titulo: 'Gestionar carreras',
    descripcion: 'Administrar las carreras de la institución',
    icono: '🎓',
    ruta: '/admin/carreras'
  },
  {
    titulo: 'Ver inscripciones',
    descripcion: 'Revisar y gestionar inscripciones por grupo',
    icono: '📋',
    ruta: '/admin/inscripciones'
  }
])

// Últimos usuarios registrados
const ultimosUsuarios = ref([
  {
    nombre: 'María González',
    email: 'maria.g@unimal.edu',
    rol: 'ESTUDIANTE',
    iniciales: 'MG',
    colorBadge: 'bg-green-100 text-green-600',
    fechaRegistro: '15/11/2024',
    activo: true
  },
  {
    nombre: 'Dr. Carlos Ruiz',
    email: 'c.ruiz@unimal.edu',
    rol: 'PROFESOR',
    iniciales: 'CR',
    colorBadge: 'bg-purple-100 text-purple-600',
    fechaRegistro: '14/11/2024',
    activo: true
  },
  {
    nombre: 'Ana López',
    email: 'ana.l@unimal.edu',
    rol: 'ADMIN',
    iniciales: 'AL',
    colorBadge: 'bg-blue-100 text-blue-600',
    fechaRegistro: '13/11/2024',
    activo: true
  },
  {
    nombre: 'Javier Mendoza',
    email: 'j.mendoza@unimal.edu',
    rol: 'ESTUDIANTE',
    iniciales: 'JM',
    colorBadge: 'bg-green-100 text-green-600',
    fechaRegistro: '12/11/2024',
    activo: false
  },
  {
    nombre: 'Dra. Sofía Vargas',
    email: 's.vargas@unimal.edu',
    rol: 'PROFESOR',
    iniciales: 'SV',
    colorBadge: 'bg-purple-100 text-purple-600',
    fechaRegistro: '11/11/2024',
    activo: true
  }
])

// Distribución de roles
const distribucionRoles = ref([
  { nombre: 'Estudiantes', cantidad: 1050, porcentaje: 84, color: 'bg-green-500' },
  { nombre: 'Profesores', cantidad: 150, porcentaje: 12, color: 'bg-purple-500' },
  { nombre: 'Administradores', cantidad: 47, porcentaje: 4, color: 'bg-blue-500' }
])

// Actividad reciente
const actividadReciente = ref([
  {
    descripcion: 'Nuevo usuario registrado',
    usuario: 'María González',
    tiempo: 'Hace 2 horas',
    icono: '👤',
    colorFondo: 'bg-green-100 text-green-600'
  },
  {
    descripcion: 'Materia creada',
    usuario: 'Dr. Carlos Ruiz',
    tiempo: 'Hace 4 horas',
    icono: '📚',
    colorFondo: 'bg-blue-100 text-blue-600'
  },
  {
    descripcion: 'Inscripción masiva procesada',
    usuario: 'Sistema',
    tiempo: 'Hace 1 día',
    icono: '📋',
    colorFondo: 'bg-orange-100 text-orange-600'
  },
  {
    descripcion: 'Horario actualizado',
    usuario: 'Ana López',
    tiempo: 'Hace 1 día',
    icono: '🕐',
    colorFondo: 'bg-purple-100 text-purple-600'
  }
])

// Próximas tareas
const proximasTareas = ref([
  { descripcion: 'Revisar solicitudes de inscripción pendientes', hora: '10:00 AM' },
  { descripcion: 'Generar reporte de usuarios inactivos', hora: '11:30 AM' },
  { descripcion: 'Actualizar catálogo de materias', hora: '02:00 PM' },
  { descripcion: 'Reunión con coordinadores académicos', hora: '04:00 PM' }
])

// Enlaces útiles
const enlacesUtiles = ref([
  {
    titulo: 'Documentación del sistema',
    descripcion: 'Guías y manuales de usuario',
    icono: '📘',
    url: 'https://docs.planificaedu.com'
  },
  {
    titulo: 'Panel de soporte',
    descripcion: 'Abrir tickets de soporte técnico',
    icono: '🛠️',
    url: 'https://soporte.planificaedu.com'
  },
  {
    titulo: 'Analíticas de uso',
    descripcion: 'Estadísticas detalladas del sistema',
    icono: '📊',
    url: 'https://analytics.planificaedu.com'
  }
])
</script>