<script setup>
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const emit = defineEmits(['back'])
const router = useRouter()

function goBack() {
  emit('back')
  router.push('/dashboard')
}
import http from '../../services/http'
import ScheduleItem from '../../components/admin/ScheduleItem.vue'
import ScheduleFormModal from '../../components/admin/ScheduleFormModal.vue'
import EmptyState from '../../components/admin/EmptyState.vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

const filtros = ref('')
const items = ref([])
const loading = ref(false)
const error = ref(null)

const showForm = ref(false)
const editing = ref(null)

async function fetchHorarios() {
  loading.value = true
  error.value = null
  try {
    const res = await http.get('/admin/horarios', { params: { search: filtros.value } })
    items.value = res.data.items || []
  } catch (e) {
    console.error('Error fetching horarios', e)
    error.value = e
  } finally {
    loading.value = false
  }
}

function openCreate() { editing.value = null; showForm.value = true }
function openEdit(item) { editing.value = item; showForm.value = true }

function onSaved() { showForm.value = false; fetchHorarios() }

onMounted(() => {
  if (auth.user?.rol !== 'ADMIN') return
  fetchHorarios()
})
</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-2xl font-bold">Gestión de Horarios</h2>
        <button
          @click="goBack"
          class="ml-4 inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
          aria-label="Volver al dashboard"
        >
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 111.414 1.414L6.414 10l3.293 3.293a1 1 0 010 1.414z" clip-rule="evenodd"/><path d="M13 15a1 1 0 100-2h-1a1 1 0 100 2h1z"/></svg>
          <span>Volver</span>
        </button>
        <p class="text-sm text-gray-500">Añade, edita y elimina los horarios de la institución.</p>
      </div>
      <div class="flex items-center gap-3">
        <button @click="openCreate" class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded">+ Añadir Nuevo Horario</button>
      </div>
    </div>

    <div class="mb-4 flex gap-3 items-center">
      <button class="px-3 py-2 border rounded">Filtrar</button>
      <input v-model="filtros" @input="fetchHorarios" placeholder="Buscar por asignatura..." class="border rounded px-4 py-2 w-96" />
    </div>

    <div v-if="loading" class="bg-white p-6 rounded shadow">Cargando horarios...</div>

    <div v-else>
      <div v-if="error" class="bg-red-50 p-4 rounded mb-4">Error cargando horarios. <button @click="fetchHorarios" class="underline">Reintentar</button></div>

      <div v-if="items.length === 0">
        <EmptyState @add="openCreate" />
      </div>

      <div v-else class="bg-white rounded-lg shadow overflow-hidden">
        <table class="w-full text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Asignatura</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Profesor</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Horario</th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Carrera</th>
              <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
            </tr>
          </thead>
          <tbody class="divide-y">
            <tr v-for="(h, idx) in items" :key="h.id || idx">
              <td class="px-4 py-4">{{ h.asignatura || h.materia || '—' }}</td>
              <td class="px-4 py-4">{{ h.profesor || '—' }}</td>
              <td class="px-4 py-4">{{ h.horario || '—' }}</td>
              <td class="px-4 py-4">{{ h.carrera || '—' }}</td>
              <td class="px-4 py-4 text-right">
                <div class="flex items-center justify-end gap-3">
                  <button @click="openEdit(h)" class="px-2 py-1 text-sky-600 bg-sky-50 rounded">✏️</button>
                  <button @click="() => { if(confirm(`¿Eliminar horario de ${h.asignatura || 'esta asignatura'}?`)) { http.delete(`/admin/horarios/${h.id}`).then(()=>fetchHorarios()) } }" class="px-2 py-1 text-red-600 bg-red-50 rounded">🗑️</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  <ScheduleFormModal v-model="showForm" :initialData="editing" @saved="onSaved" />
  </div>
</template>

<style scoped>
/* small adjustments to match existing UI */
</style>
