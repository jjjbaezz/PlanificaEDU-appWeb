<!-- src/views/student/StudentSchedules.vue -->
<template>
  <Sidebar>
    <!-- Header -->
    <header class="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Mis Horarios Generados</h1>
          <p class="text-gray-600 mt-1" v-if="periodoActual">
            Periodo: {{ periodoActual.nombre }} • {{ currentSchedule ? currentSchedule.horario_detalle?.length || 0 : 0 }} clases asignadas
          </p>
        </div>
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm">
            {{ auth.user?.nombre?.charAt(0) || 'E' }}
          </div>
          <div>
            <p class="text-sm font-bold text-gray-900">{{ auth.user?.nombre || 'Estudiante' }}</p>
            <p class="text-gray-500 text-sm mt-1">ESTUDIANTE</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Steps Indicator -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-center mb-8">
        <div class="flex items-center">
          <!-- Step 1 -->
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg border-2 bg-gray-100 text-gray-400 border-gray-300">
              1
            </div>
            <div class="ml-3">
              <p class="font-medium text-gray-900">Selección</p>
              <p class="text-sm text-gray-500">Elige tus materias</p>
            </div>
          </div>
          
          <!-- Connector -->
          <div class="h-0.5 w-16 bg-gray-300 mx-4"></div>
          
          <!-- Step 2 -->
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg border-2 bg-gray-100 text-gray-400 border-gray-300">
              2
            </div>
            <div class="ml-3">
              <p class="font-medium text-gray-900">Confirmación</p>
              <p class="text-sm text-gray-500">Revisa y genera horario</p>
            </div>
          </div>

          <!-- Connector -->
          <div class="h-0.5 w-16 bg-gray-300 mx-4"></div>

          <!-- Step 3 -->
          <div class="flex items-center">
            <div class="w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg border-2 bg-blue-500 text-white border-blue-500">
              3
            </div>
            <div class="ml-3">
              <p class="font-medium text-gray-900">Horario</p>
              <p class="text-sm text-gray-500">Visualiza y confirma</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-12">
      <!-- Error Message -->
      <div v-if="error" class="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <p class="text-red-800">{{ error }}</p>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
        <p class="mt-4 text-gray-600">Cargando horarios...</p>
      </div>

      <!-- Contenido principal -->
      <div v-else>
        <!-- Estadísticas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          <div class="bg-blue-50 border border-blue-100 rounded-2xl p-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-600">Clases totales</p>
                <p class="text-2xl font-bold text-blue-700">
                  {{ currentSchedule ? currentSchedule.horario_detalle?.length || 0 : 0 }}
                </p>
              </div>
            </div>
          </div>

          <div class="bg-green-50 border border-green-100 rounded-2xl p-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-600">Puntuación</p>
                <p class="text-2xl font-bold text-green-700">
                   {{ formatScore(currentSchedule?.score) }}/100
                </p>
              </div>
            </div>
          </div>

          <div class="bg-purple-50 border border-purple-100 rounded-2xl p-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-600">Días con clases</p>
                <p class="text-2xl font-bold text-purple-700">{{ diasConClases }}</p>
              </div>
            </div>
          </div>

          <div class="bg-orange-50 border border-orange-100 rounded-2xl p-6">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p class="text-sm text-gray-600">Créditos totales</p>
                <p class="text-2xl font-bold text-orange-700">{{ totalCreditos }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- Horario actual -->
        <div v-if="currentSchedule" class="mb-8">
          <div class="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            <!-- Header del horario -->
            <div class="border-b border-gray-200 p-6">
              <div class="flex justify-between items-center">
                <div>
                  <h2 class="text-xl font-bold text-gray-900">Horario Generado</h2>
                  <p class="text-gray-600 mt-1">
                    Generado el {{ formatFecha(currentSchedule.created_at) }}
                  </p>
                </div>
                <div class="flex gap-3">
                  <button
                    @click="modifySchedule"
                    class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modificar
                  </button>
                  <button
                    @click="confirmEnrollment"
                    class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-lg transition flex items-center gap-2"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Confirmar e Inscribir
                  </button>
                </div>
              </div>
            </div>

            <!-- Tabla de horario -->
            <div class="overflow-x-auto">
              <table class="min-w-full divide-y divide-gray-200">
                <thead class="bg-gray-50">
                  <tr>
                    <th class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Hora
                    </th>
                    <th 
                      v-for="dia in diasSemana" 
                      :key="dia"
                      class="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {{ getNombreDia(dia) }}
                    </th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="bloque in bloquesHorarios" :key="bloque.id">
                    <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ formatHora(bloque.hora_inicio) }} - {{ formatHora(bloque.hora_fin) }}
                    </td>
                    <td 
                      v-for="dia in diasSemana" 
                      :key="dia"
                      class="px-6 py-4"
                    >
                      <div v-if="getClasePorBloqueYDia(bloque.id, dia)" class="space-y-2">
                        <div 
                          v-for="clase in getClasePorBloqueYDia(bloque.id, dia)" 
                          :key="clase.id"
                          class="p-3 rounded-lg border-l-4"
                          :class="getColorClase(clase)"
                        >
                          <div class="flex justify-between items-start">
                            <div>
                              <p class="font-semibold text-gray-900 text-sm">
                                {{ clase.materia?.codigo || 'N/A' }}
                              </p>
                              <p class="text-xs text-gray-600 mt-1">
                                {{ clase.materia?.nombre || 'Sin nombre' }}
                              </p>
                            </div>
                            <span class="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
                              {{ clase.grupo?.seccion || 'N/A' }}
                            </span>
                          </div>
                          
                          <div class="mt-2 space-y-1">
                            <p class="text-xs text-gray-500">
                              <span class="font-medium">Prof:</span> {{ clase.grupo?.profesor?.nombre || 'No asignado' }}
                            </p>
                            <p class="text-xs text-gray-500">
                              <span class="font-medium">Aula:</span> {{ clase.aula?.codigo || 'Por asignar' }}
                            </p>
                            <p class="text-xs text-gray-500">
                              <span class="font-medium">Créditos:</span> {{ clase.materia?.creditos || 0 }}
                            </p>
                          </div>

                          <div class="mt-2 flex justify-between items-center">
                            <span class="text-xs px-2 py-1 rounded-full"
                                  :class="getBadgeCupo(clase.grupo)">
                              {{ getTextoBadgeCupo(clase.grupo) }}
                            </span>
                            <button
                              v-if="!clase.inscrito"
                              @click="inscribirEnClase(clase)"
                              class="text-xs text-blue-600 hover:text-blue-800 font-medium"
                            >
                              Inscribir
                            </button>
                            <span v-else class="text-xs text-green-600 font-medium">
                              ✓ Inscrito
                            </span>
                          </div>
                        </div>
                      </div>
                      <div v-else class="text-center py-4">
                        <span class="text-xs text-gray-400">—</span>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <!-- Resumen del horario -->
            <div class="border-t border-gray-200 p-6 bg-gray-50">
              <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div class="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 class="font-medium text-gray-900 mb-2">Resumen de materias</h4>
                  <div class="space-y-2">
                    <div 
                      v-for="materia in materiasUnicas" 
                      :key="materia.id"
                      class="flex justify-between items-center py-2 border-b border-gray-100 last:border-0"
                    >
                      <span class="text-sm text-gray-700">{{ materia.codigo }}</span>
                      <span class="text-xs font-medium px-2 py-1 rounded-full bg-gray-100 text-gray-800">
                        {{ materia.creditos }} créditos
                      </span>
                    </div>
                  </div>
                </div>

                <div class="p-4 bg-white rounded-lg border border-gray-200">
                  <h4 class="font-medium text-gray-900 mb-2">Distribución por día</h4>
                  <div class="space-y-2">
                    <div 
                      v-for="(count, dia) in distribucionPorDia" 
                      :key="dia"
                      class="flex justify-between items-center"
                    >
                      <span class="text-sm text-gray-700">{{ getNombreDia(dia) }}</span>
                      <span class="text-xs font-medium text-gray-500">{{ count }} clases</span>
                    </div>
                  </div>
                </div>

                <div class="p-4 bg-blue-50 rounded-lg border border-blue-100">
                  <h4 class="font-medium text-blue-900 mb-2">Detalles del horario</h4>
                  <div class="space-y-2">
                    <p class="text-sm text-blue-800">
                      <span class="font-medium">Puntuación:</span> {{ formatScore(currentSchedule?.score, 2) }}
                    </p>
                    <p class="text-sm text-blue-800">
                      <span class="font-medium">Total créditos:</span> {{ totalCreditos }}
                    </p>
                    <p class="text-sm text-blue-800">
                      <span class="font-medium">Clases por semana:</span> {{ currentSchedule.horario_detalle?.length || 0 }}
                    </p>
                    <p class="text-sm text-blue-800">
                      <span class="font-medium">Estado:</span> 
                      <span :class="getEstadoColor(currentSchedule.estado)">
                        {{ getEstadoTexto(currentSchedule.estado) }}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Mensaje si no hay horario actual -->
        <div v-else class="mb-8">
          <div class="bg-white rounded-2xl shadow border border-gray-200 p-8 text-center">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-lg font-medium text-gray-900 mb-2">No hay horario actual</h3>
            <p class="text-gray-600 mb-6">Genera un horario desde la selección de materias.</p>
            <button
              @click="goToSelection"
              class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition inline-flex items-center gap-2"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Ir a selección de materias
            </button>
          </div>
        </div>

        <!-- Historial de horarios -->
        <div v-if="otherSchedules.length > 0">
          <div class="flex justify-between items-center mb-4">
            <h3 class="text-lg font-semibold text-gray-900">Historial de Horarios</h3>
            <!-- <span class="text-sm text-gray-500">  {{ formatScore(schedule.score) }} horarios anteriores</span> -->
          </div>
          
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div
              v-for="schedule in otherSchedules"
              :key="schedule.id"
              class="bg-white rounded-xl shadow border border-gray-200 p-4 hover:shadow-md transition hover:border-blue-200"
            >
              <div class="flex justify-between items-start mb-3">
                <div>
                  <p class="font-medium text-gray-900">
                    {{ formatFecha(schedule.created_at) }}
                  </p>
                  <p class="text-sm text-gray-600 mt-1">
                    {{ schedule.horario_detalle?.length || 0 }} clases
                  </p>
                </div>
                <span class="px-2 py-1 rounded text-xs font-medium"
                      :class="getScoreColor(schedule.score)">
                  {{ (schedule.score || 0).toFixed(1) }}
                </span>
              </div>
              
              <div class="mb-3">
                <div class="flex items-center justify-between text-sm">
                  <span class="text-gray-600">Créditos:</span>
                  <span class="font-medium text-gray-900">
                    {{ calcularCreditosHorario(schedule) }}
                  </span>
                </div>
                <div class="flex items-center justify-between text-sm mt-1">
                  <span class="text-gray-600">Estado:</span>
                  <span :class="getEstadoColor(schedule.estado, true)">
                    {{ getEstadoTexto(schedule.estado) }}
                  </span>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  @click="loadSchedule(schedule.id)"
                  class="flex-1 px-3 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition text-sm font-medium"
                >
                  Ver horario
                </button>
                <button
                  @click="duplicateSchedule(schedule.id)"
                  class="px-3 py-2 border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition text-sm font-medium"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  </Sidebar>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import Sidebar from '../components/Sidebar.vue';
