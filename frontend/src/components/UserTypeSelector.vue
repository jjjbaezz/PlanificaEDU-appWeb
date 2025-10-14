<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-4xl text-center">
        <h2 class="text-4xl sm:text-5xl font-semibold text-sky-400 mb-16">
          ¿Qué eres?
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-8 sm:gap-12 max-w-2xl mx-auto mb-16">
          <!-- Profesor Card -->
          <button
            class="group bg-white rounded-2xl shadow-lg p-8 sm:p-12 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div class="flex flex-col items-center">
              <div class="w-32 h-32 sm:w-40 sm:h-40 mb-6">
                <img src="../assets/imgs/profesor.png" alt="Profesor" class="w-full h-full object-contain" />
              </div>
              <span class="text-2xl font-semibold text-sky-400">
                Profesor
              </span>
            </div>
          </button>

          <!-- Estudiante Card -->
          <button
            class="group bg-white rounded-2xl shadow-lg p-8 sm:p-12 hover:shadow-xl transition-all duration-300 hover:scale-105">
            <div class="flex flex-col items-center">
              <div class="w-32 h-32 sm:w-40 sm:h-40 mb-6">
                <img src="../assets/imgs/estudiante.png" alt="Estudiante" class="w-full h-full object-contain" />
              </div>
              <span class="text-2xl font-semibold text-sky-400">
                Estudiante
              </span>
            </div>
          </button>
        </div>
      </div>
    </div>

    <div class="w-full">
      <img src="../assets/imgs/vectorAzulLogin.png" alt="Vector decorativo" class="w-full h-auto" />
    </div>
  </div>
</template>

<script setup>
</script>