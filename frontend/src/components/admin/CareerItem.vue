<script setup>
import { defineProps, defineEmits } from "vue";

const props = defineProps({
  item: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["edit", "delete"]);

const onEdit = () => emit("edit", props.item);
const onDelete = () => emit("delete", props.item);
</script>

<template>
  <article
    class="flex items-start justify-between rounded-2xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100 transition hover:shadow-md hover:ring-sky-50"
  >
    <div class="min-w-0 flex-1">
      <h3 class="text-base font-semibold text-sky-500">
        {{ item.nombre }}
      </h3>

      <p v-if="item.descripcion" class="mt-1 text-sm text-slate-500">
        {{ item.descripcion }}
      </p>

      <div class="mt-4 flex flex-wrap gap-8 text-xs font-medium text-slate-500">
        <div>
          <div class="text-lg font-semibold text-slate-900">
            {{ item.totalAlumnos ?? 0 }}
          </div>
          <div class="mt-0.5">Total Alumnos</div>
        </div>

        <div>
          <div class="text-lg font-semibold text-slate-900">
            {{ item.totalProfesores ?? 0 }}
          </div>
          <div class="mt-0.5">Total Profesores</div>
        </div>

        <div>
          <div class="text-lg font-semibold text-slate-900">
            {{ item.totalMaterias ?? 0 }}
          </div>
          <div class="mt-0.5">Total Materias</div>
        </div>
      </div>
    </div>

    <div class="ml-4 flex items-start gap-3">
      <button
        type="button"
        @click="onEdit"
        aria-label="Editar carrera"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-sky-50 text-sky-600 shadow-sm hover:bg-sky-100 focus:outline-none focus:ring-2 focus:ring-sky-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            d="M14.846 3.146a1.5 1.5 0 012.122 2.122l-8.5 8.5a1.5 1.5 0 01-.53.353l-3 1a.75.75 0 01-.948-.948l1-3a1.5 1.5 0 01.353-.53l8.5-8.5z"
          />
        </svg>
      </button>

      <button
        type="button"
        @click="onDelete"
        aria-label="Eliminar carrera"
        class="inline-flex h-9 w-9 items-center justify-center rounded-full bg-red-50 text-red-500 shadow-sm hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-400"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="h-4 w-4"
          viewBox="0 0 20 20"
          fill="currentColor"
        >
          <path
            fill-rule="evenodd"
            d="M8.5 4.5a1 1 0 011-1h1a1 1 0 011 1V5h3a.75.75 0 010 1.5h-.347l-.624 8.118A1.75 1.75 0 0112.788 16H7.212a1.75 1.75 0 01-1.741-1.382L4.847 6.5H4.5A.75.75 0 014.5 5h3v-.5zm1.75 3.25a.75.75 0 10-1.5 0v5.5a.75.75 0 001.5 0v-5.5zm2.75 0a.75.75 0 10-1.5 0v5.5a.75.75 0 001.5 0v-5.5z"
            clip-rule="evenodd"
          />
        </svg>
      </button>
    </div>
  </article>
</template>