import http from '../services/http';

const auth = useAuthStore();
const route = useRoute();
const router = useRouter();

// Estados
const currentSchedule = ref(null);
const otherSchedules = ref([]);
const periodoActual = ref(null);
const loading = ref(false);
const error = ref(null);

// Configuración
const diasSemana = ref(['LUN', 'MAR', 'MIE', 'JUE', 'VIE', 'SAB']);
const bloquesHorarios = ref([]);

// Computed properties
const diasConClases = computed(() => {
  if (!currentSchedule.value?.horario_detalle) return 0;
  
  const diasSet = new Set();
  currentSchedule.value.horario_detalle.forEach(detalle => {
    if (detalle.bloques_horarios?.dia) {
      diasSet.add(detalle.bloques_horarios.dia);
    }
  });
  
  return diasSet.size;
});

const totalCreditos = computed(() => {
  if (!currentSchedule.value?.horario_detalle) return 0;
  
  const materiasSet = new Set();
  let total = 0;
  
  currentSchedule.value.horario_detalle.forEach(detalle => {
    const materiaId = detalle.grupos?.materias?.id;
    if (materiaId && !materiasSet.has(materiaId)) {
      materiasSet.add(materiaId);
      total += detalle.grupos.materias?.creditos || 0;
    }
  });
  
  return total;
});

