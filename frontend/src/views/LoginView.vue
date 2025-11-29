<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { loginSchema } from '../validation/schemas'
import { validateField, validateAll } from '../validation/rules'

const email = ref('')
const password = ref('')

const touched = reactive({ email: false, password: false })
const errors = reactive({ email: '', password: '' })

const loading = ref(false)
const error = ref('') // error del server (credenciales inválidas, etc.)

const router = useRouter()
const auth = useAuthStore()

// Easter egg: 5 clicks en el logo
const clickCount = ref(0)
const clickTimeout = ref(null)

function handleLogoClick() {
  clickCount.value++
  console.log(`Click #${clickCount.value}`)

  // Reset del contador después de 2 segundos sin clicks
  if (clickTimeout.value) clearTimeout(clickTimeout.value)
  clickTimeout.value = setTimeout(() => {
    clickCount.value = 0
  }, 2000)

  // Si llega a 5 clicks, accede con datos dummy
  if (clickCount.value === 5) {
    console.log('¡Easter egg activado! Redirigiendo al dashboard...')
    loginWithDummyData()
    clickCount.value = 0
  }
}

function loginWithDummyData() {
  // Crear sesión dummy sin necesidad de backend - con rol ya definido
  const dummyUser = {
    id: 'dummy-user-id',
    nombre: 'Usuario Demo',
    email: 'demo@planificaedu.com',
    rol: 'ADMIN',
    activo: true
  }
  const dummyToken = 'dummy-token-for-development'

  // Activar modo dummy
  auth._setSession({ user: dummyUser, token: dummyToken, isDummyMode: true })
  router.push('/dashboard')
}

function runFieldValidation(name) {
  const val = name === 'email' ? email.value : password.value
  const res = validateField(val, loginSchema[name])
  errors[name] = res === true ? '' : res
}

function onBlur(name) {
  touched[name] = true
  runFieldValidation(name)
}

const canSubmit = computed(() => {
  const { isValid } = validateAll(loginSchema, { email: email.value, password: password.value })
  return isValid && !loading.value
})

const onSubmit = async (e) => {
  e.preventDefault()
  error.value = ''

  const { isValid, errors: allErrs } = validateAll(loginSchema, {
    email: email.value,
    password: password.value,
  })
  Object.assign(errors, allErrs)
  touched.email = true
  touched.password = true

  if (!isValid) return

  loading.value = true
  try {
    const user = await auth.login({ email: email.value, password: password.value })
    if (!user?.rol) return router.push('/onboarding/type')
    return router.push('/dashboard')
  }  catch (err) {
  const status = err?.response?.status
  const serverMsg = err?.response?.data?.message
  error.value = serverMsg || (status === 401 ? 'Credenciales inválidas' : err?.message || 'Error al iniciar sesión')
}
 finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen bg-gray-50 flex flex-col overflow-hidden relative">
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div class="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
        <div class="w-full lg:w-1/2 text-center lg:text-left">
          <h1
            @click="handleLogoClick"
            class="text-5xl sm:text-6xl lg:text-7xl font-bold text-sky-400 mb-4 cursor-pointer select-none transition-transform hover:scale-105"
            title="PlanificaEDU"
          >
            PlanificaEDU
          </h1>
          <p class="text-xl sm:text-2xl text-gray-500">Sistema de planificación académica</p>
        </div>

        <div class="w-full lg:w-1/2 max-w-md z-10">
          <div class="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
            <h2 class="text-3xl font-semibold text-sky-400 mb-2">Iniciar Sesión</h2>
            <p class="text-gray-400 text-sm mb-8">Ingresa tus credenciales para acceder a PlanificaEDU</p>

            <form class="space-y-6" @submit="onSubmit" novalidate>
              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                <input
                  id="email"
                  type="email"
                  v-model="email"
                  @blur="onBlur('email')"
                  :aria-invalid="!!errors.email"
                  :aria-describedby="errors.email ? 'email-error' : undefined"
                  class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
                  :class="{'border-red-400': touched.email && errors.email, 'border-gray-300': !(touched.email && errors.email)}"
                  placeholder="correo@ejemplo.com"
                  autocomplete="email"
                />
                <p v-if="touched.email && errors.email" id="email-error" class="mt-1 text-sm text-red-500">{{ errors.email }}</p>
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input
                  id="password"
                  type="password"
                  v-model="password"
                  @blur="onBlur('password')"
                  :aria-invalid="!!errors.password"
                  :aria-describedby="errors.password ? 'password-error' : undefined"
                  class="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-400 focus:border-transparent outline-none transition"
                  :class="{'border-red-400': touched.password && errors.password, 'border-gray-300': !(touched.password && errors.password)}"
                  placeholder="••••••••"
                  autocomplete="current-password"
                />
                <p v-if="touched.password && errors.password" id="password-error" class="mt-1 text-sm text-red-500">{{ errors.password }}</p>
              </div>

              <button
                type="submit"
                :disabled="!canSubmit"
                class="w-full bg-sky-400 hover:bg-sky-500 disabled:opacity-60 text-white font-medium py-3 px-4 rounded-lg transition duration-200"
              >
                {{ loading ? 'Entrando...' : 'Iniciar Sesión' }}
              </button>

              <p v-if="error" class="text-red-500 text-sm">{{ error }}</p>

              <div class="flex justify-between items-center text-sm">
                <RouterLink to="/register" class="text-gray-400 hover:text-sky-400 transition">¿Aún no tienes cuenta?</RouterLink>
                <a href="#" class="text-gray-400 hover:text-sky-400 transition">¿Olvidaste tu contraseña?</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>

    <div class="w-full footerLogin absolute bottom-0">
      <img src="../assets/imgs/vectorAzulLogin.png" alt="Vector decorativo" class="w-full h-auto" />
    </div>
  </div>
</template>
