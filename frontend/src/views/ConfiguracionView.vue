<template>
  <Sidebar>
    <div class="p-6 md:p-8 max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-8 text-center">
      <h1 class="text-3xl font-bold text-gray-900">Configuración</h1>
      <p class="text-gray-600 mt-2">Gestiona la información de tu perfil y la configuración de tu cuenta.</p>
    </div>

    <!-- Main Grid -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- LEFT COLUMN -->
      <!-- Perfil Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Perfil</h2>
        
        <!-- Profile Picture -->
        <div class="mb-6">
          <div class="flex flex-col items-center">
            <img 
              src="/placeholder.svg?height=100&width=100" 
              alt="Foto de perfil" 
              class="w-24 h-24 rounded-full object-cover border-4 border-gray-200 mb-3"
            />
            <a href="#" class="text-blue-500 hover:text-blue-700 text-sm font-medium">
              Cambiar foto
            </a>
            <p class="text-xs text-gray-500 mt-1">JPG, GIF o PNG. 1MB max.</p>
          </div>
        </div>

        <!-- Form Fields -->
        <div class="space-y-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
              <input 
                type="text" 
                placeholder="Ana" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-700 mb-1">Apellido</label>
              <input 
                type="text" 
                placeholder="Pérez" 
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
            <input 
              type="email" 
              placeholder="ana.perez@universidad.edu" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button class="w-full mt-6 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium">
          Guardar Cambios
        </button>
      </div>

      <!-- Cambiar Horario Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-2">Cambiar tu horario</h2>
        <p class="text-gray-600 text-sm mb-6">Ingresa tus preferencias de horario</p>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Turno Preferido</label>
            <select class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent">
              <option>Mañana / Tarde / Noche</option>
              <option>Mañana</option>
              <option>Tarde</option>
              <option>Noche</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-3">Días</label>
            <div class="grid grid-cols-2 gap-3">
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500">
                <span class="text-sm text-gray-700">Lunes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500">
                <span class="text-sm text-gray-700">Martes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500">
                <span class="text-sm text-gray-700">Miércoles</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500">
                <span class="text-sm text-gray-700">Jueves</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500">
                <span class="text-sm text-gray-700">Viernes</span>
              </label>
              <label class="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-2 focus:ring-blue-500">
                <span class="text-sm text-gray-700">Sábado</span>
              </label>
            </div>
          </div>
        </div>

        <button class="w-full mt-6 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium">
          Guardar Cambios
        </button>
      </div>

      <!-- RIGHT COLUMN -->
      <!-- Seguridad Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-6">Seguridad</h2>

        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Contraseña Actual</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Nueva Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Confirmar Nueva Contraseña</label>
            <input 
              type="password" 
              placeholder="••••••••" 
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <button class="w-full mt-6 px-6 py-3 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors font-medium">
          Actualizar Contraseña
        </button>
      </div>

      <!-- Cuenta Card -->
      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-bold text-gray-900 mb-2">Cuenta</h2>
        <p class="text-gray-600 text-sm mb-6">Finaliza tu sesión actual en este dispositivo.</p>

        <div class="border-t border-gray-200 pt-6">
          <button class="px-6 py-3 border-2 border-red-500 text-red-500 rounded-full hover:bg-red-50 transition-colors font-medium flex items-center gap-2 justify-center w-full">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  </div>
  </Sidebar>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
</script>