const materiasUnicas = computed(() => {
  if (!currentSchedule.value?.horario_detalle) return [];
  
  const materiasMap = new Map();
  
  currentSchedule.value.horario_detalle.forEach(detalle => {
    const materia = detalle.grupos?.materias;
    if (materia && !materiasMap.has(materia.id)) {
      materiasMap.set(materia.id, {
        id: materia.id,
        codigo: materia.codigo,
        nombre: materia.nombre,
        creditos: materia.creditos || 0
      });
    }
  });
  
  return Array.from(materiasMap.values());
});

const distribucionPorDia = computed(() => {
  const distribucion = {};
  
  // Inicializar todos los días con 0
  diasSemana.value.forEach(dia => {
    distribucion[dia] = 0;
  });
  
  // Contar clases por día
  if (currentSchedule.value?.horario_detalle) {
    currentSchedule.value.horario_detalle.forEach(detalle => {
      const dia = detalle.bloques_horarios?.dia;
      if (dia && distribucion[dia] !== undefined) {
        distribucion[dia]++;
      }
    });
  }
  
  return distribucion;
});

// Funciones auxiliares

// Agrega esta función en el script setup
const formatScore = (score, decimals = 1) => {
  if (!score && score !== 0) return '0.0';
  
  // Si el score es un objeto (Decimal de Prisma)
  if (typeof score === 'object' && score !== null) {
    // Si tiene la propiedad $numberDecimal (para MongoDB) o similar
    const value = score.$numberDecimal || score.toString();
    const num = parseFloat(value);
    return isNaN(num) ? '0.0' : num.toFixed(decimals);
  }
  
  // Si es string o número
  const num = parseFloat(score);
  return isNaN(num) ? '0.0' : num.toFixed(decimals);
};

