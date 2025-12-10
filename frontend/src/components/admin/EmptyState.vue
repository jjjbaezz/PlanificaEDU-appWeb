<script setup>
import { defineEmits } from "vue";
const emit = defineEmits(["add"]);
</script>

<template>
  <div
    class="border-dashed border-2 border-gray-200 rounded-lg p-10 text-center"
  >
    <div class="mb-4 flex flex-col items-center justify-center">
      <div class="rounded-full p-3 bg-gray-200">
        <img
          src="/src/assets/imgs/menuImgs/CarrerasIcon.svg"
          alt="scholar hat"
          class="size-8"
        />
      </div>
    </div>
    <h4 class="text-lg font-semibold">No hay carreras creadas</h4>
    <p class="text-sm text-gray-500 mt-2">
      Comienza añadiendo la primera carrera para gestionarlas.
    </p>
    <div class="mt-4">
      <button
        @click="$emit('add')"
        class="bg-sky-400 text-white px-4 py-2 rounded-xl hover:bg-sky-600"
      >
        Añadir tu primera carrera
      </button>
    </div>
  </div>
</template>