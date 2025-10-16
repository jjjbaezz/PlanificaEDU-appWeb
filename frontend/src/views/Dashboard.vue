<script setup>
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '../stores/auth'
import StatCard from '../components/StatCard.vue'
import SectionTitle from '../components/SectionTitle.vue'
import TableCard from '../components/TableCard.vue'

const auth = useAuthStore()

const role = computed(() => auth.user?.rol || 'ESTUDIANTE') // fallback
const nombre = computed(() => auth.user?.nombre || 'Usuario')

// ===== DATOS ESTÁTICOS POR ROL =====

// ADMIN
const adminCards = ref({
  usuarios: { total: 128, profesores: 36, estudiantes: 92 },
  academico: { carreras: 8, materias: 154, periodos: 5 },
  ofertaActual: { periodo: '2025-2', grupos: 47, inscripciones: 612, cuposTotales: 1200, cuposDisponibles: 588 },
})

// PROFESOR
const profesorCards = ref({
  totalGrupos: 5,
  periodoActual: '2025-2',
  disponibilidadBloques: 24,
})
const profesorTabla = ref([
  { periodo: '2025-2', codigo: 'MAT-101', materia: 'Cálculo I', seccion: '01', cupo_max: 35 },
  { periodo: '2025-2', codigo: 'FIS-110', materia: 'Física I',  seccion: 'B',  cupo_max: 30 },
  { periodo: '2025-1', codigo: 'MAT-102', materia: 'Cálculo II', seccion: '02', cupo_max: 30 },
])

// ESTUDIANTE
const estudianteCards = ref({
  periodoActual: '2025-2',
  inscripciones: 4,
  cuposDisponibles: 588,
  preferencias: {
    turno_preferido: 'MANANA',
    compactacion: 7,
    evitar_dias: ['VIE', 'SAB'],
  }
})
const estudianteTabla = ref([
  { periodo: '2025-2', codigo: 'MAT-101', materia: 'Cálculo I', seccion: '01', profesor: 'A. Ramírez' },
  { periodo: '2025-2', codigo: 'PRO-120', materia: 'Programación I', seccion: 'A', profesor: 'L. Paredes' },
  { periodo: '2025-2', codigo: 'FIS-110', materia: 'Física I', seccion: 'B', profesor: 'C. Taveras' },
])

// ===== HEADERS REUSABLES =====
const hdrGrupos = [
  { key: 'periodo', label: 'Periodo' },
  { key: 'codigo', label: 'Código' },
  { key: 'materia', label: 'Materia' },
  { key: 'seccion', label: 'Sección' },
  { key: 'cupo_max', label: 'Cupo' },
]

const hdrInscripciones = [
  { key: 'periodo', label: 'Periodo' },
  { key: 'codigo', label: 'Código' },
  { key: 'materia', label: 'Materia' },
  { key: 'seccion', label: 'Sección' },
  { key: 'profesor', label: 'Profesor' },
]
</script>

<template>
  <div class="min-h-screen bg-gray-50">
    <!-- Header -->
    <header class="bg-white border-b">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div>
          <h1 class="text-2xl sm:text-3xl font-bold text-sky-400">PlanificaEDU</h1>
          <p class="text-gray-500">
            Hola, <span class="font-medium">{{ nombre }}</span>
            — Rol: <span class="uppercase">{{ role }}</span>
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button class="px-4 py-2 rounded-xl bg-sky-400 hover:bg-sky-500 text-white font-medium transition">Acción</button>
        </div>
      </div>
    </header>

    <!-- Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <!-- ADMIN -->
      <section v-if="role === 'ADMIN'" class="space-y-8">
        <!-- Cards -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard label="Usuarios" :value="adminCards.usuarios.total"
                    :sublabel="`Profesores: ${adminCards.usuarios.profesores} · Estudiantes: ${adminCards.usuarios.estudiantes}`" />
          <StatCard label="Carreras" :value="adminCards.academico.carreras"
                    :sublabel="`Materias: ${adminCards.academico.materias}`" />
          <StatCard label="Periodos" :value="adminCards.academico.periodos"
                    :sublabel="`Actual: ${adminCards.ofertaActual.periodo}`" />
          <StatCard label="Grupos (periodo)" :value="adminCards.ofertaActual.grupos"
                    :sublabel="`Inscripciones: ${adminCards.ofertaActual.inscripciones}`" />
        </div>

        <!-- Cupos -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div class="bg-white rounded-2xl shadow p-6 lg:col-span-2">
            <SectionTitle title="Cupos del periodo" />
            <div class="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div class="p-4 border rounded-xl">
                <p class="text-gray-500 text-sm">Cupos totales</p>
                <p class="text-2xl font-bold text-sky-400">{{ adminCards.ofertaActual.cuposTotales }}</p>
              </div>
              <div class="p-4 border rounded-xl">
                <p class="text-gray-500 text-sm">Cupos disponibles</p>
                <p class="text-2xl font-bold text-sky-400">{{ adminCards.ofertaActual.cuposDisponibles }}</p>
              </div>
            </div>
            <p class="text-xs text-gray-400 mt-3">* Datos de ejemplo</p>
          </div>

          <div class="bg-white rounded-2xl shadow p-6">
            <SectionTitle title="Acciones rápidas" subtitle="(demo)" />
            <ul class="mt-3 space-y-2 text-sm text-gray-600">
              <li>• Crear periodo</li>
              <li>• Crear grupo</li>
              <li>• Ver inscripciones</li>
            </ul>
          </div>
        </div>
      </section>

      <!-- PROFESOR -->
      <section v-else-if="role === 'PROFESOR'" class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Grupos asignados" :value="profesorCards.totalGrupos" />
          <StatCard label="Periodo actual" :value="profesorCards.periodoActual" />
          <StatCard label="Bloques de disponibilidad" :value="profesorCards.disponibilidadBloques" />
        </div>

        <TableCard title="Tus grupos (recientes)" :headers="hdrGrupos" :rows="profesorTabla" emptyText="No tienes grupos asignados." />
      </section>

      <!-- ESTUDIANTE -->
      <section v-else class="space-y-8">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-5">
          <StatCard label="Periodo actual" :value="estudianteCards.periodoActual" />
          <StatCard label="Mis inscripciones" :value="estudianteCards.inscripciones" />
          <StatCard label="Cupos disponibles (global)" :value="estudianteCards.cuposDisponibles" />
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div class="bg-white rounded-2xl shadow p-6">
            <SectionTitle title="Mis preferencias" />
            <div class="text-gray-700 text-sm">
              <p><span class="text-gray-500">Turno: </span>{{ estudianteCards.preferencias.turno_preferido }}</p>
              <p><span class="text-gray-500">Compactación: </span>{{ estudianteCards.preferencias.compactacion }}</p>
              <p><span class="text-gray-500">Evitar días: </span>
                <span v-if="estudianteCards.preferencias.evitar_dias?.length">
                  {{ estudianteCards.preferencias.evitar_dias.join(', ') }}
                </span>
                <span v-else>—</span>
              </p>
            </div>
          </div>

          <TableCard title="Mis inscripciones"
                     :headers="hdrInscripciones"
                     :rows="estudianteTabla"
                     emptyText="Aún no te has inscrito en grupos." />
        </div>
      </section>
    </main>
  </div>
</template>
