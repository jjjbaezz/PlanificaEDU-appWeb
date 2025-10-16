<script setup>
defineProps({ title: String, subtitle: String })
</script>

<template>
  <div class="mb-4">
    <h3 class="text-lg font-semibold text-sky-400">{{ title }}</h3>
    <p v-if="subtitle" class="text-gray-500 text-sm">{{ subtitle }}</p>
  </div>
</template>
