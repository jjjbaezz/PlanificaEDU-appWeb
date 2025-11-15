<template>
    <Sidebar>
        <!-- Header -->
    <header class="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div>
        </div>
        <div class="flex items-center gap-4">
          <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
            <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </button>
          <div class="w-10 h-10 bg-orange-200 rounded-full flex items-center justify-center font-bold text-orange-700 text-sm">
            AM
          </div>
          <div>
            <p class="text-sm font-bold text-gray-900">{{ nombre }}</p>
            <p class="text-gray-500 text-sm mt-1">{{ role }}</p>
          </div>
        </div>
      </div>
    </header>
    <div class="p-6 md:p-8 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Gestión de Asignaturas</h1>
        <p class="text-gray-600 mt-2">Añade, edita o elimina asignaturas del sistema.</p>
      </div>
  
      <!-- Search and Add Button -->
      <div class="flex flex-col md:flex-row gap-4 mb-6">
        <div class="flex-1 relative">
          <svg class="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Buscar por nombre, apellido o email..."
            class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <button class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2 whitespace-nowrap">
          <span>+</span>
          Añadir Asignatura
        </button>
      </div>
  
      <!-- Table -->
      <div class="bg-white rounded-lg shadow overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 border-b border-gray-200">
              <tr>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Nombre de Asignatura</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Duración (Horas)</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Cupos Máximos</th>
                <th class="px-6 py-4 text-left text-sm font-semibold text-gray-700">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr v-for="asignatura in asignaturas" :key="asignatura.id" class="hover:bg-gray-50 transition-colors">
                <td class="px-6 py-4 text-gray-900 font-medium">{{ asignatura.nombre }}</td>
                <td class="px-6 py-4 text-gray-700">{{ asignatura.duracion }}</td>
                <td class="px-6 py-4 text-gray-700">{{ asignatura.cupos }}</td>
                <td class="px-6 py-4">
                  <div class="flex gap-3">
                    <button class="text-blue-500 hover:text-blue-700 transition-colors" title="Editar">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button class="text-red-500 hover:text-red-700 transition-colors" title="Eliminar">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
  
      <!-- Pagination -->
      <div class="mt-8 flex items-center justify-center gap-2">
        <button class="px-3 py-2 text-gray-600 hover:bg-gray-200 rounded transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        
        <button 
          v-for="page in 10" 
          :key="page"
          :class="[
            'px-3 py-2 rounded font-medium transition-colors',
            page === currentPage 
              ? 'bg-blue-500 text-white' 
              : 'text-gray-700 hover:bg-gray-200'
          ]"
          @click="currentPage = page"
        >
          {{ page }}
        </button>
  
        <span v-if="false" class="px-3 py-2 text-gray-500">...</span>
        
        <button class="px-3 py-2 text-gray-600 hover:bg-gray-200 rounded transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
</Sidebar>
  </template>
  
  <script setup>
  import { ref } from 'vue'
    import Sidebar from '../components/Sidebar.vue'
  const searchQuery = ref('')
  const currentPage = ref(1)
  
  const asignaturas = ref([
    {
      id: 1,
      nombre: 'Cálculo Diferencial',
      duracion: '4h',
      cupos: 40
    },
    {
      id: 2,
      nombre: 'Programación Orientada a Objetos',
      duracion: '3h',
      cupos: 35
    },
    {
      id: 3,
      nombre: 'Bases de Datos',
      duracion: '3h',
      cupos: 35
    },
    {
      id: 4,
      nombre: 'Física Mecánica',
      duracion: '4h',
      cupos: 50
    }
  ])

  const nombre = ref('Alejandro Mora')
  const role = ref('ADMIN')

  </script>  