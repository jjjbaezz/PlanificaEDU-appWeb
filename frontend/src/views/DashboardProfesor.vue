<template>
    <Sidebar>
      <!-- Header -->
      <header class="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
          <div>
            <h1 class="text-3xl font-bold text-gray-900">Dashboard</h1>
          </div>
          <div class="flex items-center gap-4">
            <button class="p-2 hover:bg-gray-100 rounded-lg transition-colors">
              <svg class="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
            </button>
            <div class="w-10 h-10 bg-purple-200 rounded-full flex items-center justify-center font-bold text-purple-700 text-sm">
              NP
            </div>
            <div>
            <p class="text-sm font-bold text-gray-900">{{ nombre }}</p>
            <p class="text-gray-500 text-sm mt-1">Profesor</p>
          </div>
          </div>
        </div>
      </header>
  
      <!-- Main Content -->
      <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
        <!-- Stats Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
          <StatCard 
            label="Grupos asignados" 
            :value="4" 
          />
          <StatCard 
            label="Periodo actual" 
            :value="'Otoño 2024'" 
          />
          <StatCard 
            label="Horas semanales totales" 
            :value="18" 
          />
        </div>
  
        <!-- Main Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5 mb-8">
          <!-- Mis Grupos Table -->
          <div class="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Mis grupos</h3>
            
            <div class="overflow-x-auto">
              <table class="w-full text-sm">
                <thead>
                  <tr class="border-b border-gray-200">
                    <th class="text-left py-3 px-2 font-semibold text-gray-700 text-xs uppercase">Materia</th>
                    <th class="text-left py-3 px-2 font-semibold text-gray-700 text-xs uppercase">Sección</th>
                    <th class="text-left py-3 px-2 font-semibold text-gray-700 text-xs uppercase">Aula</th>
                    <th class="text-left py-3 px-2 font-semibold text-gray-700 text-xs uppercase">Horario</th>
                    <th class="text-left py-3 px-2 font-semibold text-gray-700 text-xs uppercase">Alumnos</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="(grupo, idx) in grupos" :key="idx" class="border-b border-gray-100 hover:bg-gray-50">
                    <td class="py-4 px-2 text-gray-900">{{ grupo.materia }}</td>
                    <td class="py-4 px-2 text-gray-700">{{ grupo.seccion }}</td>
                    <td class="py-4 px-2 text-gray-700">{{ grupo.aula }}</td>
                    <td class="py-4 px-2 text-gray-700">{{ grupo.horario }}</td>
                    <td class="py-4 px-2 text-gray-700">{{ grupo.alumnos }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
  
          <!-- Mis Notificaciones -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Mis notificaciones</h3>
            
            <div class="space-y-3">
              <div v-for="(notif, idx) in notificaciones" :key="idx" class="flex gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
                <span class="text-xl flex-shrink-0">{{ notif.icono }}</span>
                <div class="flex-1 min-w-0">
                  <p class="font-semibold text-sm text-gray-900">{{ notif.titulo }}</p>
                  <p class="text-xs text-gray-600 mt-1">{{ notif.mensaje }}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
  
        <!-- Mi Disponibilidad Calendar -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-bold text-gray-900 mb-4">Mi disponibilidad</h3>
          
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th class="py-3 px-3 font-semibold text-gray-700 text-xs uppercase w-16">Hora</th>
                  <th v-for="dia in dias" :key="dia" class="py-3 px-2 font-semibold text-gray-700 text-xs uppercase text-center">{{ dia }}</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="hora in horas" :key="hora" class="border-t border-gray-200">
                  <td class="py-3 px-3 text-gray-700 font-medium text-xs">{{ hora }}</td>
                  <td v-for="dia in dias" :key="`${hora}-${dia}`" class="py-3 px-2 text-center">
                    <div 
                      class="h-12 rounded transition-colors"
                      :class="getDisponibilidad(hora, dia)"
                    ></div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
  
          <div class="flex gap-6 mt-4 justify-center text-sm">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-green-400 rounded"></div>
              <span class="text-gray-700">Disponible</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 bg-red-300 rounded"></div>
              <span class="text-gray-700">No disponible</span>
            </div>
          </div>
        </div>
      </main>
    </Sidebar>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  import Sidebar from '../components/Sidebar.vue'
  import StatCard from '../components/StatCard.vue'
  
  const nombre = ref('Nombre Profesor')
  
  const grupos = ref([
    { materia: 'Ingeniería de Software', seccion: 'S-701', aula: 'A-502', horario: 'Lun, Mié 10-12', alumnos: 32 },
    { materia: 'Sistemas de Bases de Datos', seccion: 'S-702', aula: 'B-105', horario: 'Mar, Jue 14-16', alumnos: 28 },
    { materia: 'Desarrollo Web', seccion: 'S-503', aula: 'C-Lab', horario: 'Vie 09-12', alumnos: 25 },
    { materia: 'Inteligencia Artificial', seccion: 'S-901', aula: 'A-301', horario: 'Lun, Mié 14-16', alumnos: 19 },
  ])
  
  const notificaciones = ref([
    { titulo: 'Nuevo estudiante inscrito en Ingeniería de Software', mensaje: 'Hace 2 horas', icono: '👤' },
    { titulo: 'Solicitud de cambio de horario para Sistemas de Bases de Datos', mensaje: 'Hace 1 día', icono: '📋' },
    { titulo: 'Anuncio de mantenimiento del sistema', mensaje: 'Hace 3 días', icono: '🔧' },
    { titulo: 'Las calificaciones finales de "Intro a C$" han sido enviadas', mensaje: 'Hace 5 días', icono: '✅' },
  ])
  
  const dias = ref(['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'])
  const horas = ref(['08:00', '10:00', '12:00', '14:00'])
  
  const disponibilidadMatrix = {
    '08:00': { 'Lun': 'no', 'Mar': 'no', 'Mié': 'no', 'Jue': 'sí', 'Vie': 'sí', 'Sáb': 'no', 'Dom': 'no' },
    '10:00': { 'Lun': 'sí', 'Mar': 'no', 'Mié': 'sí', 'Jue': 'no', 'Vie': 'no', 'Sáb': 'no', 'Dom': 'no' },
    '12:00': { 'Lun': 'no', 'Mar': 'sí', 'Mié': 'no', 'Jue': 'sí', 'Vie': 'no', 'Sáb': 'no', 'Dom': 'no' },
    '14:00': { 'Lun': 'no', 'Mar': 'no', 'Mié': 'no', 'Jue': 'sí', 'Vie': 'sí', 'Sáb': 'no', 'Dom': 'no' },
  }
  
  const getDisponibilidad = (hora, dia) => {
    const disponible = disponibilidadMatrix[hora]?.[dia] === 'sí'
    return disponible ? 'bg-green-400' : 'bg-red-300'
  }
  </script>
  