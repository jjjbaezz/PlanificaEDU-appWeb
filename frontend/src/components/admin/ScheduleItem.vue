<script setup>
import { defineProps, defineEmits } from 'vue'
const props = defineProps({ item: { type: Object, required: true } })
const emit = defineEmits(['edit','delete'])

function onEdit() { emit('edit', props.item) }
function onDelete() { emit('delete', props.item) }
</script>

<template>
  <tr>
    <td class="px-4 py-4">{{ item.asignatura }}</td>
    <td class="px-4 py-4">{{ item.profesor }}</td>
    <td class="px-4 py-4">{{ item.horario }}</td>
    <td class="px-4 py-4">{{ item.carrera }}</td>
    <td class="px-4 py-4 text-right">
      <div class="flex items-center justify-end gap-3">
        <button @click="onEdit" class="px-2 py-1 text-sky-600 bg-sky-50 rounded">✏️</button>
        <button @click="onDelete" class="px-2 py-1 text-red-600 bg-red-50 rounded">🗑️</button>
      </div>
    </td>
  </tr>
</template>