// También actualiza la función getScoreColor



const formatHora = (horaString) => {
  if (!horaString) return '';
  const hora = new Date(horaString);
  return hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
};

const formatFecha = (fechaString) => {
  if (!fechaString) return '';
  const fecha = new Date(fechaString);
  return fecha.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
};

const getNombreDia = (dia) => {
  const nombres = {
    'LUN': 'Lunes',
    'MAR': 'Martes',
    'MIE': 'Miércoles',
    'JUE': 'Jueves',
    'VIE': 'Viernes',
    'SAB': 'Sábado',
    'DOM': 'Domingo'
  };
  return nombres[dia] || dia;
};

const getClasePorBloqueYDia = (bloqueId, dia) => {
  if (!currentSchedule.value?.horario_detalle) return null;
  
  return currentSchedule.value.horario_detalle
    .filter(detalle => 
      detalle.bloques_horarios?.id === bloqueId && 
      detalle.bloques_horarios?.dia === dia
    )
    .map(detalle => ({
      id: detalle.id,
      materia: detalle.grupos?.materias,
      grupo: {
        id: detalle.grupos?.id,
        seccion: detalle.grupos?.seccion,
        profesor: detalle.grupos?.usuarios,
        cupo_max: detalle.grupos?.cupo_max,
        inscritos: detalle.grupos?._count?.inscripciones || 0
      },
      aula: detalle.aulas,
      inscrito: false // Deberías verificar si el usuario ya está inscrito
    }));
};

const getColorClase = (clase) => {
  // Asignar colores basados en el código de la materia
  const colors = [
    'border-blue-400 bg-blue-50',
    'border-green-400 bg-green-50',
    'border-yellow-400 bg-yellow-50',
    'border-purple-400 bg-purple-50',
    'border-pink-400 bg-pink-50',
    'border-indigo-400 bg-indigo-50'
  ];
  
  if (!clase.materia?.codigo) return colors[0];
  
  // Generar un índice basado en el código
  const index = clase.materia.codigo
    .split('')
    .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  
  return colors[index];
};

