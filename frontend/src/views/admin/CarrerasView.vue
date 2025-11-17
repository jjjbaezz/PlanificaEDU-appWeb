<script setup>
import { ref, watch, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const emit = defineEmits(['back'])
const router = useRouter()

function goBack() {
  emit('back')
  router.push('/dashboard')
}
import http from '../../services/http'
import CareerFormModal from '../../components/admin/CareerFormModal.vue'
import CareerItem from '../../components/admin/CareerItem.vue'
import ConfirmDeleteModal from '../../components/admin/ConfirmDeleteModal.vue'
import EmptyState from '../../components/admin/EmptyState.vue'
import { useAuthStore } from '../../stores/auth'

const auth = useAuthStore()

const search = ref('')
const page = ref(1)
const limit = ref(12)
const items = ref([])
const meta = ref({ page: 1, limit: 12, total: 0 })
const loading = ref(false)
const error = ref(null)

// modals
const showForm = ref(false)
const editing = ref(null)
const showDelete = ref(false)
const deletingItem = ref(null)

let debounceTimer = null

async function fetchCarreras() {
  loading.value = true
  error.value = null
  try {
    const res = await http.get('/admin/carreras', { params: { search: search.value, page: page.value, limit: limit.value } })
    items.value = res.data.items || []
    meta.value = res.data.meta || { page: page.value, limit: limit.value, total: items.value.length }
  } catch (e) {
    console.error('Error fetching carreras', e)
    error.value = e
  } finally {
    loading.value = false
  }
}

function onSearchChange(val) {
  clearTimeout(debounceTimer)
  debounceTimer = setTimeout(() => {
    page.value = 1
    fetchCarreras()
  }, 350)
}

function openCreate() {
  editing.value = null
  showForm.value = true
}

function openEdit(item) {
  editing.value = item
  showForm.value = true
}

function onSaved(newItem) {
  showForm.value = false
  // refresh list (could do optimistic update)
  fetchCarreras()
}

function confirmDelete(item) {
  deletingItem.value = item
  showDelete.value = true
}

async function onDeleted() {
  showDelete.value = false
  deletingItem.value = null
  await fetchCarreras()
}

async function performDelete() {
  const id = deletingItem.value?.id
  if (!id) return
  try {
    await http.delete(`/admin/carreras/${id}`)
    await onDeleted()
    // replace alert with toast if available
    alert('Carrera eliminada')
  } catch (e) {
    console.error('Error deleting carrera', e)
    alert('Error eliminando la carrera')
  }
}

function loadMore() {
  if (meta.value.page * meta.value.limit >= meta.value.total) return
  page.value += 1
  // simple append strategy
  loading.value = true
  http.get('/admin/carreras', { params: { search: search.value, page: page.value, limit: limit.value } })
    .then(res => {
      items.value = items.value.concat(res.data.items || [])
      meta.value = res.data.meta || meta.value
    })
    .catch(e => { error.value = e })
    .finally(() => { loading.value = false })
}

onMounted(() => {
  // ensure only admin can be here - router guard also protects
  if (auth.user?.rol !== 'ADMIN') return
  fetchCarreras()
})

</script>

<template>
  <div class="p-6">
    <div class="flex items-center justify-between mb-6">
      <div class="flex items-center gap-3">
          <h2 class="text-2xl font-bold text-gray-800">Gestión de Carreras</h2>
          <button
            @click="goBack"
            class="ml-4 inline-flex items-center gap-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
            aria-label="Volver al dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4 text-gray-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M9.707 14.707a1 1 0 01-1.414 0L3.586 10l4.707-4.707a1 1 0 111.414 1.414L6.414 10l3.293 3.293a1 1 0 010 1.414z" clip-rule="evenodd"/><path d="M13 15a1 1 0 100-2h-1a1 1 0 100 2h1z"/></svg>
            <span>Volver</span>
          </button>
        <p class="text-sm text-gray-500">Añade, edita y elimina las carreras de la institución.</p>
      </div>

      <div class="flex items-center gap-3">
        <input v-model="search" @input="onSearchChange($event.target.value)" placeholder="Buscar por nombre o descripción..." class="border rounded-lg px-4 py-2 w-80" />
        <button @click="openCreate" class="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg">Añadir Carrera</button>
      </div>
    </div>

    <div v-if="loading" class="space-y-3">
      <div class="h-12 bg-gray-100 animate-pulse rounded"></div>
      <div class="h-12 bg-gray-100 animate-pulse rounded"></div>
      <div class="h-12 bg-gray-100 animate-pulse rounded"></div>
    </div>

    <div v-else>
      <div v-if="error" class="bg-red-50 border border-red-100 p-4 rounded mb-4">
        <p class="text-red-700">Error cargando carreras. <button @click="fetchCarreras" class="underline">Reintentar</button></p>
      </div>

      <div v-if="items.length === 0">
        <EmptyState @add="openCreate" />
      </div>

      <div v-else class="space-y-4">
        <div v-for="item in items" :key="item.id">
          <CareerItem :item="item" @edit="openEdit" @delete="confirmDelete" />
        </div>

        <div class="flex justify-center mt-6">
          <button v-if="meta.page * meta.limit < meta.total" @click="loadMore" class="px-4 py-2 bg-gray-100 rounded hover:bg-gray-200">Cargar más</button>
        </div>
      </div>
    </div>

  <CareerFormModal v-model="showForm" :initialData="editing" @saved="onSaved" />
  <ConfirmDeleteModal :visible="showDelete" :itemName="deletingItem?.nombre" @confirm="performDelete" @cancel="showDelete = false" />
  </div>
</template>

<style scoped>
.career-actions { display:flex; gap:8px }
</style>
