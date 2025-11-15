<script setup>
import { ref, watch, computed } from 'vue'
import http from '../../services/http'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialData: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit('update:modelValue', v)
})

const form = ref({ nombre: '', descripcion: '', activo: true })
const errors = ref({})
const saving = ref(false)

watch(() => props.initialData, (val) => {
  if (val) {
    form.value = { nombre: val.nombre || '', descripcion: val.descripcion || '', activo: val.activo ?? true }
  } else {
    form.value = { nombre: '', descripcion: '', activo: true }
  }
})

function validate() {
  errors.value = {}
  if (!form.value.nombre || form.value.nombre.trim().length < 3) {
    errors.value.nombre = 'El nombre debe tener al menos 3 caracteres.'
  }
  if (form.value.nombre && form.value.nombre.length > 120) errors.value.nombre = 'Máximo 120 caracteres.'
  if (form.value.descripcion && form.value.descripcion.length > 500) errors.value.descripcion = 'Máximo 500 caracteres.'
  return Object.keys(errors.value).length === 0
}

async function submit() {
  if (!validate()) return
  saving.value = true
  try {
    let res
    if (props.initialData && props.initialData.id) {
      res = await http.put(`/admin/carreras/${props.initialData.id}`, form.value)
    } else {
      res = await http.post('/admin/carreras', form.value)
    }
    emit('saved', res.data)
    visible.value = false
  } catch (e) {
    if (e?.response?.data) {
      const data = e.response.data
      // backend validation map
      if (data.errors) errors.value = data.errors
    }
    console.error('Error saving carrera', e)
    alert('Error al guardar: ' + (e.message || ''))
  } finally {
    saving.value = false
  }
}

function close() {
  visible.value = false
}
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white rounded-lg w-full max-w-lg p-6">
      <h3 class="text-lg font-semibold mb-4">{{ props.initialData ? 'Editar Carrera' : 'Añadir Carrera' }}</h3>

      <div class="space-y-3">
        <div>
          <label class="text-sm font-medium">Nombre</label>
          <input v-model="form.nombre" class="w-full border rounded px-3 py-2 mt-1" />
          <p v-if="errors.nombre" class="text-xs text-red-600 mt-1">{{ errors.nombre }}</p>
        </div>

        <div>
          <label class="text-sm font-medium">Descripción</label>
          <textarea v-model="form.descripcion" class="w-full border rounded px-3 py-2 mt-1" rows="4"></textarea>
          <p v-if="errors.descripcion" class="text-xs text-red-600 mt-1">{{ errors.descripcion }}</p>
        </div>

        <div class="flex items-center gap-3">
          <input type="checkbox" v-model="form.activo" id="activo" />
          <label for="activo" class="text-sm">Activo</label>
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button @click="close" class="px-4 py-2 rounded border">Cancelar</button>
        <button @click="submit" :disabled="saving" class="px-4 py-2 rounded bg-sky-500 text-white">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* simple focus trap and layout could be improved */
</style>
