<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({ visible: { type: Boolean, default: false }, itemName: { type: String, default: '' } })
const emit = defineEmits(['confirm', 'cancel'])

function doConfirm() { emit('confirm') }
function doCancel() { emit('cancel') }
</script>

<template>
  <div v-if="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
    <div class="bg-white rounded-lg w-full max-w-md p-6">
      <h3 class="text-lg font-semibold mb-2">¿Eliminar la carrera '{{ itemName }}'?</h3>
      <p class="text-sm text-gray-600">Esta acción no se puede deshacer. Si la carrera está en uso, es posible que no pueda eliminarse.</p>

      <div class="mt-6 flex justify-end gap-3">
        <button @click="doCancel" class="px-4 py-2 rounded border">Cancelar</button>
        <button @click="doConfirm" class="px-4 py-2 rounded bg-red-600 text-white">Eliminar</button>
      </div>
    </div>
  </div>
</template>
