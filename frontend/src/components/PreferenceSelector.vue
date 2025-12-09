<template>
  <div class="min-h-screen bg-gray-50 flex flex-col relative">
    <!-- Modal de confirmación -->
    <div v-if="showModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div class="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 transform transition-all duration-300 scale-100">
        <div class="flex flex-col items-center">
          <!-- Icono de éxito -->
          <div class="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg class="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </div>
          
          <!-- Texto del modal -->
          <h3 class="text-2xl font-semibold text-gray-800 mb-2">¡Excelente!</h3>
          <p class="text-gray-600 text-center mb-6">
            Acabas de elegir tu preferencia de horario. Serás redirigido al dashboard en unos segundos.
          </p>
          
          <!-- Contador -->
          <div class="flex items-center space-x-2 text-gray-500 mb-6">
            <svg class="w-5 h-5 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span class="text-sm">Redirigiendo en {{ countdown }} segundos...</span>
          </div>
          
          <!-- Botón para ir inmediatamente -->
          <button 
            @click="goToDashboard" 
            class="w-full bg-sky-400 hover:bg-sky-500 text-white font-semibold py-3 px-4 rounded-lg transition duration-200"
          >
            Ir al dashboard ahora
          </button>
        </div>
      </div>
    </div>

    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12 z-10">
      <div class="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        <div class="w-full max-w-md mx-auto lg:mx-0">
          <div class="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
            <h2 class="text-3xl font-semibold text-sky-400 mb-2"> ¿Qué horario prefieres? </h2>
            <form class="space-y-6" @submit="onSubmit">
              <!-- Turno preferido -->
              <div>
                <label for="turno" class="block text-sm font-medium text-gray-700 mb-2"> Turno preferido </label>
                <select 
                  id="turno" 
                  v-model="turno" 
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition bg-white"
                  required
                >
                  <option disabled value="">Selecciona un turno</option>
                  <option value="manana">Mañana</option>
                  <option value="tarde">Tarde</option>
                  <option value="noche">Noche</option>
                </select>
                <p class="mt-1 text-xs text-gray-400"> El turno que prefieres para la mayoría de tus clases. </p>
              </div>
              
              <!-- Compactación -->
              <div>
                <label for="compactacion" class="block text-sm font-medium text-gray-700 mb-2"> Nivel de compactación </label>
                <select 
                  id="compactacion" 
                  v-model="compactacion" 
                  class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition bg-white"
                >
                  <option value="baja">Baja (horario más disperso)</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta (clases lo más pegadas posible)</option>
                </select>
                <p class="mt-1 text-xs text-gray-400"> Alta = concentrar clases en menos bloques. Baja = repartirlas más. </p>
              </div>
              
              <!-- Días a evitar -->
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-3"> ¿Qué días prefieres evitar? </label>
                <p class="text-xs text-gray-400 mb-3"> Selecciona los días en los que <span class="font-semibold">no</span> quieres tener clases si se puede evitar. </p>
                <div class="grid grid-cols-2 gap-3">
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" v-model="dias.lunes" class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Lunes</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" v-model="dias.martes" class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Martes</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" v-model="dias.miercoles" class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Miércoles</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" v-model="dias.jueves" class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Jueves</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" v-model="dias.viernes" class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Viernes</span>
                  </label>
                  <label class="flex items-center space-x-3 cursor-pointer">
                    <input type="checkbox" v-model="dias.sabado" class="w-5 h-5 text-sky-400 border-gray-300 rounded focus:ring-2 focus:ring-sky-400" />
                    <span class="text-gray-700">Sábado</span>
                  </label>
                </div>
              </div>
              
              <button 
                type="submit" 
                class="w-full bg-sky-400 hover:bg-sky-500 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 mt-8"
                :disabled="users.saving"
              >
                <span v-if="users.saving">Guardando...</span>
                <span v-else>Guardar</span>
              </button>
            </form>
          </div>
        </div>
        
        <div class="text-center lg:text-left">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-sky-400 mb-4"> PlanificaEDU </h1>
          <p class="text-xl sm:text-2xl text-gray-500"> Sistema de planificación académica </p>
        </div>
      </div>
    </div>
    
    <div class="w-full footerLogin absolute bottom-0">
      <img src="../assets/imgs/vectorAzulLogin.png" alt="Vector decorativo" class="w-full h-auto" />
    </div>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '../stores/users'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const users = useUsersStore()
const auth = useAuthStore()

const turno = ref('')
const compactacion = ref('media')
const dias = ref({
  lunes: false,
  martes: false,
  miercoles: false,
  jueves: false,
  viernes: false,
  sabado: false,
})

// Variables para el modal
const showModal = ref(false)
const countdown = ref(5)
let countdownInterval = null

// Limpiar el intervalo al desmontar el componente
onUnmounted(() => {
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
})

function startCountdown() {
  countdownInterval = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      clearInterval(countdownInterval)
      goToDashboard()
    }
  }, 1000)
}

function goToDashboard() {
  // Limpiar el intervalo si existe
  if (countdownInterval) {
    clearInterval(countdownInterval)
  }
  
  // Redirigir al dashboard
  router.push('/dashboard')
}

async function onSubmit(e) {
  e.preventDefault()
  
  if (!turno.value) {
    alert('Por favor, selecciona un turno preferido')
    return
  }
  
  const turnoFinal = turno.value
  const diasSeleccionados = Object.keys(dias.value).filter(dia => dias.value[dia])
  
  const preferences = {
    turno: turnoFinal,
    diasEvitar: diasSeleccionados,
    compactacion: compactacion.value,
  }

  try {
    if (auth.isDummyMode) {
      showModal.value = true
      startCountdown()
    } else {
      await users.savePreferences(preferences)
      showModal.value = true
      startCountdown()
    }
  } catch (e) {
    alert(e.response?.data?.message || e.message)
  }
}
</script>