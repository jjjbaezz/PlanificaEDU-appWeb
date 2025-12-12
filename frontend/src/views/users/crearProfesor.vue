<template>
    <Sidebar>
  <div class="flex items-center justify-center min-h-screen bg-gray-100 p-4">
    <div class="bg-white rounded-2xl shadow-lg p-8 max-w-2xl w-full">
      <!-- Header -->
      <div class="mb-6">
        <h2 class="text-2xl font-bold text-gray-900">Crear Nuevo Profesor</h2>
        <p class="text-gray-500 text-sm mt-1">Rellena los siguientes campos para añadir un nuevo profesor al sistema.</p>
      </div>

      <!-- Form -->
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- Nombre y Apellido -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Nombre</label>
            <input
              v-model="formData.nombre"
              type="text"
              placeholder="Introduce el nombre"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Apellido</label>
            <input
              v-model="formData.apellido"
              type="text"
              placeholder="Introduce el apellido"
              class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent"
            />
          </div>
        </div>

        <!-- Carrera -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Carrera</label>
          <select
            v-model="formData.carrera"
            class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-400 focus:border-transparent appearance-none bg-white cursor-pointer"
          >
            <option value="">Selecciona una carrera</option>
            <option value="software">Ingeniería de Software</option>
            <option value="sistemas">Ingeniería de Sistemas</option>
            <option value="grafico">Diseño Gráfico</option>
            <option value="administracion">Administración</option>
            <option value="medicina">Medicina</option>
            <option value="arquitectura">Arquitectura</option>
          </select>
        </div>

        <!-- Preferencias de Horario -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Preferencias de Horario</label>
          <p class="text-gray-500 text-sm mb-4">Selecciona los bloques horarios en los que prefieres dar clases.</p>
          
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead>
                <tr>
                  <th class="px-3 py-2 text-left text-sm font-semibold text-gray-700"></th>
                  <th class="px-3 py-2 text-center text-sm font-semibold text-gray-700">Lunes</th>
                  <th class="px-3 py-2 text-center text-sm font-semibold text-gray-700">Martes</th>
                  <th class="px-3 py-2 text-center text-sm font-semibold text-gray-700">Miércoles</th>
                  <th class="px-3 py-2 text-center text-sm font-semibold text-gray-700">Jueves</th>
                  <th class="px-3 py-2 text-center text-sm font-semibold text-gray-700">Viernes</th>
                  <th class="px-3 py-2 text-center text-sm font-semibold text-gray-700">Sábado</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="horario in horarios" :key="horario" class="border-t border-gray-200">
                  <td class="px-3 py-3 text-sm text-gray-600 font-medium">{{ horario }}</td>
                  <td v-for="dia in dias" :key="`${horario}-${dia}`" class="px-3 py-3 text-center">
                    <button
                      type="button"
                      @click="toggleHorario(horario, dia)"
                      :class="isHorarioSelected(horario, dia) ? 'bg-sky-400' : 'bg-gray-200'"
                      class="w-16 h-8 rounded-full transition-colors duration-200 hover:opacity-80"
                    ></button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Buttons -->
        <div class="flex gap-3 justify-end pt-4">
          <button
            type="button"
            @click="handleCancel"
            class="px-6 py-2 text-gray-700 bg-gray-200 rounded-full font-medium hover:bg-gray-300 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="submit"
            class="px-6 py-2 bg-sky-400 text-white rounded-full font-medium hover:bg-sky-500 transition-colors flex items-center gap-2"
          >
            <span>+</span>
            Crear Usuario
          </button>
        </div>
      </form>
    </div>
  </div>
  </Sidebar>
</template>

<script setup>
import { ref } from 'vue'
import Sidebar from '../../components/Sidebar.vue'

const formData = ref({
  nombre: '',
  apellido: '',
  carrera: '',
  horarios: []
})

const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const horarios = ['08-10', '10-12', '12-14', '14-16', '16-18']

const toggleHorario = (horario, dia) => {
  const key = `${horario}-${dia}`
  const index = formData.value.horarios.indexOf(key)
  if (index > -1) {
    formData.value.horarios.splice(index, 1)
  } else {
    formData.value.horarios.push(key)
  }
}

const isHorarioSelected = (horario, dia) => {
  return formData.value.horarios.includes(`${horario}-${dia}`)
}

const handleSubmit = () => {
  console.log('Formulario enviado:', formData.value)
  // Aquí se conectará con el backend
}

const handleCancel = () => {
  formData.value = {
    nombre: '',
    apellido: '',
    carrera: '',
    horarios: []
  }
  console.log('Formulario cancelado')
}
</script>
