<script setup>
import { reactive, computed, watch } from "vue";

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  initialData: {
    type: Object,
    default: () => null,
  },
});

const emit = defineEmits(["update:open", "save", "cancel"]);

const prereqOptions = [
  "Precálculo MAT-101",
  "Contabilidad Financiera MAT-121",
  "Introducción a la Programación CS-101",
  "Estructuras de Datos CS-205",
  "Sistemas Operativos SO-302",
];

const desbloqueaOptions = [
  "Calculo Intermedio MAT-201",
  "Calculo Vectorial MAT-401",
];

const form = reactive({
  nombre: "",
  codigo: "",
  creditos: "",
  carrera: "",
  tipo: "",
  prerequisitos: "",
  desbloquea: "",
});

const isEditing = computed(() => !!props.initialData);

watch(
  () => props.initialData,
  (val) => {
    form.nombre = val?.nombre ?? "";
    form.codigo = val?.codigo ?? "";
    form.creditos = val?.creditos ?? "";
    form.carrera = val?.carrera ?? "";
    form.tipo = val?.tipo ?? "";

    form.prerequisitos = Array.isArray(val?.prerequisitos)
      ? (val.prerequisitos[0] ?? "")
      : (val?.prerequisitos ?? "");

    form.desbloquea = val?.desbloquea ?? "";
  },
  { immediate: true }
);

const title = computed(() => {
  const base = isEditing.value ? "Editar Materia" : "Crear Materia";
  return form.nombre ? `${base}: ${form.nombre}` : base;
});

function close() {
  emit("update:open", false);
  emit("cancel");
}

function handleSave() {
  emit("save", {
    ...props.initialData,
    ...form,
    prerequisitos: form.prerequisitos
      ? [form.prerequisitos]
      : (props.initialData?.prerequisitos ?? []),
    desbloquea: form.desbloquea || props.initialData?.desbloquea || "",
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
          class="w-full max-w-5xl rounded-[28px] bg-white py-10 px-8 md:px-10 shadow-xl"
        >
          <nav class="mb-4 text-xs font-medium text-slate-400 space-x-1">
            <span class="cursor-pointer hover:text-slate-600"
              >Planificación</span
            >
            <span>/</span>
            <span class="cursor-pointer hover:text-slate-600">Materias</span>
            <span>/</span>
            <span class="text-slate-500">
              {{ isEditing ? "Editar" : "Crear" }}
            </span>
          </nav>

          <h2
            class="mb-8 text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900"
          >
            {{ title }}
          </h2>

          <form class="space-y-6" @submit.prevent="handleSave">
            <div
              class="grid grid-cols-1 gap-6 md:grid-cols-2 md:gap-x-8 md:gap-y-6"
            >
              <div class="md:col-span-2">
                <label
                  for="nombre"
                  class="mb-2 block text-sm font-semibold text-slate-800"
                  >Nombre de la materia</label
                >
                <input
                  id="nombre"
                  v-model="form.nombre"
                  type="text"
                  class="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="Ej. Cálculo Avanzado"
                />
              </div>

              <div>
                <label
                  for="codigo"
                  class="mb-2 block text-sm font-semibold text-slate-800"
                  >Código de la materia</label
                >
                <input
                  id="codigo"
                  v-model="form.codigo"
                  type="text"
                  class="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="Ej. MAT-201"
                />
              </div>

              <div>
                <label
                  for="creditos"
                  class="mb-2 block text-sm font-semibold text-slate-800"
                  >Créditos</label
                >
                <input
                  id="creditos"
                  v-model="form.creditos"
                  type="number"
                  min="0"
                  class="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  placeholder="Ej. 5"
                />
              </div>

              <div>
                <label
                  for="carrera"
                  class="mb-2 block text-sm font-semibold text-slate-800"
                  >Carrera a la que pertenece</label
                >
                <div class="relative">
                  <select
                    id="carrera"
                    v-model="form.carrera"
                    class="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="">Selecciona una carrera</option>
                    <option>Ingeniería de Software</option>
                    <option>Diseño Gráfico Digital</option>
                    <option>Administración de Empresas</option>
                  </select>
                  <span
                    class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sky-400"
                  >
                    ↑↓
                  </span>
                </div>
              </div>

              <div>
                <label
                  for="tipo"
                  class="mb-2 block text-sm font-semibold text-slate-800"
                  >Tipo</label
                >
                <div class="relative">
                  <select
                    id="tipo"
                    v-model="form.tipo"
                    class="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="">Selecciona un tipo</option>
                    <option>Presencial</option>
                    <option>Virtual</option>
                    <option>Híbrido</option>
                  </select>
                  <span
                    class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sky-400"
                  >
                    ↑↓
                  </span>
                </div>
              </div>

              <div>
                <label
                  for="prerequisitos"
                  class="mb-2 block text-sm font-semibold text-slate-800"
                  >Prerrequisitos</label
                >
                <div class="relative">
                  <select
                    id="prerequisitos"
                    v-model="form.prerequisitos"
                    class="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="">Selecciona un prerequisito</option>
                    <option
                      v-for="opt in prereqOptions"
                      :key="opt"
                      :value="opt"
                    >
                      {{ opt }}
                    </option>
                  </select>

                  <span
                    class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sky-400"
                  >
                    ↑↓
                  </span>
                </div>
              </div>

              <div>
                <label
                  for="desbloquea"
                  class="mb-2 block text-sm font-semibold text-slate-800"
                  >Desbloquea</label
                >
                <div class="relative">
                  <select
                    id="desbloquea"
                    v-model="form.desbloquea"
                    class="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                  >
                    <option value="">Selecciona una opción</option>
                    <option
                      v-for="opt in desbloqueaOptions"
                      :key="opt"
                      :value="opt"
                    >
                      {{ opt }}
                    </option>
                  </select>

                  <span
                    class="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sky-400"
                  >
                    ↑↓
                  </span>
                </div>
              </div>
            </div>

            <div
              class="mt-8 flex flex-col items-stretch justify-end gap-4 border-t border-slate-100 pt-6 md:flex-row"
            >
              <button
                type="button"
                class="rounded-full px-6 py-2.5 text-sm font-semibold text-slate-500 hover:bg-slate-50"
                @click="close"
              >
                Cancelar
              </button>
              <button
                type="submit"
                class="rounded-full bg-sky-500 px-8 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-colors hover:bg-sky-600"
              >
                Guardar Cambios
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