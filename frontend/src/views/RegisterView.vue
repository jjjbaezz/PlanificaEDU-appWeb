<template>
  <div class="min-h-screen bg-gray-50 flex flex-col">
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div class="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
        <div class="w-full lg:w-1/2 max-w-md order-2 lg:order-1">
          <div class="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
            <h2 class="text-3xl font-semibold text-sky-400 mb-2">
              Regístrate
            </h2>
            <p class="text-gray-400 text-sm mb-8">
              Ingresa tus credenciales para registrarte
            </p>

            <form class="space-y-5">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label for="nombre" class="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  <input type="text" id="nombre"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
                    placeholder="Juan" />
                </div>
                <div>
                  <label for="apellido" class="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  <input type="text" id="apellido"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
                    placeholder="Pérez" />
                </div>
              </div>

              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">
                  Correo Electrónico
                </label>
                <input type="email" id="email"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
                  placeholder="correo@ejemplo.com" />
              </div>

              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">
                  Contraseña
                </label>
                <input type="password" id="password"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
                  placeholder="••••••••" />
              </div>

              <div>
                <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">
                  Confirmar contraseña
                </label>
                <input type="password" id="confirm-password"
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
                  placeholder="••••••••" />
              </div>

              <button type="submit"
                class="w-full bg-sky-400 hover:bg-sky-500 text-white font-medium py-3 px-4 rounded-lg transition duration-200">
                Registrarse
              </button>

              <div class="text-center text-sm">
                <RouterLink to="/login" class="text-gray-400 hover:text-sky-400 transition">
                  ¿Ya tienes una cuenta?
                </RouterLink>

              </div>
            </form>
          </div>
        </div>

        <div class="w-full lg:w-1/2 text-center lg:text-left order-1 lg:order-2">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-sky-400 mb-4">
            PlanificaEDU
          </h1>
          <p class="text-xl sm:text-2xl text-gray-500">
            Sistema de planificación académica
          </p>
        </div>
      </div>
    </div>

    <div class="w-full footerLogin">
      <img src="../assets/imgs/vectorAzulLogin.png" alt="Vector decorativo" class="w-full h-auto" />
    </div>
  </div>
</template>

<script setup>
</script>