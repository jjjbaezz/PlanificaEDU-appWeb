<script setup>
defineProps({
  title: String,
  headers: { type: Array, default: () => [] },
  rows: { type: Array, default: () => [] },
  emptyText: { type: String, default: 'Sin datos' },
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow p-6">
    <h4 class="text-base font-semibold text-sky-400 mb-4">{{ title }}</h4>
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-left text-gray-500 border-b">
            <th v-for="h in headers" :key="h.key" class="py-2 pr-4">{{ h.label }}</th>
          </tr>
        </thead>
        <tbody class="text-gray-700">
          <tr v-for="(r, idx) in rows" :key="idx" class="border-b hover:bg-gray-50">
            <td v-for="h in headers" :key="h.key" class="py-2 pr-4">
              {{ r[h.key] ?? '—' }}
            </td>
          </tr>
          <tr v-if="!rows.length">
            <td :colspan="headers.length" class="py-4 text-gray-400">{{ emptyText }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>
