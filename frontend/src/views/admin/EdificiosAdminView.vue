<script setup>
import { ref, computed } from "vue";
import Sidebar from "../../components/Sidebar.vue";
import CreateSpaceModal from "../../components/admin/CreateSpaceModal.vue";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();

const nombre = computed(
  () => auth.user?.nombre || auth.user?.name || "Nombre Admin"
);
const role = computed(
  () => auth.user?.rol || auth.user?.role || "Administrador"
);

const searchEdificio = ref("");
const searchAula = ref("");

const edificios = ref([
  { id: 1, nombre: "Edificio Principal", aulas: 15 },
  { id: 2, nombre: "Anexo de Ingeniería", aulas: 10 },
]);

const aulas = ref([
  { id: 1, nombre: "Aula Magna", edificio: "Edificio Principal" },
  {
    id: 2,
    nombre: "Laboratorio de Cómputo 1",
    edificio: "Anexo de Ingeniería",
  },
  { id: 3, nombre: "Salón 201-B", edificio: "Edificio Principal" },
]);

const showCreateAula = ref(false);
const showCreateEdificio = ref(false);

const showEditEdificioModal = ref(false);
const showEditAulaModal = ref(false);
const editingEdificio = ref(null);
const editingAula = ref(null);

const filteredEdificios = computed(() => {
  const q = searchEdificio.value.trim().toLowerCase();
  if (!q) return edificios.value;
  return edificios.value.filter((e) => e.nombre.toLowerCase().includes(q));
});

const filteredAulas = computed(() => {
  const q = searchAula.value.trim().toLowerCase();
  if (!q) return aulas.value;
  return aulas.value.filter((a) => a.nombre.toLowerCase().includes(q));
});

function onAddEdificio() {
  showCreateEdificio.value = true;
}

function onAddAula() {
  showCreateAula.value = true;
}

function handleCreateEdificio(payload) {
  const nextId = (edificios.value.at(-1)?.id ?? 0) + 1;

  edificios.value.push({
    id: nextId,
    nombre: payload.nombre || `Edificio ${nextId}`,
    aulas: 0,
  });
}

function handleCreateAula(payload) {
  const nextId = (aulas.value.at(-1)?.id ?? 0) + 1;

  const edificioId = Number(payload.edificioId);
  const edificio = edificios.value.find((e) => e.id === edificioId);
  const edificioNombre = edificio ? edificio.nombre : "Sin edificio";

  aulas.value.push({
    id: nextId,
    nombre: payload.nombre || `Aula ${nextId}`,
    edificio: edificioNombre,
  });

  if (edificio) {
    edificio.aulas += 1;
  }
}

function onEditEdificio(edificio) {
  editingEdificio.value = { ...edificio };
  showEditEdificioModal.value = true;
}

function onEditAula(aula) {
  editingAula.value = { ...aula };
  showEditAulaModal.value = true;
}

function handleSaveEdificioEdit() {
  if (!editingEdificio.value) return;
  const idx = edificios.value.findIndex(
    (e) => e.id === editingEdificio.value.id
  );
  if (idx !== -1) {
    edificios.value[idx] = { ...editingEdificio.value };
  }
  showEditEdificioModal.value = false;
}

function handleSaveAulaEdit() {
  if (!editingAula.value) return;

  const original = aulas.value.find((a) => a.id === editingAula.value.id);
  if (original) {
    original.nombre = editingAula.value.nombre;
    const prevBuildingName = original.edificio;
    original.edificio = editingAula.value.edificio;

    if (prevBuildingName !== original.edificio) {
      const prevBuilding = edificios.value.find(
        (e) => e.nombre === prevBuildingName
      );
      const newBuilding = edificios.value.find(
        (e) => e.nombre === original.edificio
      );

      if (prevBuilding && prevBuilding.aulas > 0) {
        prevBuilding.aulas -= 1;
      }
      if (newBuilding) {
        newBuilding.aulas += 1;
      }
    }
  }

  showEditAulaModal.value = false;
}

