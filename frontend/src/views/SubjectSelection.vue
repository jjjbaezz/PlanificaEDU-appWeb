<!-- src/views/student/SubjectSelection.vue -->
<script setup>
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { useRouter } from 'vue-router'
import Sidebar from '../components/Sidebar.vue'
import StatCard from '../components/student/StatCard.vue'
import http from '../services/http'

const auth = useAuthStore()
const router = useRouter()

// Estados
const loading = ref(false)
const error = ref(null)
const activeStep = ref(1)
const searchQuery = ref('')

// Datos
const materias = ref([])
const periodos = ref([])
const seleccionesActuales = ref([])
const periodoSeleccionado = ref(null)
const carreraActual = ref(null)
const misInscripciones = ref([])
const grupoSeleccionadoParaInscripcion = ref(null)

// Estadísticas
const stats = computed(() => {
  const totalMaterias = materias.value.length
  const disponibles = materias.value.filter(m => m.disponible).length
  const seleccionadas = materias.value.filter(m => m.seleccionada).length
  const creditosSeleccionados = materias.value
    .filter(m => m.seleccionada)
    .reduce((sum, m) => sum + (m.creditos || 0), 0)
  
  const gruposInscritos = misInscripciones.value.length
  const creditosInscritos = misInscripciones.value.reduce((sum, i) => 
    sum + (i.grupo?.materia?.creditos || 0), 0)

  return {
    total: totalMaterias,
    disponibles,
    seleccionadas,
    creditos: creditosSeleccionados,
    gruposInscritos,
    creditosInscritos
  }
})

// Filtros
const filtroDisponibilidad = ref('')
const filtroPrerrequisitos = ref('')

// Materias filtradas
const materiasFiltradas = computed(() => {
  return materias.value.filter(materia => {
    // Filtro de búsqueda
    const queryMatch = searchQuery.value
      ? (materia.codigo?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
         materia.nombre?.toLowerCase().includes(searchQuery.value.toLowerCase()))
      : true

    // Filtro por disponibilidad
    const disponibilidadMatch = filtroDisponibilidad.value
      ? (() => {
          switch(filtroDisponibilidad.value) {
            case 'disponible': return materia.disponible
            case 'no-disponible': return !materia.disponible
            default: return true
          }
        })()
      : true

    // Filtro por prerrequisitos
    const prerrequisitosMatch = filtroPrerrequisitos.value
      ? (() => {
          switch(filtroPrerrequisitos.value) {
            case 'cumplidos': return materia.prerrequisitos?.every(p => p.cumplido) || true
            case 'pendientes': return materia.prerrequisitos?.some(p => !p.cumplido) || false
            default: return true
          }
        })()
      : true

    return queryMatch && disponibilidadMatch && prerrequisitosMatch
  })
})

// Función para alternar selección de materia
const toggleMateria = (materia) => {
  if (!materia.disponible && !materia.seleccionada) {
    alert('Esta materia no está disponible para inscripción')
    return
  }
  
  materia.seleccionada = !materia.seleccionada
}

// ============ NUEVAS FUNCIONES PARA INSCRIPCIONES REALES ============

// Verificar disponibilidad de un grupo específico
const verificarDisponibilidadGrupo = async (grupoId) => {
  try {
    console.log('🔍 Verificando disponibilidad del grupo:', grupoId)
    
    const response = await http.get(`/real-enrollment/check-availability/${grupoId}`)
    console.log('✅ Resultado de verificación:', response.data)
    
    return response.data
  } catch (err) {
    console.error('❌ Error verificando disponibilidad:', err)
    return { 
      disponible: false, 
      message: err.response?.data?.message || 'Error al verificar disponibilidad' 
    }
  }
}

// Inscribirse en un grupo
const inscribirEnGrupo = async (grupoId) => {
  if (!confirm('¿Estás seguro de que deseas inscribirte en este grupo?')) {
    return
  }

  loading.value = true
  try {
    console.log('📝 Inscribiendo en grupo:', grupoId)
    
    const response = await http.post('/real-enrollment/enroll', {
      grupoId
    })
    
    console.log('✅ Respuesta de inscripción:', response.data)
    
    if (response.data.success) {
      // Actualizar estadísticas del grupo localmente
      actualizarGrupoLocalmente(grupoId, response.data.grupo)
      
      // Recargar inscripciones
      await cargarMisInscripciones()
      
      // Recargar materias para actualizar cupos
      await loadMateriasDisponibles()
      
      alert('✅ ' + response.data.message)
      return { success: true, data: response.data }
    }
    
    return { success: false, message: response.data.message }
  } catch (err) {
    console.error('❌ Error inscribiendo en grupo:', err)
    const errorMsg = err.response?.data?.message || 'Error al inscribirse en el grupo'
    alert('❌ ' + errorMsg)
    return { 
      success: false, 
      message: errorMsg 
    }
  } finally {
    loading.value = false
  }
}

