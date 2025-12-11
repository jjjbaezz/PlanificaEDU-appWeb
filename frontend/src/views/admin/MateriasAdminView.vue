<script setup>
import { ref, computed } from "vue";
import Sidebar from "../../components/Sidebar.vue";
import { useAuthStore } from "../../stores/auth";
import SubjectFormModal from "../../components/admin/SubjectFormModal.vue";

const auth = useAuthStore();

const search = ref("");
const tipoFilter = ref("Todos");
const semestreFilter = ref("Todos");

const materias = ref([
  {
    id: 1,
    nombre: "Cálculo Diferencial",
    codigo: "MAT-101",
    creditos: 5,
    carrera: "Ingeniería de Software",
    tipo: "Presencial",
    semestre: "1",
    icon: "math",
    prerequisitos: ["Precálculo MAT-101", "Contabilidad Financiera MAT-121"],
    desbloquea: "Calculo Intermedio MAT-201",
  },
  {
    id: 2,
    nombre: "Programación Orientada a Objetos",
    codigo: "CS-203",
    creditos: 4,
    carrera: "Ingeniería de Software",
    tipo: "Presencial",
    semestre: "2",
    icon: "code",
    prerequisitos: ["Introducción a la Programación CS-101"],
  },
  {
    id: 3,
    nombre: "Bases de Datos I",
    codigo: "DB-301",
    creditos: 4,
    carrera: "Ingeniería de Software",
    tipo: "Presencial",
    semestre: "3",
    icon: "db",
    prerequisitos: ["Estructuras de Datos CS-205"],
  },
  {
    id: 4,
    nombre: "Redes de Computadoras",
    codigo: "NET-405",
    creditos: 3,
    carrera: "Ingeniería de Software",
    tipo: "Presencial",
    semestre: "4",
    icon: "network",
    prerequisitos: ["Sistemas Operativos SO-302"],
  },
]);

const selectedMateria = ref(materias.value[0] || null);

const nombre = computed(
  () => auth.user?.nombre || auth.user?.name || "Nombre Admin"
);
const role = computed(() => auth.user?.rol || auth.user?.role || "ADMIN");

const tipoOptions = ["Todos", "Presencial", "Virtual", "Híbrido"];
const semestreOptions = ["Todos", "1", "2", "3", "4", "5", "6"];

const filteredMaterias = computed(() => {
  let list = materias.value;

  if (search.value.trim()) {
    const q = search.value.toLowerCase();
    list = list.filter(
      (m) =>
        m.nombre.toLowerCase().includes(q) || m.codigo.toLowerCase().includes(q)
    );
  }

  if (tipoFilter.value !== "Todos") {
    list = list.filter((m) => m.tipo === tipoFilter.value);
  }

  if (semestreFilter.value !== "Todos") {
    list = list.filter((m) => m.semestre === semestreFilter.value);
  }

  return list;
});

function selectMateria(materia) {
  selectedMateria.value = materia;
}
const showForm = ref(false);
const editingMateria = ref(null);

function onAddMateria() {
  editingMateria.value = null;
  showForm.value = true;
}

function onEditMateria(materia) {
  editingMateria.value = materia;
  showForm.value = true;
}

function handleSaveMateria(payload) {
  console.log("Materia guardada (demo):", payload);
}

function onDeleteMateria(materia) {
  alert(`Acción de eliminar: ${materia.nombre} (solo diseño).`);
}
</script>