function onDeleteEdificio(edificio) {
  alert(`Eliminar edificio: ${edificio.nombre} (solo diseño).`);
}

function onDeleteAula(aula) {
  alert(`Eliminar aula: ${aula.nombre} (solo diseño).`);
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
        <div class="mb-8">
          <h1 class="text-3xl font-extrabold text-slate-900">
            Gestión de Edificios y Aulas
          </h1>
          <p class="mt-2 max-w-xl text-sm text-slate-500">
            Añade, edita y elimina los edificios y aulas de la institución.
          </p>
        </div>

        <div class="space-y-10">
          <section>
            <div
              class="mb-3 flex items-center justify-between text-sm font-semibold text-slate-800"
            >
              <h2 class="text-base md:text-lg">Gestión de Edificios</h2>
              <button
                type="button"
                @click="onAddEdificio"
                class="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-2 text-xs md:text-sm font-semibold text-white shadow-md shadow-sky-200 transition-colors hover:bg-sky-600"
              >
                <span class="text-lg leading-none">+</span>
                <span>Añadir Edificio</span>
              </button>
            </div>

            <div
              class="rounded-3xl bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
            >
              <div class="mb-4">
                <div class="relative w-full max-w-md">
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
                    v-model="searchEdificio"
                    type="text"
                    placeholder="Buscar por nombre..."
                    class="w-full rounded-full border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="ed in filteredEdificios"
                  :key="ed.id"
                  class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <div>
                    <p
                      class="cursor-pointer text-sm font-semibold text-sky-600 hover:underline"
                    >
                      {{ ed.nombre }}
                    </p>
                    <p class="mt-0.5 text-xs text-slate-500">
                      Aulas del edificio: {{ ed.aulas }}
                    </p>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-sky-500"
                      @click="onEditEdificio(ed)"
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
                      @click="onDeleteEdificio(ed)"
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
                  v-if="filteredEdificios.length === 0"
                  class="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500"
                >
                  No se encontraron edificios con el criterio actual.
                </div>
              </div>
            </div>
          </section>

          <section>
            <div
              class="mb-3 flex items-center justify-between text-sm font-semibold text-slate-800"
            >
              <h2 class="text-base md:text-lg">Gestión de Aulas</h2>
              <button
                type="button"
                @click="onAddAula"
                class="inline-flex items-center gap-2 rounded-2xl bg-sky-500 px-6 py-2 text-xs md:text-sm font-semibold text-white shadow-md shadow-sky-200 transition-colors hover:bg-sky-600"
              >
                <span class="text-lg leading-none">+</span>
                <span>Añadir Aula</span>
              </button>
            </div>

            <div
              class="rounded-3xl bg-white px-5 py-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]"
            >
              <div class="mb-4">
                <div class="relative w-full max-w-md">
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
                    v-model="searchAula"
                    type="text"
                    placeholder="Buscar por nombre..."
                    class="w-full rounded-full border border-slate-200 bg-slate-50/60 py-2.5 pl-10 pr-4 text-sm text-slate-900 shadow-sm focus:border-transparent focus:bg-white focus:outline-none focus:ring-2 focus:ring-sky-400"
                  />
                </div>
              </div>

              <div class="space-y-2">
                <div
                  v-for="aula in filteredAulas"
                  :key="aula.id"
                  class="flex items-center justify-between rounded-2xl px-4 py-3 text-sm hover:bg-slate-50"
                >
                  <div>
                    <p
                      class="cursor-pointer text-sm font-semibold text-sky-600 hover:underline"
                    >
                      {{ aula.nombre }}
                    </p>
                    <p class="mt-0.5 text-xs text-slate-500">
                      Edificio asignado: {{ aula.edificio }}
                    </p>
                  </div>

                  <div class="flex items-center gap-3">
                    <button
                      type="button"
                      class="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-sky-500"
                      @click="onEditAula(aula)"
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
                      @click="onDeleteAula(aula)"
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
                  v-if="filteredAulas.length === 0"
                  class="rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-xs text-slate-500"
                >
                  No se encontraron aulas con el criterio actual.
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <CreateSpaceModal
        v-model:open="showCreateAula"
        entity-type="aula"
        :building-options="edificios"
        @save="handleCreateAula"
      />

      <CreateSpaceModal
        v-model:open="showCreateEdificio"
        entity-type="edificio"
        @save="handleCreateEdificio"
      />

      <Teleport to="body">
        <transition name="fade">
          <div
            v-if="showEditEdificioModal && editingEdificio"
            class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4"
          >
            <div
              class="w-full max-w-xl rounded-[28px] bg-white px-8 py-8 shadow-xl md:px-10"
            >
              <div class="mb-6 text-center">
                <h2 class="text-2xl font-extrabold text-slate-900">
                  Editar Edificio
                </h2>
              </div>

              <form class="space-y-5" @submit.prevent="handleSaveEdificioEdit">
                <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      for="edit-nombre-edificio"
                      class="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Nombre del edificio
                    </label>
                    <input
                      id="edit-nombre-edificio"
                      v-model="editingEdificio.nombre"
                      type="text"
                      class="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  </div>

                  <div>
                    <label
                      for="edit-aulas-edificio"
                      class="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Aulas del edificio
                    </label>
                    <input
                      id="edit-aulas-edificio"
                      v-model.number="editingEdificio.aulas"
                      type="number"
                      min="0"
                      class="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  </div>
                </div>

                <div
                  class="mt-6 flex flex-col items-stretch gap-3 border-t border-slate-100 pt-5 md:flex-row md:justify-end"
                >
                  <button
                    type="button"
                    class="w-full rounded-full bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 md:w-auto"
                    @click="showEditEdificioModal = false"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    class="w-full rounded-full bg-sky-500 px-8 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-colors hover:bg-sky-600 md:w-auto"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </transition>
      </Teleport>

      <Teleport to="body">
        <transition name="fade">
          <div
            v-if="showEditAulaModal && editingAula"
            class="fixed inset-0 z-40 flex items-center justify-center bg-slate-900/40 px-4"
          >
            <div
              class="w-full max-w-xl rounded-[28px] bg-white px-8 py-8 shadow-xl md:px-10"
            >
              <div class="mb-6 text-center">
                <h2 class="text-2xl font-extrabold text-slate-900">
                  Editar Aula
                </h2>
              </div>

              <form class="space-y-5" @submit.prevent="handleSaveAulaEdit">
                <div class="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      for="edit-nombre-aula"
                      class="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Nombre del Aula
                    </label>
                    <input
                      id="edit-nombre-aula"
                      v-model="editingAula.nombre"
                      type="text"
                      class="w-full rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                    />
                  </div>

                  <div>
                    <label
                      for="edit-edificio-asignado"
                      class="mb-2 block text-sm font-semibold text-slate-800"
                    >
                      Edificio asignado
                    </label>
                    <div class="relative">
                      <select
                        id="edit-edificio-asignado"
                        v-model="editingAula.edificio"
                        class="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 shadow-sm focus:border-sky-300 focus:outline-none focus:ring-2 focus:ring-sky-300"
                      >
                        <option
                          v-for="ed in edificios"
                          :key="ed.id"
                          :value="ed.nombre"
                        >
                          {{ ed.nombre }}
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
                  class="mt-6 flex flex-col items-stretch gap-3 border-t border-slate-100 pt-5 md:flex-row md:justify-end"
                >
                  <button
                    type="button"
                    class="w-full rounded-full bg-slate-100 px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-200 md:w-auto"
                    @click="showEditAulaModal = false"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    class="w-full rounded-full bg-sky-500 px-8 py-2.5 text-sm font-semibold text-white shadow-md shadow-sky-200 transition-colors hover:bg-sky-600 md:w-auto"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </form>
            </div>
          </div>
        </transition>
      </Teleport>
    </div>
  </Sidebar>
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