// Cancelar inscripción
const cancelarInscripcion = async (inscripcionId) => {
  if (!confirm('¿Estás seguro de que deseas cancelar esta inscripción?')) {
    return
  }

  loading.value = true
  try {
    console.log('🗑️ Cancelando inscripción:', inscripcionId)
    
    const response = await http.delete(`/real-enrollment/cancel/${inscripcionId}`)
    
    console.log('✅ Respuesta de cancelación:', response.data)
    
    if (response.data.success) {
      // Actualizar estadísticas del grupo localmente
      const inscripcion = misInscripciones.value.find(i => i.id === inscripcionId)
      if (inscripcion) {
        actualizarGrupoLocalmente(inscripcion.grupo.id, response.data.grupo)
      }
      
      // Recargar inscripciones
      await cargarMisInscripciones()
      
      // Recargar materias para actualizar cupos
      await loadMateriasDisponibles()
      
      alert('✅ ' + response.data.message)
      return { success: true, data: response.data }
    }
    
    return { success: false, message: response.data.message }
  } catch (err) {
    console.error('❌ Error cancelando inscripción:', err)
    const errorMsg = err.response?.data?.message || 'Error al cancelar inscripción'
    alert('❌ ' + errorMsg)
    return { 
      success: false, 
      message: errorMsg 
    }
  } finally {
    loading.value = false
  }
}

// Cargar mis inscripciones actuales
const cargarMisInscripciones = async () => {
  try {
    console.log('📋 Cargando mis inscripciones...')
    
    const response = await http.get('/real-enrollment/my-enrollments', {
      params: { periodoId: periodoSeleccionado.value }
    })
    
    console.log('✅ Inscripciones cargadas:', response.data)
    
    if (response.data.success) {
      misInscripciones.value = response.data.inscripciones || []
      console.log(`📋 ${misInscripciones.value.length} inscripciones cargadas`)
    }
    
    return misInscripciones.value
  } catch (err) {
    console.error('❌ Error cargando inscripciones:', err)
    // No lanzar error si no hay inscripciones
    if (err.response?.status !== 404) {
      throw err
    }
    return []
  }
}

// Verificar si ya estoy inscrito en un grupo
const estoyInscritoEnGrupo = (grupoId) => {
  return misInscripciones.value.some(inscripcion => 
    inscripcion.grupo?.id === grupoId
  )
}

// Obtener mi inscripción en un grupo
const obtenerMiInscripcionEnGrupo = (grupoId) => {
  return misInscripciones.value.find(inscripcion => 
    inscripcion.grupo?.id === grupoId
  )
}

// Actualizar grupo localmente después de cambios
const actualizarGrupoLocalmente = (grupoId, nuevosDatos) => {
  materias.value.forEach(materia => {
    if (materia.detalles_grupos) {
      materia.detalles_grupos.forEach(grupo => {
        if (grupo.id === grupoId) {
          grupo.inscritos = nuevosDatos.inscritos
          grupo.disponibles = nuevosDatos.disponibles
          grupo.porcentaje_ocupado = nuevosDatos.porcentaje_ocupado
        }
      })
    }
  })
}

// Verificar disponibilidad antes de inscribir
const verificarYInscribir = async (grupo) => {
  grupoSeleccionadoParaInscripcion.value = grupo
  
  // Verificar disponibilidad primero
  const verificacion = await verificarDisponibilidadGrupo(grupo.id)
  
  if (verificacion.disponible) {
    // Preguntar al usuario
    if (confirm(`¿Deseas inscribirte en ${grupo.seccion}?\n${grupo.disponibles} cupos disponibles.`)) {
      await inscribirEnGrupo(grupo.id)
    }
  } else {
    // Mostrar motivo de no disponibilidad
    let mensaje = `No puedes inscribirte en este grupo:\n${verificacion.message}`
    
    if (verificacion.motivo === 'CONFLICTO_HORARIO' && verificacion.conflictos) {
      mensaje += '\n\nConflictos encontrados:'
      verificacion.conflictos.forEach(conflicto => {
        mensaje += `\n• ${conflicto.dia} ${conflicto.hora_grupo} - ${conflicto.materia_conflicto}`
      })
    }
    
    alert(mensaje)
  }
  
  grupoSeleccionadoParaInscripcion.value = null
}