const getBadgeCupo = (grupo) => {
  if (!grupo) return 'bg-gray-100 text-gray-800';
  
  const cupoDisponible = grupo.cupo_max - grupo.inscritos;
  const porcentaje = (grupo.inscritos / grupo.cupo_max) * 100;
  
  if (cupoDisponible <= 0) return 'bg-red-100 text-red-800';
  if (porcentaje >= 80) return 'bg-orange-100 text-orange-800';
  if (porcentaje >= 50) return 'bg-yellow-100 text-yellow-800';
  return 'bg-green-100 text-green-800';
};

const getTextoBadgeCupo = (grupo) => {
  if (!grupo) return 'Sin info';
  
  const cupoDisponible = grupo.cupo_max - grupo.inscritos;
  return `${grupo.inscritos}/${grupo.cupo_max} (${cupoDisponible} disp.)`;
};

const getEstadoColor = (estado, isBadge = false) => {
  const classes = {
    'QUEUED': isBadge ? 'bg-gray-100 text-gray-800' : 'text-gray-600',
    'RUNNING': isBadge ? 'bg-blue-100 text-blue-800' : 'text-blue-600',
    'DONE': isBadge ? 'bg-green-100 text-green-800' : 'text-green-600',
    'FAILED': isBadge ? 'bg-red-100 text-red-800' : 'text-red-600'
  };
  return classes[estado] || (isBadge ? 'bg-gray-100 text-gray-800' : 'text-gray-600');
};

const getEstadoTexto = (estado) => {
  const textos = {
    'QUEUED': 'En cola',
    'RUNNING': 'Generando',
    'DONE': 'Completado',
    'FAILED': 'Falló'
  };
  return textos[estado] || 'Desconocido';
};

const getScoreColor = (score) => {
  if (score >= 80) return 'bg-green-100 text-green-800';
  if (score >= 60) return 'bg-yellow-100 text-yellow-800';
  if (score >= 40) return 'bg-orange-100 text-orange-800';
  return 'bg-red-100 text-red-800';
};

// Funciones principales
const loadSchedules = async () => {
  try {
    loading.value = true;
    error.value = null;
    
    console.log('🔄 Cargando horarios...');
    
    const response = await http.get('/personal-schedule/my-schedules', {
      params: { periodoId: route.query.periodoId }
    });
    
    console.log('✅ Horarios cargados:', response.data);
    
    if (response.data.success) {
      const schedules = response.data.schedules;
      
      // Cargar bloques horarios si no están cargados
      if (bloquesHorarios.value.length === 0) {
        await loadBloquesHorarios();
      }
      
      // Encontrar el horario actual (por ID o el más reciente)
      if (route.query.horarioId) {
        currentSchedule.value = schedules.find(s => s.id === route.query.horarioId);
      } else if (schedules.length > 0) {
        currentSchedule.value = schedules[0];
      }
      
      // Los demás horarios
      otherSchedules.value = schedules.filter(s => s.id !== currentSchedule.value?.id);
      
      // Obtener información del periodo si hay horario actual
      if (currentSchedule.value) {
        periodoActual.value = currentSchedule.value.periodos;
      }
      
      console.log(`📋 ${schedules.length} horarios cargados`);
    }
  } catch (err) {
    console.error('❌ Error cargando horarios:', err);
    error.value = err.response?.data?.message || 'Error al cargar horarios';
  } finally {
    loading.value = false;
  }
};

