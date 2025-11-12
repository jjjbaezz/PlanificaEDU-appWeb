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

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-12">
      <!-- ADMIN VIEW -->
      <section v-if="role === 'ADMIN'" class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Usuarios"
            :value="1250"
            sublabel="Profesores: 36 · Estudiantes: 92"
          />
          <StatCard
            label="Carreras Activas"
            :value="18"
            sublabel="Materias: 154"
          />
          <StatCard
            label="Período Actual"
            :value="'2024-2'"
            sublabel="Grupos: 47"
          />
          <StatCard
            label="Grupos Abiertos"
            :value="85"
            sublabel="Cupos: 588"
          />
        </div>

        <!-- Charts Section -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-bold text-gray-900">Ocupación por Carrera</h3>
              <span class="text-green-600 text-sm font-semibold">↑ +5.2%</span>
            </div>
            <p class="text-gray-500 text-sm mb-6">Estudiantes inscritos este semestre.</p>

            <div class="h-72 bg-gradient-to-b from-sky-50 to-sky-100 rounded-lg flex items-end justify-around px-4 py-8 gap-2">
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-sky-300 rounded-t" style="height: 120px;"></div>
                <p class="text-xs text-gray-600 font-medium">Software</p>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-sky-300 rounded-t" style="height: 100px;"></div>
                <p class="text-xs text-gray-600 font-medium">Psicología</p>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-sky-300 rounded-t" style="height: 80px;"></div>
                <p class="text-xs text-gray-600 font-medium">Derecho</p>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-sky-400 rounded-t" style="height: 180px;"></div>
                <p class="text-xs text-gray-600 font-medium">Medicina</p>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-sky-300 rounded-t" style="height: 140px;"></div>
                <p class="text-xs text-gray-600 font-medium">Arquitectura</p>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-sky-300 rounded-t" style="height: 130px;"></div>
                <p class="text-xs text-gray-600 font-medium">Diseño</p>
              </div>
              <div class="flex flex-col items-center gap-2 flex-1">
                <div class="w-full bg-sky-300 rounded-t" style="height: 110px;"></div>
                <p class="text-xs text-gray-600 font-medium">Contaduría</p>
              </div>
            </div>
          </div>

          <!-- Alertas y Notificaciones -->
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Alertas y Notificaciones</h3>
            <div class="space-y-3">
              <div class="flex gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <span class="text-xl flex-shrink-0">⚠️</span>
                <div>
                  <p class="font-semibold text-sm text-gray-900">Conflicto de Horario</p>
                  <p class="text-xs text-gray-600">Aula B-201 reservada dos veces el lunes a las 10am.</p>
                </div>
              </div>
              <div class="flex gap-3 p-3 bg-red-50 border border-red-200 rounded-lg">
                <span class="text-xl flex-shrink-0">👥</span>
                <div>
                  <p class="font-semibold text-sm text-gray-900">Baja Inscripción</p>
                  <p class="text-xs text-gray-600">El grupo de "Cálculo Avanzado" tiene solo 3 estudiantes.</p>
                </div>
              </div>
              <div class="flex gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                <span class="text-xl flex-shrink-0">✅</span>
                <div>
                  <p class="font-semibold text-sm text-gray-900">Aprobación Pendiente</p>
                  <p class="text-xs text-gray-600">Nueva materia "IA Generativa" espera aprobación.</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Inscriptions -->
        <TableCard
          title="Últimas Inscripciones"
          :headers="[
            { key: 'estudiante', label: 'ESTUDIANTE' },
            { key: 'carrera', label: 'CARRERA' },
            { key: 'fecha', label: 'FECHA' },
            { key: 'estado', label: 'ESTADO' },
          ]"
          :rows="[
            { estudiante: 'Sofía Vergara', carrera: 'Ingeniería de Software', fecha: '2024-08-15', estado: 'Aprobada' },
            { estudiante: 'Juan Carlos Pérez', carrera: 'Medicina', fecha: '2024-08-15', estado: 'Aprobada' },
            { estudiante: 'Valentina Rojas', carrera: 'Arquitectura', fecha: '2024-08-14', estado: 'Pendiente' },
            { estudiante: 'Mateo González', carrera: 'Derecho', fecha: '2024-08-13', estado: 'Aprobada' },
          ]"
        />
      </section>

      <!-- PROFESOR VIEW -->
      <section v-else-if="role === 'PROFESOR'" class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Grupos Asignados" :value="5" />
          <StatCard label="Período Actual" :value="'2025-2'" />
          <StatCard label="Bloques Disponibles" :value="24" />
        </div>

        <TableCard
          title="Tus Grupos (Recientes)"
          :headers="[
            { key: 'periodo', label: 'Período' },
            { key: 'codigo', label: 'Código' },
            { key: 'materia', label: 'Materia' },
            { key: 'seccion', label: 'Sección' },
            { key: 'cupo_max', label: 'Cupo' },
          ]"
          :rows="[
            { periodo: '2025-2', codigo: 'MAT-101', materia: 'Cálculo I', seccion: '01', cupo_max: 35 },
            { periodo: '2025-2', codigo: 'FIS-110', materia: 'Física I', seccion: 'B', cupo_max: 30 },
            { periodo: '2025-1', codigo: 'MAT-102', materia: 'Cálculo II', seccion: '02', cupo_max: 30 },
          ]"
        />
      </section>

      <!-- ESTUDIANTE VIEW -->
      <section v-else class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Período Actual" :value="'2025-2'" />
          <StatCard label="Mis Inscripciones" :value="4" />
          <StatCard label="Cupos Disponibles" :value="588" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 class="text-lg font-bold text-gray-900 mb-4">Mis Preferencias</h3>
            <div class="space-y-3 text-sm text-gray-700">
              <p><span class="text-gray-500">Turno Preferido:</span> Mañana</p>
              <p><span class="text-gray-500">Compactación:</span> 7 horas/día</p>
              <p><span class="text-gray-500">Evitar Días:</span> Viernes, Sábado</p>
            </div>
          </div>

          <TableCard
            title="Mis Inscripciones"
            :headers="[
              { key: 'periodo', label: 'Período' },
              { key: 'codigo', label: 'Código' },
              { key: 'materia', label: 'Materia' },
              { key: 'seccion', label: 'Sección' },
              { key: 'profesor', label: 'Profesor' },
            ]"
            :rows="[
              { periodo: '2025-2', codigo: 'MAT-101', materia: 'Cálculo I', seccion: '01', profesor: 'A. Ramírez' },
              { periodo: '2025-2', codigo: 'PRO-120', materia: 'Programación I', seccion: 'A', profesor: 'L. Paredes' },
              { periodo: '2025-2', codigo: 'FIS-110', materia: 'Física I', seccion: 'B', profesor: 'C. Taveras' },
            ]"
          />
        </div>
      </section>
    </main>
  </Sidebar>
</template>

<script setup>
import { computed, ref } from 'vue'
import Sidebar from '../components/Sidebar.vue'
import StatCard from '../components/StatCard.vue'
import TableCard from '../components/TableCard.vue'

const user = ref({
  nombre: 'Alejandro Mora',
  rol: 'ADMIN',
})

const nombre = computed(() => user.value.nombre)
const role = computed(() => user.value.rol)
</script>