<template>
  <Sidebar>
    <div class="min-h-screen bg-slate-50">
      <header
        class="sticky top-0 z-20 border-b border-gray-200 bg-white shadow-sm"
      >
        <div
          class="mx-auto flex max-w-7xl items-center justify-end px-4 py-6 sm:px-6 lg:px-8"
        >
          <div class="flex items-center gap-4">
            <button
              type="button"
              class="rounded-lg p-2 transition-colors hover:bg-gray-100"
            >
              <svg
                class="h-6 w-6 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                />
              </svg>
            </button>
            <div
              class="flex h-10 w-10 items-center justify-center rounded-full bg-orange-200 text-sm font-bold text-orange-700"
            >
              {{ nombre?.[0] || "A" }}{{ nombre?.split(" ")?.[1]?.[0] || "" }}
            </div>
            <div>
              <p class="text-sm font-bold text-gray-900">
                {{ nombre }}
              </p>
              <p class="mt-1 text-sm text-gray-500">
                {{ role }}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main class="mx-auto max-w-7xl p-6 md:p-8">
        <div
          class="grid gap-8 lg:grid-cols-[minmax(0,2.2fr)_minmax(320px,1fr)] xl:gap-10"
        >
          <section>
            <div
              class="mb-6 flex flex-col gap-4 md:mb-8 md:flex-row md:items-center md:justify-between"
            >
              <div>
                <h1 class="text-3xl font-extrabold text-slate-900">
                  Materias para Ingeniería de Software
                </h1>
                <p class="mt-2 text-sm text-slate-500">
                  Gestiona las materias del programa académico.
                </p>
              </div>

              <div class="flex justify-start md:justify-end">
                <button
                  type="button"
                  @click="onAddMateria"
                  class="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-7 py-2 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-colors hover:bg-sky-600"
                >
                  <span class="text-lg leading-none">+</span>
                  <span>Añadir Nueva Materia</span>
                </button>
              </div>
            </div>

            <div
              class="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"
            >
              <div class="flex-1">
                <div class="relative w-full">
                  <svg
                    class="pointer-events-none absolute left-4 top-3.5 h-4 w-4 text-slate-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke-linecap="round"
                      stroke-linejoin="round"
                      stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    v-model="search"
                    type="text"
                    placeholder="Buscar por nombre o código..."
                    class="w-full rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-4 text-sm text-slate-900 shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-3">
                <div class="relative">
                  <button
                    type="button"
                    class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-sky-300 hover:text-sky-600"
                  >
                    <span>Tipo</span>
                    <svg
                      class="h-4 w-4"
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
                  <select
                    v-model="tipoFilter"
                    class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  >
                    <option
                      v-for="tipo in tipoOptions"
                      :key="tipo"
                      :value="tipo"
                    >
                      {{ tipo }}
                    </option>
                  </select>
                </div>

                <div class="relative">
                  <button
                    type="button"
                    class="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:border-sky-300 hover:text-sky-600"
                  >
                    <span>Semestre</span>
                    <svg
                      class="h-4 w-4"
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
                  <select
                    v-model="semestreFilter"
                    class="absolute inset-0 h-full w-full cursor-pointer opacity-0"
                  >
                    <option
                      v-for="sem in semestreOptions"
                      :key="sem"
                      :value="sem"
                    >
                      {{ sem === "Todos" ? "Todos" : `Semestre ${sem}` }}
                    </option>
                  </select>
                </div>
              </div>
            </div>

            <div class="mt-6 space-y-4">
              <div
                v-for="materia in filteredMaterias"
                :key="materia.id"
                @click="selectMateria(materia)"
                :class="[
                  'flex cursor-pointer items-center justify-between rounded-xl px-6 py-5 shadow-[0_10px_25px_rgba(15,23,42,0.02)] transition-all bg-white',
                  selectedMateria && selectedMateria.id === materia.id
                    ? 'border-2 border-sky-400 shadow-[0_18px_40px_rgba(56,189,248,0.25)]'
                    : 'border border-transparent hover:-translate-y-0.5 hover:border-sky-200 hover:shadow-[0_18px_40px_rgba(15,23,42,0.05)]',
                ]"
              >
                <div class="flex items-center gap-4">
                  <div
                    :class="[
                      'flex h-12 w-12 items-center justify-center rounded-2xl',
                      selectedMateria && selectedMateria.id === materia.id
                        ? 'bg-sky-50'
                        : 'bg-slate-50',
                    ]"
                  >
                    <svg
                      v-if="materia.icon === 'math'"
                      :class="[
                        'h-6 w-6',
                        selectedMateria && selectedMateria.id === materia.id
                          ? 'text-sky-500'
                          : 'text-slate-400',
                      ]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M15 5H9l4 7-4 7h6" />
                    </svg>

                    <svg
                      v-else-if="materia.icon === 'code'"
                      :class="[
                        'h-6 w-6',
                        selectedMateria && selectedMateria.id === materia.id
                          ? 'text-sky-500'
                          : 'text-slate-400',
                      ]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M9 18L3 12l6-6" />
                      <path d="M15 6l6 6-6 6" />
                    </svg>

                    <svg
                      v-else-if="materia.icon === 'db'"
                      :class="[
                        'h-6 w-6',
                        selectedMateria && selectedMateria.id === materia.id
                          ? 'text-sky-500'
                          : 'text-slate-400',
                      ]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <ellipse cx="12" cy="6" rx="6" ry="3" />
                      <path d="M6 6v6c0 1.66 2.69 3 6 3s6-1.34 6-3V6" />
                      <path d="M6 12v6c0 1.66 2.69 3 6 3s6-1.34 6-3v-6" />
                    </svg>

                    <svg
                      v-else-if="materia.icon === 'network'"
                      :class="[
                        'h-6 w-6',
                        selectedMateria && selectedMateria.id === materia.id
                          ? 'text-sky-500'
                          : 'text-slate-400',
                      ]"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="2"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <rect x="10" y="4" width="4" height="4" rx="1" />
                      <rect x="4" y="16" width="4" height="4" rx="1" />
                      <rect x="16" y="16" width="4" height="4" rx="1" />
                      <path d="M12 8v4" />
                      <path d="M8 16l4-4 4 4" />
                    </svg>
                  </div>

                  <div>
                    <p class="text-sm font-semibold text-slate-900">
                      {{ materia.nombre }}
                    </p>
                    <p
                      class="mt-1 text-xs font-medium uppercase tracking-wide text-slate-400"
                    >
                      {{ materia.codigo }}
                    </p>
                  </div>
                </div>

                <div class="flex items-center gap-3">
                  <button
                    type="button"
                    class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-sky-500"
                    @click.stop="onEditMateria(materia)"
                    aria-label="Editar materia"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path
                        d="M4 20l2.3-.4L17.6 8.3a1 1 0 0 0 0-1.4l-2.5-2.5a1 1 0 0 0-1.4 0L4.4 15.7 4 18v2z"
                      />
                      <path d="M14 4l3 3" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    class="rounded-full p-2 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                    @click.stop="onDeleteMateria(materia)"
                    aria-label="Eliminar materia"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="18"
                      height="18"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      stroke-width="1.6"
                      stroke-linecap="round"
                      stroke-linejoin="round"
                    >
                      <path d="M5 7h14" />
                      <path d="M10 4h4a1 1 0 0 1 1 1v2H9V5a1 1 0 0 1 1-1z" />
                      <path
                        d="M18 7l-.7 11a2 2 0 0 1-2 2H8.7a2 2 0 0 1-2-2L6 7"
                      />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              </div>

              <div
                v-if="filteredMaterias.length === 0"
                class="mt-4 rounded-3xl border border-dashed border-slate-200 bg-white px-6 py-10 text-center text-sm text-slate-500"
              >
                No se encontraron materias con los filtros actuales.
              </div>
            </div>
          </section>

          <aside>
            <div
              class="rounded-[32px] mt-10 bg-white px-7 py-7 shadow-[0_18px_40px_rgba(15,23,42,0.08)]"
            >
              <h2
                class="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400"
              >
                Detalles de la Materia
              </h2>

              <div v-if="selectedMateria" class="mt-6 space-y-6 text-sm">
                <div>
                  <p class="text-xs font-semibold text-slate-400">
                    Nombre de la materia
                  </p>
                  <p class="mt-1 text-sm font-semibold text-slate-900">
                    {{ selectedMateria.nombre }}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-400">
                    Código de la materia
                  </p>
                  <p class="mt-1 text-sm text-slate-800">
                    {{ selectedMateria.codigo }}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-400">Créditos</p>
                  <p class="mt-1 text-sm text-slate-800">
                    {{ selectedMateria.creditos }}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-400">Tipo</p>
                  <p class="mt-1 text-sm text-slate-800">
                    {{ selectedMateria.tipo }}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-400">
                    Carrera a la que pertenece
                  </p>
                  <p class="mt-1 text-sm text-slate-800">
                    {{ selectedMateria.carrera }}
                  </p>
                </div>

                <div>
                  <p class="text-xs font-semibold text-slate-400">
                    Prerrequisitos
                  </p>
                  <ul class="mt-1 space-y-1 text-sm text-slate-800">
                    <li
                      v-for="(pre, idx) in selectedMateria.prerequisitos"
                      :key="idx"
                    >
                      {{ pre }}
                    </li>
                  </ul>
                </div>
              </div>

              <div v-else class="mt-6 text-sm text-slate-500">
                Selecciona una materia de la lista para ver sus detalles.
              </div>
            </div>
          </aside>
        </div>
      </main>

      <SubjectFormModal
        v-model:open="showForm"
        :initial-data="editingMateria"
        @save="handleSaveMateria"
      />
    </div>
  </Sidebar>
</template>