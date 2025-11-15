<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
    <h3 class="text-lg font-bold text-gray-900 mb-6">{{ title }}</h3>

    <div v-if="rows.length === 0" class="text-center py-8">
      <p class="text-gray-500">{{ emptyText }}</p>
    </div>

    <div v-else class="overflow-x-auto">
      <table class="w-full text-sm">
        <thead>
          <tr class="border-b border-gray-200">
            <th v-for="header in headers" :key="header.key" class="text-left py-3 px-4 font-semibold text-gray-600 text-xs uppercase">
              {{ header.label }}
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(row, idx) in rows" :key="idx" class="border-b border-gray-100 hover:bg-gray-50 transition-colors">
            <td v-for="header in headers" :key="header.key" class="py-4 px-4 text-gray-700">
              <span v-if="header.key === 'estado'" :class="[
                'inline-block px-3 py-1 rounded-full text-xs font-medium',
                row[header.key] === 'Aprobada' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
              ]">
                {{ row[header.key] }}
              </span>
              <span v-else>{{ row[header.key] }}</span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  headers: Array,
  rows: Array,
  emptyText: { type: String, default: 'Sin datos' },
})
</script>
