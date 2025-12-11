<script setup>
import { ref, watch, computed } from "vue";
import careersService from "../../services/careers";
import http from "../../services/http";

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  initialData: { type: Object, default: null },
});

const emit = defineEmits(["update:modelValue", "saved"]);

const visible = computed({
  get: () => props.modelValue,
  set: (v) => emit("update:modelValue", v),
});

const form = ref({
  codigo: "",
  nombre: "",
  descripcion: "",
  activo: true,
});

const errors = ref({});
const saving = ref(false);

const isEdit = computed(() => !!(props.initialData && props.initialData.id));

const professors = ref([]);
const subjects = ref([]);

const selectedProfessorIds = ref([]);
const selectedSubjectIds = ref([]);

const professorsOpen = ref(false);
const subjectsOpen = ref(false);
const professorsQuery = ref("");
const subjectsQuery = ref("");

const selectedProfessors = computed(() =>
  professors.value.filter((p) => selectedProfessorIds.value.includes(p.id))
);

const selectedSubjects = computed(() =>
  subjects.value.filter((s) => selectedSubjectIds.value.includes(s.id))
);

const filteredProfessors = computed(() => {
  const q = professorsQuery.value.trim().toLowerCase();
  return professors.value.filter((p) => {
    const notSelected = !selectedProfessorIds.value.includes(p.id);
    if (!q) return notSelected;
    return (
      notSelected &&
      String(p.nombre || "")
        .toLowerCase()
        .includes(q)
    );
  });
});

const filteredSubjects = computed(() => {
  const q = subjectsQuery.value.trim().toLowerCase();
  return subjects.value.filter((s) => {
    const notSelected = !selectedSubjectIds.value.includes(s.id);
    if (!q) return notSelected;
    return (
      notSelected &&
      (String(s.nombre || "")
        .toLowerCase()
        .includes(q) ||
        String(s.codigo || "")
          .toLowerCase()
          .includes(q))
    );
  });
});

async function fetchProfessors() {
  try {
    const res = await http.get("/professors");
    professors.value = res.data?.data ?? res.data ?? [];
  } catch (e) {
    console.error("Error obteniendo profesores", e);
  }
}

async function fetchSubjects() {
  try {
    const res = await http.get("/subjects", { params: { limit: 1000 } });
    const raw = res.data;
    subjects.value = raw?.items ?? raw?.data ?? raw?.subjects ?? raw ?? [];
  } catch (e) {
    console.error("Error obteniendo materias", e);
  }
}

function ensureLookupsLoaded() {
  const promises = [];
  if (!professors.value.length) promises.push(fetchProfessors());
  if (!subjects.value.length) promises.push(fetchSubjects());
  return Promise.all(promises);
}

function addProfessor(prof) {
  if (!prof?.id) return;
  if (!selectedProfessorIds.value.includes(prof.id)) {
    selectedProfessorIds.value = [...selectedProfessorIds.value, prof.id];
  }
}

function removeProfessor(id) {
  selectedProfessorIds.value = selectedProfessorIds.value.filter(
    (pId) => pId !== id
  );
}

function addSubject(subject) {
  if (!subject?.id) return;
  if (!selectedSubjectIds.value.includes(subject.id)) {
    selectedSubjectIds.value = [...selectedSubjectIds.value, subject.id];
  }
}

function removeSubject(id) {
  selectedSubjectIds.value = selectedSubjectIds.value.filter(
    (sId) => sId !== id
  );
}

function closeAllDropdowns() {
  professorsOpen.value = false;
  subjectsOpen.value = false;
}

watch(
  () => props.initialData,
  (val) => {
    if (val) {
      form.value = {
        nombre: val.nombre || "",
        descripcion: val.descripcion || "",
        activo: val.activo ?? true,
      };

      selectedProfessorIds.value =
        (val.profesores_ids ||
          val.professors_ids ||
          (Array.isArray(val.profesores)
            ? val.profesores.map((p) => p.id ?? p.profesor_id)
            : [])) ??
        [];

      selectedSubjectIds.value =
        (val.materias_ids ||
          val.subjects_ids ||
          (Array.isArray(val.materias)
            ? val.materias.map((m) => m.id ?? m.materia_id)
            : [])) ??
        [];
    } else {
      form.value = { nombre: "", descripcion: "", activo: true };
      selectedProfessorIds.value = [];
      selectedSubjectIds.value = [];
    }
  },
  { immediate: true }
);

