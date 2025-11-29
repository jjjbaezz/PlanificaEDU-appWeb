<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({ item: { type: Object, required: true } })
const emit = defineEmits(['edit', 'delete'])

function onEdit() { emit('edit', props.item) }
function onDelete() { emit('delete', props.item) }
</script>

<template>
  <div class="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
    <div>
      <h4 class="font-semibold text-gray-800">{{ item.nombre }}</h4>
      <p class="text-sm text-gray-500">{{ item.descripcion }}</p>
      <div class="flex gap-4 mt-3 text-sm text-gray-600">
        <div><span class="font-bold text-gray-800">{{ item.totalAlumnos ?? 0 }}</span> Total Alumnos</div>
        <div><span class="font-bold text-gray-800">{{ item.totalProfesores ?? 0 }}</span> Total Profesores</div>
      </div>
    </div>

    <div class="flex items-center gap-3">
      <button @click="onEdit" class="px-3 py-2 bg-sky-100 text-sky-600 rounded">Editar</button>
      <button @click="onDelete" class="px-3 py-2 bg-red-50 text-red-600 rounded">Eliminar</button>
    </div>
  </div>
</template>
