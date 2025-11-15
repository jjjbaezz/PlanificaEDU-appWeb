<script setup>
import { defineEmits } from 'vue'
const emit = defineEmits(['add'])
</script>

<template>
  <div class="border-dashed border-2 border-gray-200 rounded-lg p-10 text-center">
    <div class="mb-4">
      <svg class="mx-auto h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 7h18M3 12h18M3 17h18"/></svg>
    </div>
    <h4 class="text-lg font-semibold">No hay carreras creadas</h4>
    <p class="text-sm text-gray-500 mt-2">Comienza añadiendo la primera carrera para gestionarlas.</p>
    <div class="mt-4">
      <button @click="$emit('add')" class="bg-sky-500 text-white px-4 py-2 rounded">Añadir tu primera carrera</button>
    </div>
  </div>
</template>
