<template>
  <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow">
    <p class="text-gray-500 text-sm font-medium">{{ label }}</p>
    <p class="text-3xl font-bold text-gray-900 mt-3">{{ value }}</p>
    <p v-if="sublabel" class="text-gray-400 text-xs mt-3">{{ sublabel }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: String,
  value: [String, Number],
  sublabel: String,
})
</script>