watch(visible, async (isOpen) => {
  if (isOpen) {
    await ensureLookupsLoaded();
  } else {
    closeAllDropdowns();
    professorsQuery.value = "";
    subjectsQuery.value = "";
  }
});

function validate() {
  errors.value = {};

  if (!form.value.codigo || form.value.codigo.trim().length < 2) {
    errors.value.codigo = "El código debe tener al menos 2 caracteres.";
  } else if (form.value.codigo.length > 20) {
    errors.value.codigo = "Máximo 20 caracteres.";
  }

  if (!form.value.nombre || form.value.nombre.trim().length < 3) {
    errors.value.nombre = "El nombre debe tener al menos 3 caracteres.";
  } else if (form.value.nombre.length > 120) {
    errors.value.nombre = "Máximo 120 caracteres.";
  }

  if (form.value.descripcion && form.value.descripcion.length > 500) {
    errors.value.descripcion = "Máximo 500 caracteres.";
  }

  if (!selectedSubjectIds.value.length) {
    errors.value.materias = "Selecciona al menos una materia.";
  }

  return Object.keys(errors.value).length === 0;
}

async function submit() {
  if (!validate()) return;
  saving.value = true;

  const payload = {
    codigo: form.value.codigo,
    nombre: form.value.nombre,
    descripcion: form.value.descripcion,
    activo: form.value.activo,
    profesores_ids: selectedProfessorIds.value,
    materias_ids: selectedSubjectIds.value,
  };

  try {
    let res;
    if (isEdit.value) {
      res = await careersService.updateCareer(props.initialData.id, payload);
    } else {
      res = await careersService.createCareer(payload);
    }
    emit("saved", res.data);
    visible.value = false;
  } catch (e) {
    if (e?.response?.data?.errors) {
      errors.value = e.response.data.errors;
    }
    console.error("Error saving carrera", e);
    alert("Error al guardar: " + (e.message || ""));
  } finally {
    saving.value = false;
  }
}

function close() {
  if (saving.value) return;
  visible.value = false;
}
</script>