const loadBloquesHorarios = async () => {
  try {
    const response = await http.get('/time-blocks');
    if (response.data && response.data.timeBlocks) {
      // Ordenar por hora de inicio
      bloquesHorarios.value = response.data.timeBlocks
        .sort((a, b) => {
          const horaA = new Date(a.hora_inicio).getTime();
          const horaB = new Date(b.hora_inicio).getTime();
          return horaA - horaB;
        });
      
      console.log(`⏰ ${bloquesHorarios.value.length} bloques horarios cargados`);
    }
  } catch (err) {
    console.error('Error cargando bloques horarios:', err);
    // Si falla, usar bloques por defecto
    bloquesHorarios.value = [
      { id: '1', hora_inicio: '07:00:00', hora_fin: '08:30:00' },
      { id: '2', hora_inicio: '08:30:00', hora_fin: '10:00:00' },
      { id: '3', hora_inicio: '10:00:00', hora_fin: '11:30:00' },
      { id: '4', hora_inicio: '11:30:00', hora_fin: '13:00:00' },
      { id: '5', hora_inicio: '13:00:00', hora_fin: '14:30:00' },
      { id: '6', hora_inicio: '14:30:00', hora_fin: '16:00:00' },
      { id: '7', hora_inicio: '16:00:00', hora_fin: '17:30:00' },
      { id: '8', hora_inicio: '17:30:00', hora_fin: '19:00:00' }
    ];
  }
};

const calcularCreditosHorario = (schedule) => {
  if (!schedule?.horario_detalle) return 0;
  
  const materiasSet = new Set();
  let total = 0;
  
  schedule.horario_detalle.forEach(detalle => {
    const materiaId = detalle.grupos?.materias?.id;
    if (materiaId && !materiasSet.has(materiaId)) {
      materiasSet.add(materiaId);
      total += detalle.grupos.materias?.creditos || 0;
    }
  });
  
  return total;
};

const modifySchedule = () => {
  // Volver a la selección con los grupos actuales
  router.push({
    name: 'subject-selection',
    query: { 
      periodoId: route.query.periodoId,
      horarioId: currentSchedule.value.id 
    }
  });
};

const confirmEnrollment = async () => {
  if (!currentSchedule.value) return;
  
  if (!confirm('¿Confirmar inscripción en estas materias? Se realizarán las inscripciones automáticamente.')) return;
  
  try {
    console.log('📝 Confirmando inscripción...');
    
    const response = await http.post('/auto-enrollment/enroll-from-schedule', {
      horarioId: currentSchedule.value.id
    });
    
    console.log('✅ Respuesta de inscripción:', response.data);
    
    if (response.data.success) {
      alert('✅ ' + response.data.message);
      router.push('/student/dashboard');
    } else {
      throw new Error(response.data.message);
    }
  } catch (err) {
    console.error('❌ Error realizando inscripción:', err);
    alert('Error al realizar inscripción: ' + err.response?.data?.message);
  }
};

const inscribirEnClase = async (clase) => {
  if (!clase.grupo?.id) return;
  
  if (!confirm(`¿Inscribirte en ${clase.materia?.nombre} - Sección ${clase.grupo.seccion}?`)) return;
  
  try {
    const response = await http.post('/real-enrollment/enroll', {
      grupoId: clase.grupo.id
    });
    
    if (response.data.success) {
      alert('✅ Inscripción realizada exitosamente');
      // Recargar datos
      await loadSchedules();
    }
  } catch (err) {
    alert('Error al inscribir: ' + err.response?.data?.message);
  }
};

const loadSchedule = (horarioId) => {
  router.push({
    name: 'student-schedules',
    query: { ...route.query, horarioId }
  });
};

const duplicateSchedule = async (horarioId) => {
  if (!confirm('¿Crear una copia de este horario para modificarlo?')) return;
  
  try {
    const response = await http.post('/personal-schedule/duplicate', {
      horarioId: horarioId
    });
    
    if (response.data.success) {
      alert('✅ Horario duplicado exitosamente');
      // Recargar la página con el nuevo horario
      router.push({
        name: 'student-schedules',
        query: { ...route.query, horarioId: response.data.nuevoHorarioId }
      });
    }
  } catch (err) {
    console.error('Error duplicando horario:', err);
    alert('Error al duplicar horario: ' + err.response?.data?.message);
  }
};

const goToSelection = () => {
  router.push({
    name: 'subject-selection',
    query: { periodoId: route.query.periodoId }
  });
};

// Inicialización
onMounted(() => {
  console.log('🚀 Vista de horarios montada');
  loadSchedules();
});
</script>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>