<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { getRegisterSchema } from '../validation/schemas'
import { validateField, validateAll } from '../validation/rules'

const nombre = ref('')
const apellido = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')

const touched = reactive({ nombre: false, email: false, password: false, confirm: false })
const errors = reactive({ nombre: '', email: '', password: '', confirm: '' })

const loading = ref(false)
const serverError = ref('')

const router = useRouter()
const auth = useAuthStore()

// Schema dependiente del valor de password (para validar confirm)
const schema = getRegisterSchema(password)

function runFieldValidation(name) {
  const values = { nombre: nombre.value, email: email.value, password: password.value, confirm: confirm.value }
  const res = validateField(values[name], schema[name])
  errors[name] = res === true ? '' : res
}

function onBlur(name) {
  touched[name] = true
  runFieldValidation(name)
}

const canSubmit = computed(() => {
  const { isValid } = validateAll(schema, {
    nombre: nombre.value,
    email: email.value,
    password: password.value,
    confirm: confirm.value,
  })
  return isValid && !loading.value
})

const onSubmit = async (e) => {
  e.preventDefault()
  serverError.value = ''

  const { isValid, errors: allErrs } = validateAll(schema, {
    nombre: nombre.value,
    email: email.value,
    password: password.value,
    confirm: confirm.value,
  })
  Object.assign(errors, allErrs)
  Object.keys(touched).forEach(k => touched[k] = true)
  if (!isValid) return

  loading.value = true
  try {
    await auth.register({
      nombre: nombre.value,
      apellido: apellido.value || undefined,
      email: email.value,
      password: password.value,
    })
    router.push('/onboarding/type')
  } catch (err) {
    serverError.value = err?.response?.data?.message || err?.message || 'No se pudo registrar'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="h-screen bg-gray-50 flex flex-col relative overflow-hidden">
    <div class="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
      <div class="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-8 lg:gap-16">
        <div class="w-full lg:w-1/2 max-w-md order-2 lg:order-1 z-10">
          <div class="bg-white rounded-2xl shadow-lg p-8 sm:p-10">
            <h2 class="text-3xl font-semibold text-sky-400 mb-2">Regístrate</h2>
            <p class="text-gray-400 text-sm mb-8">Ingresa tus credenciales para registrarte</p>

            <form class="space-y-5" @submit="onSubmit" novalidate>
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <!-- Nombre -->
                <div>
                  <label for="nombre" class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
                  <input id="nombre" type="text" v-model="nombre" @blur="onBlur('nombre')" :class="['w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-sky-400 outline-none transition',
                    touched.nombre && errors.nombre ? 'border-red-400' : 'border-gray-300']" placeholder="Juan"
                    autocomplete="given-name" />
                  <p v-if="touched.nombre && errors.nombre" class="mt-1 text-sm text-red-500">{{ errors.nombre }}</p>
                </div>

                <!-- Apellido (opcional) -->
                <div>
                  <label for="apellido" class="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
                  <input id="apellido" type="text" v-model="apellido"
                    class="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-sky-400 outline-none transition"
                    placeholder="Pérez" autocomplete="family-name" />
                </div>
              </div>

              <!-- Email -->
              <div>
                <label for="email" class="block text-sm font-medium text-gray-700 mb-2">Correo Electrónico</label>
                <input id="email" type="email" v-model="email" @blur="onBlur('email')"
                  @input="touched.email && runFieldValidation('email')" :class="['w-full px-4 py-3 border rounded-lg',
                    touched.email && errors.email ? 'border-red-400' : 'border-gray-300']"
                  placeholder="correo@ejemplo.com" />
                <p v-if="touched.email && errors.email" class="mt-1 text-sm text-red-500">{{ errors.email }}</p>
              </div>

              <!-- Password -->
              <div>
                <label for="password" class="block text-sm font-medium text-gray-700 mb-2">Contraseña</label>
                <input id="password" type="password" v-model="password" @blur="onBlur('password')"
                  @input="touched.password && runFieldValidation('password')" :class="['w-full px-4 py-3 border rounded-lg',
                    touched.password && errors.password ? 'border-red-400' : 'border-gray-300']" placeholder="••••••••" />
              </div>

              <!-- Confirm -->
              <div>
                <label for="confirm-password" class="block text-sm font-medium text-gray-700 mb-2">Confirmar
                  contraseña</label>
                <!-- Confirm -->
                <input id="confirm-password" type="password" v-model="confirm" @blur="onBlur('confirm')"
                  @input="touched.confirm && runFieldValidation('confirm')" :class="['w-full px-4 py-3 border rounded-lg',
                    touched.confirm && errors.confirm ? 'border-red-400' : 'border-gray-300']" placeholder="••••••••" />
              </div>

              <button type="submit" :disabled="loading"
                class="w-full bg-sky-400 hover:bg-sky-500 disabled:opacity-60 text-white font-medium py-3 px-4 rounded-lg">
                {{ loading ? 'Creando cuenta...' : 'Registrarse' }}
              </button>

              <p v-if="serverError" class="text-red-500 text-sm mt-2">{{ serverError }}</p>

              <div class="text-center text-sm">
                <RouterLink to="/login" class="text-gray-400 hover:text-sky-400 transition">¿Ya tienes una cuenta?
                </RouterLink>
              </div>
            </form>
          </div>
        </div>

        <div class="w-full lg:w-1/2 text-center lg:text-left order-1 lg:order-2">
          <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold text-sky-400 mb-4">PlanificaEDU</h1>
          <p class="text-xl sm:text-2xl text-gray-500">Sistema de planificación académica</p>
        </div>
      </div>
    </div>

    <div class="w-full footerLogin absolute bottom-0">
      <img src="../assets/imgs/vectorAzulLogin.png" alt="Vector decorativo" class="w-full h-auto" />
    </div>
  </div>
</template>
