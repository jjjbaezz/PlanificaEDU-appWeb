<template>
  <div>
    <h3 class="text-lg font-bold text-gray-900">{{ title }}</h3>
    <p v-if="subtitle" class="text-gray-500 text-sm mt-1">{{ subtitle }}</p>
  </div>
</template>

<script setup>
defineProps({
  title: String,
  subtitle: String,
})
</script>
