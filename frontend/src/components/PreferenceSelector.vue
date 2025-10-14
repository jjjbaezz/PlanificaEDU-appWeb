<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div class="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div class="w-full max-w-md mx-auto lg:mx-0">
          <div class="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
            <h2 class="text-3xl font-semibold text-sky-400 mb-2">
              ¿Qué horario prefieres?
            </h2>
            <p class="text-gray-400 text-sm mb-8">
              Ingresa tus credenciales para registrarte
            </p>

            <form class="space-y-6">
              <!-- Turno preferido -->
              <div>
                <label for="turno" class="block text-sm font-medium text-gray-700 mb-2">
                  Turno preferido
                </label>
                <select id="turno"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition bg-white">
                  <option value="">Mañana / Tarde / Noche</option>
                  <option value="manana">Mañana</option>
                  <option value="tarde">Tarde</option>
                  <option value="noche">Noche</option>
                </select>
              </div>

              <!-- Días -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3">
                  Días
                </label>
                <div class="grid grid-cols-2 gap-3">
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Lunes</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Jueves</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Martes</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Viernes</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Miércoles</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox"
                      class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Sábado</span>
                  </label>
                </div>
              </div>

              <button type="submit"
                class="w-full bg-sky-400 hover:bg-sky-500 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 mt-8">
                Guardar
              </button>
            </form>
          </div>
        </div>

        <div class="text-center lg:text-left">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-sky-400 mb-4">
            PlanificaEDU
          </h1>
          <p class="text-xl sm:text-2xl text-gray-500">
            Sistema de planificación académica
          </p>
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