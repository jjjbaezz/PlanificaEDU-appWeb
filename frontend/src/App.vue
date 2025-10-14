<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <header style="display:flex; gap:12px; padding:12px; align-items:center; flex-wrap:wrap">
    <!-- Navegación -->
    <RouterLink to="/login">Login</RouterLink>
    <RouterLink to="/register">Register</RouterLink>
    <RouterLink to="/quien-eres">¿Qué eres?</RouterLink>
    <RouterLink to="/preferencias">Preferencias</RouterLink>
  </header>

  <RouterView />
</template>

<style scoped>
a.router-link-active {
  text-decoration: underline;
}
</style>
