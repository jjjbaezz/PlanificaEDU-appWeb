<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const isOpen = ref(false)
const $route = useRoute()
const router = useRouter()
const auth = useAuthStore()

// Configuración de menú simple
const menuConfig = computed(() => {
  const role = auth.user?.rol || 'ESTUDIANTE'
  
  const items = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      path: role === 'ADMIN' ? '/dashboard/admin' : 
            role === 'PROFESOR' ? '/dashboard/profesor' : '/dashboard',
      icon: 'DashboardIcon.svg'
    },
    {
      id: 'usuarios',
      label: 'Usuarios',
      path: '/admin/usuarios',
      icon: 'UsuariosIcon.svg',
      show: role === 'ADMIN'
    },
    {
      id: 'asignaturas',
      label: 'Asignaturas',
      path: role === 'ADMIN' ? '/admin/asignaturas' : 
            role === 'PROFESOR' ? '/profesor/asignaturas' : '/asignaturas',
      icon: 'AsignaturasIcon.svg'
    },
    {
      id: 'carreras',
      label: 'Carreras',
      path: '/admin/carreras',
      icon: 'CarrerasIcon.svg',
      show: role === 'ADMIN'
    },
    {
      id: 'horarios',
      label: 'Horarios',
      path: '/admin/horarios',
      icon: 'HorariosIcon.svg',
      show: role === 'ADMIN'
    },
    {
      id: 'inscripciones',
      label: 'Inscripciones',
      path: '/admin/inscripciones',
      icon: 'InscripcionesIcon.svg',
      show: role === 'ADMIN'
    },
    {
      id: 'inscripcion',
      label: 'Inscripción',
      path: '/inscripcion',
      icon: 'InscripcionIcon.svg',
      show: role === 'ESTUDIANTE'
    }
  ]

  // Filtrar items según visibilidad
  return items.filter(item => item.show !== false)
})

const isDashboardActive = (itemPath: string): boolean => {
  return $route.path === itemPath || $route.path.startsWith(itemPath + '/')
}

const getIconPath = (iconName: string): string => {
  return new URL(`../assets/imgs/menuImgs/${iconName}`, import.meta.url).href
}

const handleLogout = (): void => {
  auth.logout()
  router.push('/login')
}
</script>

<template>
  <div class="flex h-screen">
    <!-- Sidebar -->
    <div
      :class="[
        'fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out md:static md:translate-x-0 flex flex-col',
        isOpen ? 'translate-x-0' : '-translate-x-full'
      ]"
    >
      <!-- Logo -->
      <div class="flex items-center justify-between p-6">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
            <img src="../assets/imgs/menuImgs/PlanificaEduIcon.svg" alt="">            
          </div>
          <span class="font-semibold text-gray-800">PlanificaEDU</span>
        </div>
        <button
          @click="isOpen = false"
          class="md:hidden text-gray-500 hover:text-gray-700"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <!-- Menu Items -->
      <nav class="flex-1 px-4 py-6 space-y-2">
        <RouterLink
          v-for="item in menuConfig"
          :key="item.id"
          :to="item.path"
          :class="[
            'flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors',
            isDashboardActive(item.path) ? 'bg-blue-100 text-blue-600' : ''
          ]"
        >
          <img 
            :src="getIconPath(item.icon)" 
            :alt="item.label"
            class="w-5 h-5"
          />
          <span class="font-medium">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="p-4 border-t border-gray-200 space-y-3">
        <RouterLink
          to="/configuracion"
          class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <img 
            src="../assets/imgs/menuImgs/ConfiguracionIcon.svg" 
            alt="Configuración"
            class="w-5 h-5"
          />
          <span class="font-medium">Configuración</span>
        </RouterLink>

        <button
          @click="handleLogout"
          class="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
        >
          <img 
            src="../assets/imgs/menuImgs/CerrarSesionIcon.svg" 
            alt="Cerrar sesión"
            class="w-5 h-5"
          />
          Cerrar sesión
        </button>
      </div>
    </div>

    <!-- Overlay para mobile -->
    <div
      v-if="isOpen"
      @click="isOpen = false"
      class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
    />

    <!-- Contenido principal -->
    <div class="flex-1 flex flex-col overflow-hidden">
      <div class="md:hidden bg-white border-b border-gray-200 p-4">
        <button
          @click="isOpen = true"
          class="text-gray-700 hover:text-gray-900"
        >
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      <main class="flex-1 overflow-auto bg-gray-50">
        <slot />
      </main>
    </div>
  </div>
</template>