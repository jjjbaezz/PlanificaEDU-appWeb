<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { fetchGroupEnrollments, adminAddStudentToGroup, adminRemoveEnrollment } from '../../services/enrollments'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()

const groupIdInput = ref('')
const loading = ref(false)
const error = ref('')
const group = ref(null)
const enrollments = ref([])
const capacity = ref(null)

const addStudentId = ref('')
const adding = ref(false)
const removingId = ref('')

const hasGroupLoaded = computed(() => !!group.value)

const capacityMessage = computed(() => {
  if (!capacity.value) return '--'
  const used = capacity.value.inscritos ?? 0
  if (capacity.value.disponibles === null && capacity.value.cupo_max === null) {
    return `${used} inscritos`
  }
  const max = capacity.value.cupo_max ?? group.value?.cupo_max ?? '∞'
  const free = capacity.value.disponibles ?? (typeof max === 'number' ? Math.max(max - used, 0) : null)
  return `${used} / ${max} ${free !== null ? `(disponibles ${free})` : ''}`
})

const goBack = () => router.push('/dashboard')

const handleError = (err, fallback) => {
  if (err?.response?.data?.message) return err.response.data.message
  return fallback
}

const fetchData = async () => {
  if (!groupIdInput.value.trim()) {
    error.value = 'Ingresa un ID de grupo'
    return
  }
  loading.value = true
  error.value = ''
  try {
    const { data } = await fetchGroupEnrollments(groupIdInput.value.trim())
    group.value = data.group
    enrollments.value = data.enrollments || []
    capacity.value = data.group?.capacidad || null
  } catch (err) {
    group.value = null
    enrollments.value = []
    capacity.value = null
    error.value = handleError(err, 'No se pudo cargar el grupo')
  } finally {
    loading.value = false
  }
}

const addStudent = async () => {
  if (!group.value) return
  if (!addStudentId.value.trim()) {
    alert('Debes indicar el ID del estudiante')
    return
  }
  adding.value = true
  try {
    const { data } = await adminAddStudentToGroup(group.value.id, addStudentId.value.trim())
    enrollments.value = [...enrollments.value, data.enrollment]
    capacity.value = data.capacity || capacity.value
    addStudentId.value = ''
    alert('Estudiante inscrito correctamente')
  } catch (err) {
    alert(handleError(err, 'No se pudo inscribir al estudiante'))
  } finally {
    adding.value = false
  }
}

const confirmAndRemove = async (enrollmentId) => {
  if (!group.value) return
  if (!confirm('¿Eliminar esta inscripción?')) return
  removingId.value = enrollmentId
  try {
    const { data } = await adminRemoveEnrollment(group.value.id, enrollmentId)
    enrollments.value = enrollments.value.filter((item) => item.id !== enrollmentId)
    capacity.value = data.capacity || capacity.value
  } catch (err) {
    alert(handleError(err, 'No se pudo eliminar la inscripción'))
  } finally {
    removingId.value = ''
  }
}

if (auth.user?.rol !== 'ADMIN') {
  router.push('/dashboard')
}
</script>

<template>
  <div class="p-6 space-y-6">
    <div class="flex items-center justify-between">
      <div>
        <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold text-gray-800">Inscripciones por grupo</h2>
          <button
            @click="goBack"
            class="inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 111.414 1.414L6.414 10l3.293 3.293a1 1 0 010 1.414z" clip-rule="evenodd"/><path d="M13 15a1 1 0 100-2h-1a1 1 0 100 2h1z"/></svg>
            Volver
          </button>
        </div>
        <p class="text-sm text-gray-500">Consulta los estudiantes inscritos, agrega nuevos o elimina inscripciones.</p>
      </div>
      <div class="flex gap-3">
        <input
          v-model="groupIdInput"
          placeholder="ID de grupo"
          class="border rounded px-4 py-2 w-64"
        />
        <button
          @click="fetchData"
          :disabled="loading"
          class="bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white px-4 py-2 rounded"
        >
          {{ loading ? 'Buscando...' : 'Cargar grupo' }}
        </button>
      </div>
    </div>

    <div v-if="error" class="bg-red-50 text-red-700 border border-red-100 px-4 py-3 rounded">{{ error }}</div>

    <div v-if="hasGroupLoaded" class="space-y-4">
      <div class="bg-white shadow rounded p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <p class="text-sm text-gray-500">Materia</p>
          <p class="text-lg font-semibold">{{ group?.materia?.nombre }} <span class="text-gray-500">({{ group?.materia?.codigo }})</span></p>
          <p class="text-sm text-gray-500">Sección {{ group?.seccion }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Período</p>
          <p class="text-lg font-semibold">{{ group?.periodo?.nombre }}</p>
        </div>
        <div>
          <p class="text-sm text-gray-500">Capacidad</p>
          <p class="text-lg font-semibold">{{ capacityMessage }}</p>
        </div>
      </div>

      <div class="bg-white shadow rounded p-4 space-y-4">
        <div class="flex flex-wrap items-center gap-3">
          <h3 class="text-lg font-semibold">Agregar estudiante</h3>
          <input
            v-model="addStudentId"
            placeholder="ID de estudiante"
            class="border rounded px-3 py-2"
          />
          <button
            @click="addStudent"
            :disabled="adding || !addStudentId"
            class="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white px-4 py-2 rounded"
          >
            {{ adding ? 'Agregando...' : 'Inscribir' }}
          </button>
          <span class="text-xs text-gray-500">Usa el ID que aparece en la lista de usuarios.</span>
        </div>

        <div v-if="enrollments.length === 0" class="text-sm text-gray-500">Este grupo no tiene inscripciones registradas.</div>

        <div v-else class="overflow-x-auto">
          <table class="min-w-full text-sm">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Estudiante</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Correo</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Carrera</th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Inscrito el</th>
                <th class="px-4 py-2 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody class="divide-y">
              <tr v-for="item in enrollments" :key="item.id">
                <td class="px-4 py-2">{{ item.estudiante?.nombre || 'N/D' }}</td>
                <td class="px-4 py-2">{{ item.estudiante?.email || '—' }}</td>
                <td class="px-4 py-2">{{ item.estudiante?.carrera_id || '—' }}</td>
                <td class="px-4 py-2">{{ new Date(item.created_at).toLocaleString() }}</td>
                <td class="px-4 py-2 text-right">
                  <button
                    @click="confirmAndRemove(item.id)"
                    :disabled="removingId === item.id"
                    class="text-xs px-3 py-1 rounded bg-red-50 text-red-600 disabled:opacity-50"
                  >
                    {{ removingId === item.id ? 'Eliminando...' : 'Eliminar' }}
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>