// ============ FUNCIONES EXISTENTES ACTUALIZADAS ============

// Cargar datos iniciales
const loadData = async () => {
  loading.value = true
  error.value = null

  try {
    console.log('🔄 Cargando datos iniciales...')
    
    // 1. Cargar periodos disponibles
    const periodosResponse = await http.get('/periods')
    console.log('📅 Periodos cargados:', periodosResponse.data)
    
    periodos.value = periodosResponse.data.periods || []
    
    // Buscar periodo activo por defecto
    const periodoActivo = periodos.value.find(p => p.activo)
    if (periodoActivo) {
      periodoSeleccionado.value = periodoActivo.id
      console.log('🎯 Periodo activo seleccionado:', periodoActivo.nombre)
    } else if (periodos.value.length > 0) {
      periodoSeleccionado.value = periodos.value[0].id
      console.log('🎯 Primer periodo seleccionado:', periodos.value[0].nombre)
    }

    // 2. Cargar materias disponibles si hay periodo seleccionado
    if (periodoSeleccionado.value) {
      await loadMateriasDisponibles()
      await loadSeleccionesActuales()
      await cargarMisInscripciones()
    } else {
      console.warn('⚠️ No hay periodo seleccionado')
    }

  } catch (err) {
    console.error('❌ Error cargando datos:', err)
    error.value = err.response?.data?.message || err.message || 'Error desconocido'
    
    if (err.response?.status === 401) {
      alert('Sesión expirada. Por favor, vuelve a iniciar sesión.')
      auth.logout()
      router.push('/login')
    } else {
      alert('Error al cargar datos: ' + error.value)
    }
  } finally {
    loading.value = false
  }
}

// Cargar materias disponibles
const loadMateriasDisponibles = async () => {
  try {
    console.log('📚 Cargando materias para periodo:', periodoSeleccionado.value)
    
    const response = await http.get('/subject-selection/available', {
      params: { periodoId: periodoSeleccionado.value }
    })
    
    console.log('✅ Respuesta de materias:', response.data)
    
    if (response.data.success) {
      materias.value = response.data.materias.map(materia => ({
        ...materia,
        seleccionada: materia.seleccionada || false,
        // Asegurar que detalles_grupos tengan profesor
        detalles_grupos: materia.detalles_grupos?.map(grupo => ({
          ...grupo,
          profesor: grupo.profesor || { nombre: 'No asignado' }
        })) || []
      }))
      
      carreraActual.value = response.data.carrera
      
      console.log(`✅ ${materias.value.length} materias cargadas`)
      console.log(`✅ ${response.data.disponibles} materias disponibles`)
    } else {
      throw new Error(response.data.message || 'Error al cargar materias')
    }
  } catch (err) {
    console.error('❌ Error cargando materias:', err)
    
    // Mostrar error detallado
    if (err.response) {
      console.error('📊 Detalles del error:', {
        status: err.response.status,
        data: err.response.data,
        headers: err.response.headers
      })
    }
    
    throw err
  }
}

// Cargar selecciones actuales
const loadSeleccionesActuales = async () => {
  try {
    console.log('📝 Cargando selecciones actuales...')
    
    const response = await http.get('/subject-selection/selections', {
      params: { periodoId: periodoSeleccionado.value }
    })
    
    console.log('✅ Selecciones cargadas:', response.data)
    
    if (response.data.success) {
      seleccionesActuales.value = response.data.selecciones || []
      
      // Marcar como seleccionadas en la lista de materias
      seleccionesActuales.value.forEach(seleccion => {
        const materia = materias.value.find(m => m.id === seleccion.materia_id)
        if (materia) {
          materia.seleccionada = true
        }
      })
      
      console.log(`✅ ${seleccionesActuales.value.length} selecciones cargadas`)
    }
  } catch (err) {
    console.error('❌ Error cargando selecciones:', err)
    // No lanzar error si no hay selecciones
    if (err.response?.status !== 404) {
      throw err
    }
  }
}

