<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const selectedRole = ref(null)
const loading = ref(false)

async function selectRole(role) {
  selectedRole.value = role
  loading.value = true

  try {
    // Aquí deberías hacer una llamada al backend para actualizar el rol del usuario
    // Por ahora, solo actualizamos localmente
    const updatedUser = { ...auth.user, rol: role }
    auth._setSession({ user: updatedUser, token: auth.token })

    // Redirigir al dashboard
    router.push('/dashboard')
  } catch (error) {
    console.error('Error al seleccionar rol:', error)
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 relative overflow-hidden">
    <!-- Contenido principal -->
    <div class="max-w-4xl w-full z-10">
      <h1 class="text-4xl md:text-5xl font-bold text-sky-400 text-center mb-12">
        ¿Qué eres?
      </h1>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        <!-- Opción Profesor -->
        <button
          @click="selectRole('PROFESOR')"
          :disabled="loading"
          class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          :class="{ 'ring-4 ring-sky-400': selectedRole === 'PROFESOR' }"
        >
          <div class="flex flex-col items-center space-y-6">
            <!-- Icono/Imagen Profesor -->
            <div class="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
              <svg class="w-full h-full text-sky-400 group-hover:text-sky-500 transition-colors" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Cabeza -->
                <circle cx="50" cy="30" r="12" fill="currentColor" opacity="0.2"/>
                <!-- Cuerpo -->
                <path d="M35 45 L35 70 L40 85 L45 85 L45 75 L55 75 L55 85 L60 85 L65 70 L65 45 Z" fill="currentColor" opacity="0.3"/>
                <!-- Traje -->
                <rect x="35" y="45" width="30" height="25" fill="currentColor" opacity="0.4"/>
                <!-- Corbata -->
                <path d="M48 45 L50 70 L52 45 Z" fill="currentColor"/>
                <!-- Gorra de graduación -->
                <rect x="38" y="18" width="24" height="4" fill="currentColor"/>
                <path d="M35 20 L65 20 L62 18 L38 18 Z" fill="currentColor" opacity="0.5"/>
              </svg>
            </div>

            <h2 class="text-2xl md:text-3xl font-semibold text-gray-800 group-hover:text-sky-500 transition-colors">
              Maestro / Profesor
            </h2>
          </div>
        </button>

        <!-- Opción Estudiante -->
        <button
          @click="selectRole('ESTUDIANTE')"
          :disabled="loading"
          class="bg-white rounded-2xl shadow-lg p-8 hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
          :class="{ 'ring-4 ring-sky-400': selectedRole === 'ESTUDIANTE' }"
        >
          <div class="flex flex-col items-center space-y-6">
            <!-- Icono/Imagen Estudiante -->
            <div class="w-32 h-32 md:w-40 md:h-40 flex items-center justify-center">
              <svg class="w-full h-full text-emerald-500 group-hover:text-emerald-600 transition-colors" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                <!-- Cabeza -->
                <circle cx="50" cy="30" r="12" fill="currentColor" opacity="0.2"/>
                <!-- Cuerpo -->
                <path d="M35 45 L35 70 L40 85 L45 85 L45 75 L55 75 L55 85 L60 85 L65 70 L65 45 Z" fill="currentColor" opacity="0.3"/>
                <!-- Camiseta casual -->
                <rect x="35" y="45" width="30" height="25" fill="currentColor" opacity="0.4"/>
                <!-- Mochila -->
                <rect x="57" y="48" width="8" height="15" rx="2" fill="currentColor" opacity="0.5"/>
                <!-- Gorra de graduación -->
                <rect x="38" y="18" width="24" height="4" fill="currentColor"/>
                <circle cx="62" cy="16" r="3" fill="currentColor"/>
              </svg>
            </div>

            <h2 class="text-2xl md:text-3xl font-semibold text-gray-800 group-hover:text-emerald-600 transition-colors">
              Estudiante
            </h2>
          </div>
        </button>
      </div>

      <p v-if="loading" class="text-center text-gray-500 mt-8">
        Configurando tu cuenta...
      </p>
    </div>

    <!-- Vector decorativo inferior -->
    <div class="w-full absolute bottom-0 left-0 right-0">
      <img src="../../assets/imgs/vectorAzulLogin.png" alt="Vector decorativo" class="w-full h-auto" />
    </div>
  </div>
</template>
