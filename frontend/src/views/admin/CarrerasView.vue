<script setup>
import { ref, onMounted, computed } from "vue";
import http from "../../services/http";
import CareerFormModal from "../../components/admin/CareerFormModal.vue";
import CareerItem from "../../components/admin/CareerItem.vue";
import ConfirmDeleteModal from "../../components/admin/ConfirmDeleteModal.vue";
import EmptyState from "../../components/admin/EmptyState.vue";
import Sidebar from "../../components/Sidebar.vue";
import { useAuthStore } from "../../stores/auth";

const auth = useAuthStore();

const search = ref("");
const page = ref(1);
const limit = ref(12);
const items = ref([]);
const meta = ref({ page: 1, limit: 12, total: 0 });
const loading = ref(false);
const error = ref(null);

const demoCarreras = [
  {
    id: null,
    nombre: "Ingeniería de Software",
    descripcion:
      "Una carrera enfocada en el desarrollo de sistemas de software.",
    totalAlumnos: 152,
    totalProfesores: 25,
    totalMaterias: 81,
  },
  {
    id: null,
    nombre: "Diseño Gráfico Digital",
    descripcion: "Creatividad y tecnología para la comunicación visual.",
    totalAlumnos: 89,
    totalProfesores: 14,
    totalMaterias: 67,
  },
  {
    id: null,
    nombre: "Administración de Empresas",
    descripcion: "Formación de líderes para el mundo de los negocios.",
    totalAlumnos: 215,
    totalProfesores: 32,
    totalMaterias: 63,
  },
];

const hasRealItems = computed(() => items.value.length > 0);
const careersToRender = computed(() =>
  hasRealItems.value ? items.value : demoCarreras
);

const showForm = ref(false);
const editing = ref(null);
const showDelete = ref(false);
const deletingItem = ref(null);

let debounceTimer = null;

const nombre = computed(
  () => auth.user?.nombre || auth.user?.name || "Nombre Admin"
);
const role = computed(() => auth.user?.rol || auth.user?.role || "ADMIN");

async function fetchCarreras() {
  loading.value = true;
  error.value = null;
  try {
    const res = await http.get("/admin/carreras", {
      params: { search: search.value, page: page.value, limit: limit.value },
    });
    items.value = res.data.items || [];
    meta.value = res.data.meta || {
      page: page.value,
      limit: limit.value,
      total: items.value.length,
    };
  } catch (e) {
    console.error("Error fetching carreras", e);
    error.value = e;
  } finally {
    loading.value = false;
  }
}

function onSearchChange() {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    page.value = 1;
    fetchCarreras();
  }, 350);
}

function openCreate() {
  editing.value = null;
  showForm.value = true;
}

function openEdit(item) {
  if (!item?.id) return;
  editing.value = item;
  showForm.value = true;
}

function onSaved() {
  showForm.value = false;
  fetchCarreras();
}

function confirmDelete(item) {
  if (!item?.id) return; // no delete for demo items
  deletingItem.value = item;
  showDelete.value = true;
}

async function onDeleted() {
  showDelete.value = false;
  deletingItem.value = null;
  await fetchCarreras();
}

async function performDelete() {
  const id = deletingItem.value?.id;
  if (!id) return;
  try {
    await http.delete(`/admin/carreras/${id}`);
    await onDeleted();
    alert("Carrera eliminada");
  } catch (e) {
    console.error("Error deleting carrera", e);
    alert("Error eliminando la carrera");
  }
}

function loadMore() {
  if (!hasRealItems.value) return;
  if (meta.value.page * meta.value.limit >= meta.value.total) return;

  page.value += 1;
  loading.value = true;
  http
    .get("/admin/carreras", {
      params: { search: search.value, page: page.value, limit: limit.value },
    })
    .then((res) => {
      items.value = items.value.concat(res.data.items || []);
      meta.value = res.data.meta || meta.value;
    })
    .catch((e) => {
      error.value = e;
    })
    .finally(() => {
      loading.value = false;
    });
}

onMounted(() => {
  if (auth.user?.rol !== "ADMIN") return;
  fetchCarreras();
});
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
          <h1 class="text-3xl font-bold text-gray-900">Gestión de Carreras</h1>
          <p class="mt-2 text-gray-600">
            Añade, edita y elimina las carreras de la institución.
          </p>
        </div>

        <div class="mb-6 flex flex-col items-center gap-4 md:flex-row">
          <div class="relative flex-1 w-full">
            <svg
              class="absolute left-3 top-3 h-5 w-5 text-gray-400"
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
              placeholder="Buscar por nombre, apellido o email..."
              @input="onSearchChange"
              class="w-full rounded-lg border border-gray-300 py-3 pl-10 pr-4 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-sky-400"
            />
          </div>

          <button
            type="button"
            @click="openCreate"
            class="flex h-min items-center gap-2 whitespace-nowrap rounded-xl bg-sky-400 px-6 py-2 text-sm font-medium text-white transition-colors hover:bg-sky-600"
          >
            <span>+</span>
            <span>Añadir Carrera</span>
          </button>
        </div>

        <div v-if="loading" class="space-y-3">
          <div class="h-12 animate-pulse rounded bg-gray-100" />
          <div class="h-12 animate-pulse rounded bg-gray-100" />
          <div class="h-12 animate-pulse rounded bg-gray-100" />
        </div>

        <div v-else>
          <div
            v-if="error"
            class="mb-4 rounded bg-red-50 p-4 text-sm text-red-700"
          >
            Error cargando carreras.
            <button type="button" class="underline" @click="fetchCarreras">
              Reintentar
            </button>
          </div>

          <div class="space-y-4">
            <div v-for="item in careersToRender" :key="item.id ?? item.nombre">
              <CareerItem
                :item="item"
                @edit="openEdit"
                @delete="confirmDelete"
              />
            </div>

            <div class="mt-6 flex justify-center">
              <button
                v-if="hasRealItems && meta.page * meta.limit < meta.total"
                type="button"
                @click="loadMore"
                class="rounded bg-gray-100 px-4 py-2 text-sm text-gray-700 hover:bg-gray-200"
              >
                Cargar más
              </button>
            </div>
          </div>

          <div v-if="!hasRealItems" class="mt-6">
            <EmptyState @add="openCreate" />
          </div>
        </div>
      </main>
    </div>

    <CareerFormModal
      v-model="showForm"
      :initialData="editing"
      @saved="onSaved"
    />
    <ConfirmDeleteModal
      :visible="showDelete"
      :itemName="deletingItem?.nombre"
      @confirm="performDelete"
      @cancel="showDelete = false"
    />
  </Sidebar>
</template>

<style scoped></style>