// Guardar selecciones
const guardarSelecciones = async () => {
  if (stats.value.seleccionadas === 0) {
    alert('Debes seleccionar al menos una materia')
    return
  }

  loading.value = true
  try {
    const materiasSeleccionadasIds = materias.value
      .filter(m => m.seleccionada)
      .map(m => m.id)

    console.log('💾 Guardando selecciones:', materiasSeleccionadasIds)

    const response = await http.post('/subject-selection/select', {
      periodoId: periodoSeleccionado.value,
      materias: materiasSeleccionadasIds
    })

    console.log('✅ Respuesta de guardado:', response.data)

    if (response.data.success) {
      // Actualizar selecciones actuales
      await loadSeleccionesActuales()
      
      // Ir al paso de confirmación
      activeStep.value = 2
      
      alert('✅ ' + response.data.message)
    } else {
      throw new Error(response.data.message)
    }
  } catch (err) {
    console.error('❌ Error guardando selecciones:', err)
    alert(err.response?.data?.message || 'Error al guardar selecciones')
  } finally {
    loading.value = false
  }
}

// Generar horario
const generarHorario = async () => {
  if (stats.value.seleccionadas === 0) {
    alert('Debes seleccionar al menos una materia para generar el horario');
    return;
  }

  loading.value = true;
  try {
    console.log('🔄 Generando horario...');
    
    const response = await http.post('/personal-schedule/generate', {
      periodoId: periodoSeleccionado.value
    });

    console.log('✅ Respuesta de generación:', response.data);

    if (response.data.success) {
      // Redirigir a la vista de horarios generados
      router.push({
        name: 'student-schedules',
        query: { 
          periodoId: periodoSeleccionado.value,
          horarioId: response.data.horario.id 
        }
      });
    } else {
      throw new Error(response.data.message);
    }
  } catch (err) {
    console.error('❌ Error generando horario:', err);
    
    
    let mensaje = err.response?.data?.message || 'Error al generar horario';
    
    // Mensajes más específicos
    if (mensaje.includes('No hay suficientes grupos')) {
      mensaje = 'Algunas materias no tienen grupos disponibles. Revisa tus selecciones.';
    } else if (mensaje.includes('conflicto')) {
      mensaje = 'No se pudo encontrar un horario sin conflictos. Intenta con menos materias o diferentes selecciones.';
    }
    
    alert(mensaje);
    console.error('❌ Detalles del error:', err.response);

    
  } finally {
    loading.value = false;
  }
};

// Limpiar selecciones
const limpiarSelecciones = async () => {
  if (!confirm('¿Estás seguro de que deseas limpiar todas tus selecciones?')) {
    return
  }

  loading.value = true
  try {
    console.log('🗑️ Limpiando selecciones...')
    
    const response = await http.delete('/subject-selection/clear', {
      data: { periodoId: periodoSeleccionado.value }
    })

    console.log('✅ Respuesta de limpieza:', response.data)

    if (response.data.success) {
      // Resetear selecciones
      materias.value.forEach(m => {
        m.seleccionada = false
      })
      seleccionesActuales.value = []
      
      alert('✅ ' + response.data.message)
    } else {
      throw new Error(response.data.message)
    }
  } catch (err) {
    console.error('❌ Error limpiando selecciones:', err)
    alert(err.response?.data?.message || 'Error al limpiar selecciones')
  } finally {
    loading.value = false
  }
}

// Cambiar periodo
const cambiarPeriodo = async (nuevoPeriodoId) => {
  console.log('🔄 Cambiando periodo a:', nuevoPeriodoId)
  periodoSeleccionado.value = nuevoPeriodoId
  await loadMateriasDisponibles()
  await loadSeleccionesActuales()
  await cargarMisInscripciones()
}

// Formatear información de prerrequisitos
const formatPrerrequisitos = (prerrequisitos) => {
  if (!prerrequisitos || prerrequisitos.length === 0) {
    return 'Sin prerrequisitos'
  }

  const cumplidos = prerrequisitos.filter(p => p.cumplido).length
  const total = prerrequisitos.length
  
  return `${cumplidos}/${total} cumplidos`
}

// Obtener color de badge según estado
const getBadgeColor = (materia) => {
  if (!materia.disponible) return 'bg-red-100 text-red-800'
  if (materia.seleccionada) return 'bg-green-100 text-green-800'
  return 'bg-gray-100 text-gray-800'
}

