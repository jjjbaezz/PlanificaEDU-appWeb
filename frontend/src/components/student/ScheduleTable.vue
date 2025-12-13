<template>
  <div class="overflow-x-auto">
    <!-- Si no hay horarios -->
    <div v-if="!schedule || !schedule.horario_detalle || schedule.horario_detalle.length === 0" 
         class="text-center py-8 text-gray-500">
      No hay clases asignadas en este horario.
    </div>

    <!-- Tabla de horario -->
    <table v-else class="min-w-full divide-y divide-gray-200">
      <thead class="bg-gray-50">
        <tr>
          <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            Hora
          </th>
          <th v-for="dia in diasSemana" :key="dia" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
            {{ dia }}
          </th>
        </tr>
      </thead>
      <tbody class="bg-white divide-y divide-gray-200">
        <!-- Para cada bloque horario -->
        <tr v-for="bloque in bloquesHorarios" :key="bloque.id">
          <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
            {{ formatHora(bloque.hora_inicio) }} - {{ formatHora(bloque.hora_fin) }}
          </td>
          <!-- Para cada día de la semana -->
          <td v-for="dia in diasSemana" :key="dia" class="px-6 py-4">
            <!-- Buscar si hay clase en este día y bloque -->
            <div v-for="clase in getClasesPorDiaYBloque(dia, bloque.id)" :key="clase.id" 
                 class="mb-2 p-3 rounded-lg border-l-4" 
                 :class="getColorClase(clase)">
              <p class="font-medium text-gray-900">{{ clase.materia.codigo }}</p>
              <p class="text-sm text-gray-600">{{ clase.materia.nombre }}</p>
              <p class="text-xs text-gray-500">Sección: {{ clase.seccion }}</p>
              <p class="text-xs text-gray-500">Prof: {{ clase.profesor.nombre }}</p>
              <p class="text-xs text-gray-500">Aula: {{ clase.aula?.codigo || 'Por asignar' }}</p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'

const props = defineProps({
  schedule: {
    type: Object,
    required: true
  }
})

// Días de la semana (puedes ajustar según tu enum)
const diasSemana = ref(['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB'])

// Bloques horarios (podrían venir de la base de datos, aquí un ejemplo estático)
const bloquesHorarios = ref([
  { id: '1', hora_inicio: '07:00', hora_fin: '08:30' },
  { id: '2', hora_inicio: '08:30', hora_fin: '10:00' },
  { id: '3', hora_inicio: '10:00', hora_fin: '11:30' },
  { id: '4', hora_inicio: '11:30', hora_fin: '13:00' },
  { id: '5', hora_inicio: '13:00', hora_fin: '14:30' },
  { id: '6', hora_inicio: '14:30', hora_fin: '16:00' },
  { id: '7', hora_inicio: '16:00', hora_fin: '17:30' },
  { id: '8', hora_inicio: '17:30', hora_fin: '19:00' },
  { id: '9', hora_inicio: '19:00', hora_fin: '20:30' }
])

// Formatear hora
const formatHora = (horaString) => {
  if (!horaString) return ''
  const hora = new Date(horaString)
  return hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// Obtener clases por día y bloque
const getClasesPorDiaYBloque = (dia, bloqueId) => {
  if (!props.schedule.horario_detalle) return []
  return props.schedule.horario_detalle.filter(detalle => {
    return detalle.bloques_horarios.dia === dia && detalle.bloques_horarios.id === bloqueId
  }).map(detalle => ({
    id: detalle.id,
    materia: detalle.grupos.materias,
    seccion: detalle.grupos.seccion,
    profesor: detalle.grupos.usuarios,
    aula: detalle.aulas
  }))
}

// Colores para las clases (puedes ajustar)
const getColorClase = (clase) => {
  const colors = [
    'border-blue-400 bg-blue-50',
    'border-green-400 bg-green-50',
    'border-yellow-400 bg-yellow-50',
    'border-purple-400 bg-purple-50',
    'border-pink-400 bg-pink-50',
    'border-indigo-400 bg-indigo-50'
  ]
  // Usar un hash simple basado en el código de la materia para asignar color
  const index = clase.materia.codigo.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
  return colors[index]
}

// Si los bloques horarios no vienen en el schedule, podrías cargarlos de la base de datos
// Por simplicidad, aquí se usa un array estático
</script>