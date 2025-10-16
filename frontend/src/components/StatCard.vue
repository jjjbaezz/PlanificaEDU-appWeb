<script setup>
defineProps({
  label: { type: String, required: true },
  value: { type: [String, Number], required: true },
  sublabel: { type: String, default: '' },
})
</script>

<template>
  <div class="bg-white rounded-2xl shadow p-5">
    <p class="text-gray-500 text-sm">{{ label }}</p>
    <p class="text-3xl font-bold text-sky-400">{{ value }}</p>
    <p v-if="sublabel" class="text-xs text-gray-400 mt-1">{{ sublabel }}</p>
  </div>
</template>