// Obtener color de badge de créditos
const getCreditosBadgeColor = (creditos) => {
  if (creditos >= 4) return 'bg-red-100 text-red-800'
  if (creditos >= 3) return 'bg-orange-100 text-orange-800'
  if (creditos >= 2) return 'bg-yellow-100 text-yellow-800'
  return 'bg-green-100 text-green-800'
}

// Obtener color para grupo según disponibilidad
const getGrupoBadgeColor = (grupo) => {
  if (grupo.disponibles <= 0) return 'bg-red-100 text-red-800'
  if (grupo.disponibles < 5) return 'bg-orange-100 text-orange-800'
  if (estoyInscritoEnGrupo(grupo.id)) return 'bg-green-100 text-green-800'
  return 'bg-blue-100 text-blue-800'
}

// Formatear hora
const formatHora = (horaString) => {
  if (!horaString) return ''
  const hora = new Date(horaString)
  return hora.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
}

// Inicialización
onMounted(() => {
  console.log('🚀 Componente montado')
  loadData()
})
</script>

<template>
  <Sidebar>
    <!-- Header -->
    <header class="sticky top-0 bg-white border-b border-gray-200 z-20 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex items-center justify-between">
        <div>
          <h1 class="text-3xl font-bold text-gray-900">Selección de Materias</h1>
          <p class="text-gray-600 mt-1" v-if="carreraActual">
            Carrera: {{ carreraActual?.nombre }} • {{ stats.disponibles }} materias disponibles
          </p>
        </div>
        <div class="flex items-center gap-4">
          <div class="w-10 h-10 bg-blue-200 rounded-full flex items-center justify-center font-bold text-blue-700 text-sm">
            {{ auth.user?.nombre?.charAt(0) || 'E' }}
          </div>
          <div>
            <p class="text-sm font-bold text-gray-900">{{ auth.user?.nombre || 'Estudiante' }}</p>
            <p class="text-gray-500 text-sm mt-1">ESTUDIANTE</p>
          </div>
        </div>
      </div>
    </header>

    <!-- Steps Indicator -->
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      <div class="flex items-center justify-center mb-8">
        <div class="flex items-center">
          <!-- Step 1 -->
          <div class="flex items-center">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg border-2',
              activeStep >= 1 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-400 border-gray-300'
            ]">
              1
            </div>
            <div class="ml-3">
              <p class="font-medium text-gray-900">Selección</p>
              <p class="text-sm text-gray-500">Elige tus materias</p>
            </div>
          </div>
          
          <!-- Connector -->
          <div class="h-0.5 w-16 bg-gray-300 mx-4"></div>
          
          <!-- Step 2 -->
          <div class="flex items-center">
            <div :class="[
              'w-10 h-10 rounded-full flex items-center justify-center font-semibold text-lg border-2',
              activeStep >= 2 
                ? 'bg-blue-500 text-white border-blue-500' 
                : 'bg-white text-gray-400 border-gray-300'
            ]">
              2
            </div>
            <div class="ml-3">
              <p class="font-medium text-gray-900">Confirmación</p>
              <p class="text-sm text-gray-500">Revisa y genera horario</p>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 pb-12">
      <!-- Error Message -->
      <div v-if="error" class="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div class="flex items-center">
          <svg class="w-5 h-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
          </svg>
          <p class="text-red-800">{{ error }}</p>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <StatCard 
          label="Materias disponibles" 
          :value="stats.disponibles" 
          icon="📚"
          color="bg-blue-500"
        />
        <StatCard 
          label="Materias seleccionadas" 
          :value="stats.seleccionadas" 
          icon="✓"
          color="bg-green-500"
        />
        <StatCard 
          label="Créditos seleccionados" 
          :value="stats.creditos" 
          icon="⭐"
          color="bg-purple-500"
        />
        <StatCard 
          label="Grupos inscritos" 
          :value="stats.gruposInscritos" 
          icon="👥"
          color="bg-orange-500"
        />
      </div>

      <!-- Period Selector -->
      <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">Periodo Académico</h3>
        <div class="flex flex-wrap gap-3">
          <button
            v-for="periodo in periodos"
            :key="periodo.id"
            @click="cambiarPeriodo(periodo.id)"
            :class="[
              'px-4 py-3 rounded-lg border transition-all font-medium',
              periodoSeleccionado === periodo.id
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
            ]"
            :disabled="loading"
          >
            {{ periodo.nombre }}
            <span v-if="periodo.activo" class="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
              Activo
            </span>
          </button>
          <div v-if="periodos.length === 0" class="text-gray-500 italic">
            No hay periodos disponibles
          </div>
        </div>
      </div>

      <!-- Step 1: Materias Selection -->
      <div v-if="activeStep === 1" class="space-y-8">
        <!-- Search and Filters Bar -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div class="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div class="flex-1 relative w-full md:w-auto">
              <svg class="absolute left-3 top-3 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                v-model="searchQuery"
                type="text"
                placeholder="Buscar por código o nombre..."
                class="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                :disabled="loading"
              />
            </div>

            <div class="flex gap-3 flex-wrap items-center">
              <!-- Filtro por Disponibilidad -->
              <select
                v-model="filtroDisponibilidad"
                class="px-4 py-3 border border-gray-300 rounded-lg bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                :disabled="loading"
              >
                <option value="">Todas las materias</option>
                <option value="disponible">Solo disponibles</option>
                <option value="no-disponible">No disponibles</option>
              </select>

              <!-- Botón Limpiar -->
              <button
                @click="limpiarSelecciones"
                class="px-4 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition flex items-center gap-2 whitespace-nowrap"
                :disabled="loading || stats.seleccionadas === 0"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
                Limpiar selecciones
              </button>

              <!-- Botón Continuar -->
              <button
                @click="guardarSelecciones"
                :disabled="loading || stats.seleccionadas === 0"
                class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-lg transition flex items-center gap-2 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Continuar ({{ stats.seleccionadas }})
              </button>
            </div>
          </div>
        </div>

        <!-- Materias List -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div v-if="loading && materias.length === 0" class="p-8 text-center">
            <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-500"></div>
            <p class="mt-4 text-gray-600">Cargando materias...</p>
          </div>

          <div v-else-if="materias.length === 0" class="p-8 text-center">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75l-3.75 3.75m0 0l-3.75-3.75M3 12h18" />
            </svg>
            <p class="text-lg font-medium text-gray-900">No se encontraron materias</p>
            <p class="text-gray-600 mt-1">Selecciona un periodo o verifica que tengas carrera asignada.</p>
          </div>

          <div v-else-if="materiasFiltradas.length === 0" class="p-8 text-center">
            <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 3.75l-3.75 3.75m0 0l-3.75-3.75M3 12h18" />
            </svg>
            <p class="text-lg font-medium text-gray-900">No hay materias con esos filtros</p>
            <p class="text-gray-600 mt-1">Intenta con otros términos de búsqueda.</p>
          </div>

          <div v-else class="divide-y divide-gray-200">
            <div
              v-for="materia in materiasFiltradas"
              :key="materia.id"
              class="p-6 hover:bg-gray-50 transition-colors"
            >
              <div class="flex items-start gap-4">
                <!-- Checkbox -->
                <div class="flex-shrink-0 pt-1">
                  <input
                    type="checkbox"
                    :id="'materia-' + materia.id"
                    :checked="materia.seleccionada"
                    @change="toggleMateria(materia)"
                    :disabled="!materia.disponible && !materia.seleccionada"
                    class="h-5 w-5 text-blue-500 rounded focus:ring-blue-400"
                  />
                </div>

                <!-- Materia Info -->
                <div class="flex-1">
                  <div class="flex items-start justify-between">
                    <div>
                      <div class="flex items-center gap-3">
                        <h3 class="text-lg font-semibold text-gray-900">
                          {{ materia.codigo }} - {{ materia.nombre }}
                        </h3>
                        <span :class="['px-3 py-1 rounded-full text-xs font-medium', getBadgeColor(materia)]">
                          {{ materia.disponible ? 'Disponible' : 'No disponible' }}
                          {{ materia.seleccionada ? '✓' : '' }}
                        </span>
                      </div>
                      <p class="text-gray-600 mt-1">
                        {{ materia.creditos }} créditos • 
                        {{ materia.grupos_disponibles || 0 }} grupos disponibles
                      </p>
                    </div>

                    <span :class="['px-3 py-1 rounded-full text-xs font-medium', getCreditosBadgeColor(materia.creditos)]">
                      {{ materia.creditos }} créditos
                    </span>
                  </div>

                  <!-- Prerrequisitos -->
                  <div class="mt-3">
                    <p class="text-sm text-gray-700">
                      <span class="font-medium">Prerrequisitos:</span> 
                      {{ formatPrerrequisitos(materia.prerrequisitos) }}
                    </p>
                    <div v-if="materia.prerrequisitos && materia.prerrequisitos.length > 0" class="mt-2">
                      <div class="flex flex-wrap gap-2">
                        <span
                          v-for="prereq in materia.prerrequisitos"
                          :key="prereq.id"
                          :class="[
                            'px-2 py-1 rounded text-xs',
                            prereq.cumplido 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          ]"
                        >
                          {{ prereq.codigo }}
                          {{ prereq.cumplido ? '✓' : '✗' }}
                        </span>
                      </div>
                    </div>
                  </div>

                  <!-- Detalles de Grupos (acordeón) -->
                  <div v-if="materia.detalles_grupos && materia.detalles_grupos.length > 0" class="mt-4">
                    <details class="group">
                      <summary class="flex items-center justify-between cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                        <span>Ver grupos disponibles ({{ materia.detalles_grupos.length }})</span>
                        <svg class="w-5 h-5 transform group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </summary>
                      <div class="mt-3 space-y-3">
                        <div
                          v-for="grupo in materia.detalles_grupos"
                          :key="grupo.id"
                          class="bg-gray-50 rounded-lg p-4"
                        >
                          <div class="flex justify-between items-start">
                            <div>
                              <p class="font-medium text-gray-900">Sección {{ grupo.seccion }}</p>
                              <p class="text-sm text-gray-600">
                                Profesor: {{ grupo.profesor?.nombre || 'No asignado' }}
                              </p>
                            </div>
                            <div class="text-right">
                              <p class="text-sm font-medium text-gray-900">
                                {{ grupo.disponibles }} / {{ grupo.cupo_max }} cupos
                              </p>
                              <p class="text-xs text-gray-500">
                                {{ grupo.inscritos }} inscritos
                              </p>
                            </div>
                          </div>
                          
                          <!-- Estado del grupo -->
                          <div class="mt-2">
                            <span :class="['px-2 py-1 rounded text-xs font-medium', getGrupoBadgeColor(grupo)]">
                              <span v-if="estoyInscritoEnGrupo(grupo.id)">✅ Inscrito</span>
                              <span v-else-if="grupo.disponibles <= 0">❌ Sin cupo</span>
                              <span v-else-if="grupo.disponibles < 5">⚠️ Poco cupo</span>
                              <span v-else>✅ Disponible</span>
                            </span>
                          </div>
                          
                          <!-- Horarios del grupo -->
                          <div v-if="grupo.horarios && grupo.horarios.length > 0" class="mt-2">
                            <div class="flex flex-wrap gap-2">
                              <span
                                v-for="horario in grupo.horarios"
                                :key="horario.bloque_id"
                                class="px-2 py-1 bg-blue-50 text-blue-700 rounded text-xs"
                              >
                                {{ horario.dia }} {{ formatHora(horario.hora_inicio) }}-{{ formatHora(horario.hora_fin) }}
                              </span>
                            </div>
                          </div>

                          <!-- Acciones del grupo -->
                          <div class="mt-3 pt-3 border-t border-gray-200">
                            <div v-if="estoyInscritoEnGrupo(grupo.id)">
                              <button
                                @click="cancelarInscripcion(obtenerMiInscripcionEnGrupo(grupo.id)?.id)"
                                :disabled="loading"
                                class="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded transition flex items-center justify-center gap-2"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                                Cancelar inscripción
                              </button>
                            </div>
                            <div v-else>
                              <!-- <button
                                @click="verificarYInscribir(grupo)"
                                :disabled="loading || grupo.disponibles <= 0"
                                :class="[
                                  'w-full px-3 py-2 text-sm font-medium rounded transition flex items-center justify-center gap-2',
                                  grupo.disponibles <= 0
                                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-500 hover:bg-blue-600 text-white'
                                ]"
                              >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                                </svg>
                                {{ loading && grupoSeleccionadoParaInscripcion?.id === grupo.id ? 'Inscribiendo...' : 'Inscribirse' }}
                              </button> -->
                            </div>
                          </div>
                        </div>
                      </div>
                    </details>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 2: Confirmation -->
      <div v-if="activeStep === 2" class="space-y-8">
        <!-- Resumen de Selección -->
        <div class="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">Resumen de tu selección</h3>
          
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <!-- Materias seleccionadas -->
            <div class="col-span-2">
              <h4 class="font-medium text-gray-700 mb-3">Materias seleccionadas ({{ stats.seleccionadas }})</h4>
              <div v-if="materias.filter(m => m.seleccionada).length === 0" class="text-gray-500 italic p-4">
                No hay materias seleccionadas
              </div>
              <div v-else class="space-y-3">
                <div
                  v-for="materia in materias.filter(m => m.seleccionada)"
                  :key="materia.id"
                  class="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div>
                    <p class="font-medium text-gray-900">{{ materia.codigo }} - {{ materia.nombre }}</p>
                    <p class="text-sm text-gray-600">{{ materia.creditos }} créditos</p>
                  </div>
                  <button
                    @click="toggleMateria(materia)"
                    class="text-red-600 hover:text-red-800"
                  >
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <!-- Mis inscripciones actuales -->
              <div class="mt-6">
                <h4 class="font-medium text-gray-700 mb-3">Mis inscripciones actuales ({{ stats.gruposInscritos }})</h4>
                <div v-if="misInscripciones.length === 0" class="text-gray-500 italic p-4">
                  No tienes inscripciones en este periodo
                </div>
                <div v-else class="space-y-2">
                  <div
                    v-for="inscripcion in misInscripciones"
                    :key="inscripcion.id"
                    class="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
                  >
                    <div>
                      <p class="font-medium text-blue-900">
                        {{ inscripcion.grupo?.materia?.codigo }} - {{ inscripcion.grupo?.materia?.nombre }}
                      </p>
                      <!-- <p class="text-sm text-blue-700">
                        Sección {{ inscripcion.grupo?.seccion }} • 
                        Profesor: {{ inscripcion.grupo?.profesor?.nombre || 'No asignado' }}
                      </p> -->
                    </div>
                    <button
                      @click="cancelarInscripcion(inscripcion.id)"
                      class="text-red-600 hover:text-red-800 text-sm"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Resumen -->
            <div>
              <h4 class="font-medium text-gray-700 mb-3">Resumen</h4>
              <div class="space-y-4">
                <div class="p-4 bg-blue-50 rounded-lg">
                  <p class="text-sm text-gray-600">Total de créditos seleccionados</p>
                  <p class="text-2xl font-bold text-blue-700">{{ stats.creditos }}</p>
                </div>
                <div class="p-4 bg-green-50 rounded-lg">
                  <p class="text-sm text-gray-600">Materias seleccionadas</p>
                  <p class="text-2xl font-bold text-green-700">{{ stats.seleccionadas }}</p>
                </div>
                <div class="p-4 bg-orange-50 rounded-lg">
                  <p class="text-sm text-gray-600">Grupos inscritos</p>
                  <p class="text-2xl font-bold text-orange-700">{{ stats.gruposInscritos }}</p>
                </div>
                <div class="p-4 bg-purple-50 rounded-lg">
                  <p class="text-sm text-gray-600">Periodo académico</p>
                  <p class="font-medium text-purple-700">
                    {{ periodos.find(p => p.id === periodoSeleccionado)?.nombre || 'No seleccionado' }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Actions -->
          <div class="mt-8 pt-6 border-t border-gray-200 flex justify-between">
            <button
              @click="activeStep = 1"
              class="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition font-medium flex items-center gap-2"
              :disabled="loading"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Volver a selección
            </button>

            <div class="flex gap-3">
              <button
                @click="limpiarSelecciones"
                class="px-6 py-3 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition font-medium"
                :disabled="loading"
              >
                Limpiar todo
              </button>

              <button
                @click="generarHorario"
                :disabled="loading || stats.seleccionadas === 0"
                class="px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition font-medium flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                {{ loading ? 'Generando...' : 'Generar horario automático' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Información adicional -->
        <div class="bg-blue-50 border border-blue-200 rounded-2xl p-6">
          <div class="flex items-start gap-4">
            <div class="flex-shrink-0">
              <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h4 class="font-semibold text-blue-900">¿Qué pasa después?</h4>
              <p class="text-blue-800 mt-1">
                Al generar el horario, nuestro sistema inteligente buscará la mejor combinación de grupos
                para tus materias seleccionadas, considerando tus preferencias y evitando conflictos de horario.
                Luego podrás visualizar y editar el horario generado.
              </p>
              <p class="text-blue-800 mt-2">
                <strong>Nota:</strong> Las inscripciones manuales en grupos no afectan la generación automática del horario.
                Si te inscribes manualmente en un grupo, asegúrate de que no haya conflictos con otras materias.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  </Sidebar>
</template>

<style scoped>
.animate-spin {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>