<script setup>
import { reactive, watch, computed } from "vue";

const props = defineProps({
  open: { type: Boolean, default: false },
  initialData: { type: Object, default: () => null },
  entityType: {
    type: String,
    default: "aula",
  },
  buildingOptions: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(["update:open", "save", "cancel"]);

const form = reactive({
  nombre: "",
  edificioId: "",
});

watch(
  () => props.initialData,
  (val) => {
    form.nombre = val?.nombre ?? "";
    form.edificioId = val?.edificioId ?? "";
  },
  { immediate: true }
);

const isAula = computed(() => props.entityType === "aula");

const title = computed(() =>
  isAula.value ? "Crear Nueva Aula" : "Crear Nuevo Edificio"
);

const description = computed(() =>
  isAula.value
    ? "Completa los siguientes campos para registrar un nuevo espacio."
    : "Completa los siguientes campos para registrar un nuevo edificio."
);

function close() {
  emit("update:open", false);
  emit("cancel");
}

function handleSubmit() {
  emit("save", {
    ...props.initialData,
    nombre: form.nombre.trim(),
    edificioId: isAula.value ? form.edificioId : null,
  });
  emit("update:open", false);
}
</script>

<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="open"
        class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4"
      >
        <div
          class="w-full max-w-md rounded-[28px] bg-white px-8 py-8 shadow-xl md:px-10"
        >
          <div class="text-center mb-8">
            <h2 class="text-2xl font-extrabold text-slate-900">
              {{ title }}
            </h2>
            <p class="mt-2 text-sm text-slate-500 leading-relaxed">
              {{ description }}
            </p>
          </div>

          <form class="space-y-5" @submit.prevent="handleSubmit">
            <div>
              <label
                for="nombre"
                class="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                {{ isAula ? "Nombre del Aula" : "Nombre del Edificio" }}
              </label>
              <input
                id="nombre"
                v-model="form.nombre"
                type="text"
                :placeholder="
                  isAula
                    ? 'Ej: 1-A o Laboratorio de Cómputo'
                    : 'Ej: Edificio Central'
                "
                class="w-full rounded-full border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-300"
              />
            </div>

            <div v-if="isAula">
              <label
                for="edificio"
                class="mb-1.5 block text-sm font-semibold text-slate-800"
              >
                Edificio Asignado
              </label>
              <div class="relative">
                <select
                  id="edificio"
                  v-model="form.edificioId"
                  class="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                >
                  <option value="">Selecciona un edificio</option>
                  <option
                    v-for="b in buildingOptions"
                    :key="b.id"
                    :value="b.id"
                  >
                    {{ b.nombre }}
                  </option>
                </select>
                <span
                  class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                >
                  <svg
                    class="h-4 w-4"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  >
                    <path d="M6 9l6 6 6-6" />
                  </svg>
                </span>
              </div>
            </div>

            <div class="mt-6 space-y-3">
              <button
                type="submit"
                class="flex w-full items-center justify-center rounded-full bg-sky-500 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-colors hover:bg-sky-600"
              >
                {{ isAula ? "Crear Aula" : "Crear Edificio" }}
              </button>

              <button
                type="button"
                class="flex w-full items-center justify-center rounded-full bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-600 hover:bg-slate-200"
                @click="close"
              >
                Cancelar
              </button>
            </div>
          </form>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.18s ease-out;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>