<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { fetchAvailableGroups, fetchMyEnrollments, enrollInGroup, cancelEnrollment } from '../services/enrollments'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const loadingOptions = ref(false)
const loadingMy = ref(false)
const availableGroups = ref([])
const periodInfo = ref(null)
const carreraId = ref(null)
const myEnrollments = ref([])
const enrollingId = ref('')
const cancelingId = ref('')
const errorMessage = ref('')

const hasEligibleGroups = computed(() => availableGroups.value.some((g) => g.elegible))

const scheduleToText = (horarios = []) =>
  horarios
    .map((h) => `${h.dia || 'Día'} ${h.hora_inicio?.substring(0, 5) || ''}-${h.hora_fin?.substring(0, 5) || ''}`)
    .join(', ')

const restrictionLabel = (item) => {
  if (item.restricciones?.cupo) return 'Sin cupo'
  if (item.restricciones?.conflicto) return 'Conflicto de horario'
  if (item.restricciones?.prerequisitos?.length) return 'Prerrequisitos pendientes'
  return 'No elegible'
}

const loadAvailable = async () => {
  loadingOptions.value = true
  errorMessage.value = ''
  try {
    const { data } = await fetchAvailableGroups()
    availableGroups.value = data.items || []
    periodInfo.value = data.periodo || null
    carreraId.value = data.carrera_id || null
  } catch (err) {
    console.error(err)
    errorMessage.value = err?.response?.data?.message || 'No se pudieron cargar los grupos disponibles'
    availableGroups.value = []
  } finally {
    loadingOptions.value = false
  }
}

const loadMyEnrollments = async () => {
  loadingMy.value = true
  try {
    const { data } = await fetchMyEnrollments()
    myEnrollments.value = data.items || []
  } catch (err) {
    console.error(err)
    myEnrollments.value = []
  } finally {
    loadingMy.value = false
  }
}

const refreshAll = () => {
  loadAvailable()
  loadMyEnrollments()
}

const handleEnroll = async (groupId) => {
  enrollingId.value = groupId
  try {
    await enrollInGroup(groupId)
    await refreshAll()
    alert('Inscripción realizada exitosamente')
  } catch (err) {
    alert(err?.response?.data?.message || 'No se pudo inscribir en el grupo')
  } finally {
    enrollingId.value = ''
  }
}

const handleCancel = async (enrollmentId) => {
  if (!confirm('¿Deseas cancelar esta inscripción?')) return
  cancelingId.value = enrollmentId
  try {
    await cancelEnrollment(enrollmentId)
    await refreshAll()
  } catch (err) {
    alert(err?.response?.data?.message || 'No se pudo cancelar la inscripción')
  } finally {
    cancelingId.value = ''
  }
}

onMounted(() => {
  if (auth.user?.rol !== 'ESTUDIANTE') {
    router.push('/dashboard')
    return
  }
  refreshAll()
})
</script>

