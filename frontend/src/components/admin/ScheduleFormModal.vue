<script setup>
import { ref, watch, computed } from 'vue'
import http from '../../services/http'

const props = defineProps({ modelValue: { type: Boolean, default: false }, initialData: { type: Object, default: null } })
const emit = defineEmits(['update:modelValue', 'saved'])

const visible = computed({ get: () => props.modelValue, set: (v) => emit('update:modelValue', v) })

const form = ref({ asignatura: '', profesor: '', horario: '', carrera: '' })
const saving = ref(false)

watch(() => props.initialData, (val) => {
  if (val) form.value = { asignatura: val.asignatura || '', profesor: val.profesor || '', horario: formatForInput(val.horario), carrera: val.carrera || '' }
  else form.value = { asignatura: '', profesor: '', horario: '', carrera: '' }
})

function formatForInput(dateLike) {
  if (!dateLike) return ''
  // try to parse ISO or date-like strings
  const d = new Date(dateLike)
  if (isNaN(d.getTime())) return ''
  const pad = (n) => n.toString().padStart(2, '0')
  const yyyy = d.getFullYear()
  const mm = pad(d.getMonth() + 1)
  const dd = pad(d.getDate())
  const hh = pad(d.getHours())
  const min = pad(d.getMinutes())
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`
}

function validate() {
  if (!form.value.asignatura || form.value.asignatura.trim().length < 2) return false
  if (!form.value.horario) return false
  // ensure horario is a valid datetime-local value
  const d = new Date(form.value.horario)
  if (isNaN(d.getTime())) return false
  return true
}

async function submit() {
  if (!validate()) return alert('Nombre de asignatura inválido')
  saving.value = true
  try {
    let payload = { ...form.value }
    // convert horario (datetime-local) to ISO string for API
    try {
      payload.horario = new Date(form.value.horario).toISOString()
    } catch (e) {
      // keep as-is
    }
    let res
    if (props.initialData && props.initialData.id) res = await http.put(`/admin/horarios/${props.initialData.id}`, payload)
    else res = await http.post('/admin/horarios', payload)
    emit('saved', res.data)
    visible.value = false
  } catch (e) {
    console.error('Error saving horario', e)
    alert('Error al guardar horario')
  } finally { saving.value = false }
}

function close() { visible.value = false }
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-30">
    <div class="bg-white rounded-lg w-full max-w-lg p-6">
      <h3 class="text-lg font-semibold mb-4">{{ props.initialData ? 'Editar Horario' : 'Añadir Nuevo Horario' }}</h3>
      <div class="space-y-3">
        <div>
          <label class="text-sm">Asignatura</label>
          <input v-model="form.asignatura" class="w-full border rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label class="text-sm">Profesor</label>
          <input v-model="form.profesor" class="w-full border rounded px-3 py-2 mt-1" />
        </div>
        <div>
          <label class="text-sm">Horario</label>
          <input type="datetime-local" v-model="form.horario" class="w-full border rounded px-3 py-2 mt-1" />
          <p class="text-xs text-gray-500 mt-1">Seleccione fecha y hora. No se acepta texto libre.</p>
        </div>
        <div>
          <label class="text-sm">Carrera</label>
          <input v-model="form.carrera" class="w-full border rounded px-3 py-2 mt-1" />
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <button @click="close" class="px-4 py-2 rounded border">Cancelar</button>
        <button @click="submit" :disabled="saving" class="px-4 py-2 rounded bg-sky-500 text-white">{{ saving ? 'Guardando...' : 'Guardar' }}</button>
      </div>
    </div>
  </div>
</template>
