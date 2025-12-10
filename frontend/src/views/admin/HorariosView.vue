<script setup>
import { ref } from 'vue'
import Sidebar from '../../components/Sidebar.vue'

const filtros = ref('')
const carreraFiltro = ref('todas')
const items = ref([
  {
    id: 1,
    asignatura: 'Cálculo Avanzado',
    profesor: 'Dr. Alan Turing',
    horario: 'Lunes, 10:00 - 12:00',
    carrera: 'Ingeniería de Software'
  },
  {
    id: 2,
    asignatura: 'Diseño de Interfaces',
    profesor: 'Dra. Ada Lovelace',
    horario: 'Martes, 09:00 - 11:00',
    carrera: 'Diseño Gráfico'
  },
  {
    id: 3,
    asignatura: 'Contabilidad I',
    profesor: 'Dr. Charles Babbage',
    horario: 'Miércoles, 14:00 - 16:00',
    carrera: 'Administración'
  },
  {
    id: 4,
    asignatura: 'Bases de Datos',
    profesor: 'Dr. Alan Turing',
    horario: 'Lunes, 14:00 - 16:00',
    carrera: 'Ingeniería de Software'
  },
  {
    id: 5,
    asignatura: 'Inteligencia Artificial',
    profesor: 'Dr. Alan Turing',
    horario: 'Lunes, 10:30 - 12:30',
    carrera: 'Ingeniería de Software',
    estado: 'conflicto'
  }
])
const loading = ref(false)
const showForm = ref(false)
const editing = ref(null)

const carreras = [
  'todas',
  'Ingeniería de Software',
  'Diseño Gráfico',
  'Administración'
]

function openCreate() { 
  editing.value = null
  showForm.value = true 
}

function openEdit(item) { 
  editing.value = item
  showForm.value = true 
}

function deleteHorario(id, asignatura) {
  if(confirm(`¿Eliminar horario de ${asignatura}?`)) {
    items.value = items.value.filter(h => h.id !== id)
  }
}

function handleSearch() {
  // Implement search logic
}
</script>

<template>
  <Sidebar>
    <div class="flex-1 flex flex-col bg-gray-50 min-h-screen">
      <!-- Header -->
      <div class="bg-white border-b border-gray-200 p-6">
        <h1 class="text-3xl font-bold text-gray-900">Gestión de Horarios</h1>
        <p class="text-gray-600 text-sm mt-1">Añade, edita y elimina los horarios de la institución.</p>
      </div>

      <!-- Content -->
      <div class="flex-1 p-6">
        <!-- Search and Filter Bar -->
        <div class="flex flex-col gap-4 mb-6">
          <div class="flex gap-3 items-center flex-wrap">
            <button class="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clip-rule="evenodd" />
              </svg>
              Filtrar
            </button>
            <input 
              v-model="filtros" 
              @input="handleSearch" 
              placeholder="Buscar por asignatura..." 
              class="flex-1 min-w-64 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-sky-400" 
            />
            <button 
              @click="openCreate" 
              class="bg-sky-500 hover:bg-sky-600 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clip-rule="evenodd" />
              </svg>
              Añadir Nuevo Horario
            </button>
          </div>

          <!-- Career Filter Tabs -->
          <div class="flex gap-2 flex-wrap">
            <button 
              v-for="carrera in carreras" 
              :key="carrera"
              @click="carreraFiltro = carrera"
              :class="[
                'px-4 py-2 rounded-full text-sm font-medium transition-colors',
                carreraFiltro === carrera 
                  ? 'bg-sky-400 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              ]"
            >
              {{ carrera === 'todas' ? 'Todas las Carreras' : carrera }}
            </button>
          </div>
        </div>

        <!-- Loading State -->
        <div v-if="loading" class="bg-white p-6 rounded-lg shadow">
          Cargando horarios...
        </div>

        <!-- Table -->
        <div v-else class="bg-white rounded-lg shadow overflow-hidden">
          <table class="w-full">
            <thead>
              <tr class="border-b border-gray-200">
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Asignatura</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Profesor</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Horario</th>
                <th class="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Carrera</th>
                <th class="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200">
              <tr 
                v-for="h in items" 
                :key="h.id" 
                class="hover:bg-gray-50 transition-colors"
                :class="h.estado === 'conflicto' ? 'bg-red-50' : ''"
              >
                <td class="px-6 py-4 text-gray-900 font-medium">{{ h.asignatura }}</td>
                <td class="px-6 py-4 text-gray-700">{{ h.profesor }}</td>
                <td class="px-6 py-4 text-gray-700">{{ h.horario }}</td>
                <td class="px-6 py-4 text-gray-700">{{ h.carrera }}</td>
                <td class="px-6 py-4 text-right">
                  <div class="flex items-center justify-end gap-2">
                    <button 
                      @click="openEdit(h)" 
                      class="p-2 text-sky-600 hover:bg-sky-50 rounded-lg transition-colors" 
                      title="Editar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                      </svg>
                    </button>
                    <button 
                      @click="deleteHorario(h.id, h.asignatura)" 
                      class="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors" 
                      title="Eliminar"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<style scoped>
@media (max-width: 768px) {
  :deep(table) {
    font-size: 0.875rem;
  }
}
</style>