<template>
  <div class="p-6 space-y-8">
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Inscripción de materias</h2>
        <p class="text-sm text-gray-500">Periodo activo: <strong>{{ periodInfo?.nombre || '—' }}</strong> · Carrera: <strong>{{ carreraId || '—' }}</strong></p>
      </div>
      <button @click="refreshAll" class="px-4 py-2 bg-sky-500 text-white rounded hover:bg-sky-600">Actualizar</button>
    </div>

    <div v-if="errorMessage" class="bg-red-50 border border-red-100 text-red-700 px-4 py-3 rounded">{{ errorMessage }}</div>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-semibold">Grupos disponibles</h3>
        <span class="text-sm text-gray-500">{{ hasEligibleGroups ? 'Selecciona un grupo para inscribirte' : 'No hay grupos elegibles actualmente' }}</span>
      </div>

      <div v-if="loadingOptions" class="bg-white rounded shadow p-6 text-gray-500">Cargando opciones...</div>

      <div v-else-if="availableGroups.length === 0" class="bg-white rounded shadow p-6 text-gray-500">No se encontraron grupos para tu perfil.</div>

      <div v-else class="grid gap-4 md:grid-cols-2">
        <article
          v-for="group in availableGroups"
          :key="group.id"
          class="border rounded-xl bg-white shadow-sm p-4 flex flex-col gap-3"
        >
          <div>
            <p class="text-xs text-gray-500">{{ group.materia?.codigo || 'MATERIA' }}</p>
            <h4 class="text-lg font-semibold">{{ group.materia?.nombre }}</h4>
            <p class="text-sm text-gray-500">Sección {{ group.seccion }} · Profesor {{ group.profesor?.nombre || '—' }}</p>
          </div>

          <div class="text-sm text-gray-600">
            <p><strong>Horario:</strong> {{ scheduleToText(group.horarios) || 'Pendiente' }}</p>
            <p><strong>Cupo:</strong> {{ group.capacidad?.disponibles ?? '—' }} disponibles</p>
          </div>

          <div class="flex justify-between items-center mt-auto">
            <div>
              <span
                v-if="!group.elegible"
                class="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-red-100 text-red-600"
              >
                {{ restrictionLabel(group) }}
              </span>
              <span
                v-else
                class="inline-flex items-center text-xs font-semibold px-2 py-1 rounded-full bg-emerald-100 text-emerald-700"
              >
                Elegible
              </span>
            </div>
            <button
              @click="handleEnroll(group.id)"
              :disabled="!group.elegible || enrollingId === group.id"
              class="px-4 py-2 rounded bg-sky-500 text-white hover:bg-sky-600 disabled:opacity-50"
            >
              {{ enrollingId === group.id ? 'Procesando...' : 'Inscribirme' }}
            </button>
          </div>

          <div v-if="group.restricciones?.prerequisitos?.length" class="text-xs text-gray-500 bg-gray-50 rounded p-2">
            Debes aprobar: {{ group.restricciones.prerequisitos.map((p) => p.materia?.nombre || p.id).join(', ') }}
          </div>
          <div v-if="group.restricciones?.conflicto" class="text-xs text-gray-500 bg-gray-50 rounded p-2">
            Conflicto con {{ group.restricciones.conflicto?.materia?.nombre || 'otra materia' }}
          </div>
        </article>
      </div>
    </section>

    <section class="space-y-4">
      <div class="flex items-center justify-between">
        <h3 class="text-xl font-semibold">Mis inscripciones</h3>
        <span class="text-sm text-gray-500">Cancela antes de la fecha límite del período.</span>
      </div>

      <div v-if="loadingMy" class="bg-white rounded shadow p-6 text-gray-500">Cargando inscripciones...</div>

      <div v-else-if="myEnrollments.length === 0" class="bg-white rounded shadow p-6 text-gray-500">Aún no tienes inscripciones activas.</div>

      <div v-else class="bg-white rounded shadow overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Materia</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Período</th>
              <th class="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Horario</th>
              <th class="px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="item in myEnrollments" :key="item.id">
              <td class="px-4 py-3">
                <p class="font-semibold">{{ item.grupo?.materia?.nombre }}</p>
                <p class="text-xs text-gray-500">{{ item.grupo?.materia?.codigo }}</p>
              </td>
              <td class="px-4 py-3">{{ item.grupo?.periodo?.nombre }}</td>
              <td class="px-4 py-3">{{ scheduleToText(item.grupo?.horarios) || 'No definido' }}</td>
              <td class="px-4 py-3 text-right">
                <button
                  @click="handleCancel(item.id)"
                  :disabled="cancelingId === item.id"
                  class="px-3 py-1 rounded text-xs bg-red-50 text-red-600 disabled:opacity-50"
                >
                  {{ cancelingId === item.id ? 'Cancelando...' : 'Cancelar' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </div>
</template>
