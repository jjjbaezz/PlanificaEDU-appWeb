<template>
  <Sidebar>
    <div class="p-6 md:p-8 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-8">
        <h1 class="text-3xl font-bold text-gray-900">Editar Información de Alejandro Vera</h1>
        <p class="text-gray-600 mt-2">Actualiza los datos y preferencias del profesor.</p>
      </div>

      <!-- Main Form -->
      <div class="bg-white rounded-lg shadow p-6 md:p-8">
        <!-- Nombre y Apellido -->
        <div class="grid md:grid-cols-2 gap-6 mb-8">
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">Nombre</label>
            <input
              v-model="profesor.nombre"
              type="text"
              placeholder="Introduce el nombre"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-semibold text-gray-900 mb-2">Apellido</label>
            <input
              v-model="profesor.apellido"
              type="text"
              placeholder="Introduce el apellido"
              class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Carrera -->
        <div class="mb-8">
          <label class="block text-sm font-semibold text-gray-900 mb-2">Carrera</label>
          <select
            v-model="profesor.carrera"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Selecciona una carrera</option>
            <option value="Ingenieria de Software">Ingeniería de Software</option>
            <option value="Diseño Grafico">Diseño Gráfico</option>
            <option value="Administracion">Administración</option>
          </select>
        </div>

        <!-- Materias -->
        <div class="mb-8">
          <label class="block text-sm font-semibold text-gray-900 mb-2">Materias</label>
          <select
            v-model="profesor.materias"
            class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"
          >
            <option value="">Selecciona materias</option>
            <option value="Programacion I, Programacion II, Programacion III">Programación I, Programación II, Programación III</option>
            <option value="Diseño Web, Diseño Grafico">Diseño Web, Diseño Gráfico</option>
            <option value="Contabilidad, Finanzas">Contabilidad, Finanzas</option>
          </select>
        </div>

        <!-- Estado de la Cuenta -->
        <div class="mb-8 pb-8 border-b border-gray-200">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Estado de la Cuenta</h3>
          <div class="flex items-center justify-between">
            <span class="text-gray-700 font-medium">Estado del Usuario</span>
            <div class="flex items-center gap-3">
              <span :class="['text-sm font-medium', profesor.activo ? 'text-gray-500' : 'text-red-600']">
                Inactivo
              </span>
              <button
                @click="profesor.activo = !profesor.activo"
                :class="[
                  'relative inline-flex items-center h-8 w-14 rounded-full transition-colors',
                  profesor.activo ? 'bg-blue-500' : 'bg-gray-300'
                ]"
              >
                <span
                  :class="[
                    'inline-block h-7 w-7 transform rounded-full bg-white transition-transform',
                    profesor.activo ? 'translate-x-7' : 'translate-x-0'
                  ]"
                />
              </button>
              <span :class="['text-sm font-medium', profesor.activo ? 'text-blue-600' : 'text-gray-500']">
                Activo
              </span>
            </div>
          </div>
        </div>

        <!-- Preferencias de Horario -->
        <div>
          <h3 class="text-lg font-semibold text-gray-900 mb-2">Preferencias de Horario</h3>
          <p class="text-gray-600 text-sm mb-6">Selecciona los bloques horarios en los que prefieres dar clases.</p>

          <!-- Horarios Table -->
          <div class="overflow-x-auto mb-8">
            <table class="w-full text-sm">
              <thead>
                <tr>
                  <th class="text-left font-medium text-gray-700 pb-4"></th>
                  <th class="text-center font-medium text-gray-700 pb-4 px-2">8-10pm</th>
                  <th class="text-center font-medium text-gray-700 pb-4 px-2">6-8pm</th>
                  <th class="text-center font-medium text-gray-700 pb-4 px-2">4-6pm</th>
                  <th class="text-center font-medium text-gray-700 pb-4 px-2">2-4pm</th>
                  <th class="text-center font-medium text-gray-700 pb-4 px-2">12-2pm</th>
                  <th class="text-center font-medium text-gray-700 pb-4 px-2">10-12am</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="dia in dias" :key="dia" class="border-b border-gray-200">
                  <td class="text-left font-medium text-gray-700 py-4">{{ dia }}</td>
                  <td v-for="hora in horarios" :key="hora" class="text-center py-4 px-2">
                    <button
                      @click="toggleHorario(dia, hora)"
                      :class="[
                        'w-8 h-8 rounded-full transition-colors flex items-center justify-center mx-auto',
                        esSeleccionado(dia, hora)
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-400'
                      ]"
                    >
                      <svg v-if="esSeleccionado(dia, hora)" class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd" />
                      </svg>
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Botones de Acción -->
        <div class="flex gap-4 justify-end pt-6 border-t border-gray-200">
          <button
            @click="cancelar"
            class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Cancelar
          </button>
          <button
            @click="guardarCambios"
            class="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium flex items-center gap-2"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            Guardar Cambios
          </button>
        </div>
      </div>
    </div>
  </Sidebar>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '../components/Sidebar.vue'

const profesor = ref({
  nombre: 'Alejandro',
  apellido: 'Vera',
  carrera: 'Ingenieria de Software',
  materias: 'Programacion I, Programacion II, Programacion III',
  activo: true
})

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const horarios = ['8-10pm', '6-8pm', '4-6pm', '2-4pm', '12-2pm', '10-12am']

const horariosSeleccionados = ref({
  'Lunes': ['4-6pm', '10-12am'],
  'Martes': ['2-4pm'],
  'Miércoles': ['4-6pm', '2-4pm'],
  'Jueves': ['2-4pm', '10-12am'],
  'Viernes': ['12-2pm', '10-12am'],
  'Sábado': []
})

const toggleHorario = (dia, hora) => {
  if (!horariosSeleccionados.value[dia]) {
    horariosSeleccionados.value[dia] = []
  }
  const index = horariosSeleccionados.value[dia].indexOf(hora)
  if (index > -1) {
    horariosSeleccionados.value[dia].splice(index, 1)
  } else {
    horariosSeleccionados.value[dia].push(hora)
  }
}

const esSeleccionado = (dia, hora) => {
  return horariosSeleccionados.value[dia] && horariosSeleccionados.value[dia].includes(hora)
}

const guardarCambios = () => {
  console.log('Guardando cambios...', {
    profesor: profesor.value,
    horarios: horariosSeleccionados.value
  })
}

const cancelar = () => {
  console.log('Cancelando cambios')
}
</script>