<template>
  <transition name="fade">
    <div
      v-if="visible"
      class="fixed inset-0 z-50 overflow-y-auto bg-slate-50"
      @click="closeAllDropdowns"
    >
      <div
        class="flex min-h-screen items-center justify-center px-4 py-10 sm:px-6 lg:px-8"
      >
        <div
          class="w-full max-w-xl 3xl:max-w-4xl rounded-3xl bg-white px-6 py-8 shadow-xl sm:px-10 sm:py-10"
          @click.stop
        >
          <header class="mb-8">
            <h2 class="text-3xl font-bold text-slate-900">
              {{ isEdit ? "Editar Carrera" : "Crear Nueva Carrera" }}
            </h2>
            <p class="mt-2 text-sm text-slate-500">
              Completa el formulario a continuación para
              {{
                isEdit
                  ? "actualizar la información de la carrera."
                  : "agregar una nueva carrera al sistema."
              }}
            </p>
          </header>

          <div class="space-y-7">
                        <div>
                          <label
                            for="codigo"
                            class="block text-sm font-semibold text-slate-700"
                          >
                            Código de la carrera
                          </label>
                          <input
                            id="codigo"
                            v-model="form.codigo"
                            type="text"
                            placeholder="Ej: INF"
                            class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                          />
                          <p v-if="errors.codigo" class="mt-1 text-xs text-red-500">
                            {{ errors.codigo }}
                          </p>
                        </div>
            <div>
              <label
                for="nombre"
                class="block text-sm font-semibold text-slate-700"
              >
                Nombre de la carrera
              </label>
              <input
                id="nombre"
                v-model="form.nombre"
                type="text"
                placeholder="Ej: Ingeniería de Software"
                class="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-900 placeholder:text-slate-400 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
              <p v-if="errors.nombre" class="mt-1 text-xs text-red-500">
                {{ errors.nombre }}
              </p>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-slate-700">
                Profesores asignados a esa carrera
              </label>

              <div class="relative">
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-500 hover:border-sky-300 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  @click.stop="
                    professorsOpen = !professorsOpen;
                    subjectsOpen = false;
                  "
                >
                  <span> Buscar y seleccionar profesores... </span>
                  <svg
                    class="h-4 w-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  v-if="professorsOpen"
                  class="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-slate-200 bg-white shadow-lg"
                >
                  <div class="p-2 border-b border-slate-100">
                    <input
                      v-model="professorsQuery"
                      type="text"
                      placeholder="Buscar profesor..."
                      class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-200"
                    />
                  </div>
                  <ul class="max-h-52 overflow-y-auto py-1 text-sm">
                    <li v-for="prof in filteredProfessors" :key="prof.id">
                      <button
                        type="button"
                        class="flex w-full items-center justify-between px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                        @click="addProfessor(prof)"
                      >
                        <span>{{ prof.nombre }}</span>
                      </button>
                    </li>
                    <li
                      v-if="!filteredProfessors.length"
                      class="px-4 py-2 text-xs text-slate-400"
                    >
                      No hay resultados.
                    </li>
                  </ul>
                </div>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="prof in selectedProfessors"
                  :key="prof.id"
                  type="button"
                  class="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-500"
                >
                  <span>{{ prof.nombre }}</span>
                  <span
                    class="ml-2 cursor-pointer text-xs"
                    @click.stop="removeProfessor(prof.id)"
                  >
                    ×
                  </span>
                </button>

                <p
                  v-if="!selectedProfessors.length"
                  class="text-xs text-slate-400"
                >
                  No hay profesores seleccionados.
                </p>
              </div>
            </div>

            <div class="space-y-2">
              <label class="block text-sm font-semibold text-slate-700">
                Materias de esa carrera
              </label>

              <div class="relative">
                <button
                  type="button"
                  class="flex w-full items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left text-sm text-slate-500 hover:border-sky-300 focus:border-sky-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-200"
                  @click.stop="
                    subjectsOpen = !subjectsOpen;
                    professorsOpen = false;
                  "
                >
                  <span> Buscar y seleccionar materias... </span>
                  <svg
                    class="h-4 w-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                <div
                  v-if="subjectsOpen"
                  class="absolute left-0 right-0 z-20 mt-2 rounded-2xl border border-slate-200 bg-white shadow-lg"
                >
                  <div class="p-2 border-b border-slate-100">
                    <input
                      v-model="subjectsQuery"
                      type="text"
                      placeholder="Buscar materia..."
                      class="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-800 placeholder:text-slate-400 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-200"
                    />
                  </div>
                  <ul class="max-h-52 overflow-y-auto py-1 text-sm">
                    <li v-for="subject in filteredSubjects" :key="subject.id">
                      <button
                        type="button"
                        class="flex w-full items-center justify-between px-4 py-2 text-left text-slate-700 hover:bg-slate-50"
                        @click="addSubject(subject)"
                      >
                        <span>
                          {{ subject.codigo ? subject.codigo + " · " : "" }}
                          {{ subject.nombre }}
                        </span>
                      </button>
                    </li>
                    <li
                      v-if="!filteredSubjects.length"
                      class="px-4 py-2 text-xs text-slate-400"
                    >
                      No hay resultados.
                    </li>
                  </ul>
                </div>
              </div>

              <div class="mt-2 flex flex-wrap gap-2">
                <button
                  v-for="subject in selectedSubjects"
                  :key="subject.id"
                  type="button"
                  class="inline-flex items-center rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-sky-500"
                >
                  <span>
                    {{ subject.codigo ? subject.codigo + " · " : "" }}
                    {{ subject.nombre }}
                  </span>
                  <span
                    class="ml-2 cursor-pointer text-xs"
                    @click.stop="removeSubject(subject.id)"
                  >
                    ×
                  </span>
                </button>

                <p
                  v-if="!selectedSubjects.length"
                  class="text-xs text-slate-400"
                >
                  No hay materias seleccionadas.
                </p>
              </div>

              <p v-if="errors.materias" class="mt-1 text-xs text-red-500">
                {{ errors.materias }}
              </p>
            </div>
          </div>

          <div class="mt-10 flex items-center justify-end gap-6">
            <button
              type="button"
              class="text-sm font-medium text-slate-500 hover:text-slate-700"
              @click="close"
            >
              Cancelar
            </button>
            <button
              type="button"
              :disabled="saving"
              @click="submit"
              class="inline-flex items-center rounded-xl bg-sky-400 px-7 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{
                saving
                  ? "Guardando..."
                  : isEdit
                    ? "Guardar Cambios"
                    : "Crear Carrera"
              }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </transition>
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