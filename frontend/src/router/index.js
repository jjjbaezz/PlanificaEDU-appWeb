// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import UserTypeSelector from '../components/UserTypeSelector.vue'
import PreferenceSelector from '../components/PreferenceSelector.vue'

import Dashboard from '../views/Dashboard.vue'


import ConfiguracionView from '../views/ConfiguracionView.vue'
import UsuariosView from '../views/admin/UsuariosView.vue'
import CarrerasView from '../views/admin/CarrerasView.vue'
import HorariosView from '../views/admin/HorariosView.vue'
import GroupEnrollmentsView from '../views/admin/GroupEnrollmentsView.vue'
import Asignaturas from '../views/admin/Asignaturas.vue'
import InscripcionView from '../views/InscripcionView.vue'
import DashboardAdmin from '../views/DashboardAdmin.vue'
import DashboardProfesor from '../views/DashboardProfesor.vue'


const routes = [

  
  { path: '/', redirect: '/login' },

  { path: '/login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', component: RegisterView, meta: { guestOnly: true } },

  { path: '/onboarding/type', component: UserTypeSelector, meta: { requiresAuth: true } },
  { path: '/onboarding/preferences', component: PreferenceSelector, meta: { requiresAuth: true } },

  {
    path: '/dashboard',
    component: Dashboard,
    meta:
    {
      requiresAuth: true,
      allowedRoles: ['ESTUDIANTE']
    }
  },
  {
    path: '/dashboard/profesor',
    component: DashboardProfesor,
    meta:
    {
      requiresAuth: true,
      allowedRoles: ['PROFESOR']
    }
  },
  {
    path: '/dashboard/admin',
    component: DashboardAdmin,
    meta: {
      requiresAuth: true,
      allowedRoles: ['ADMIN']
    }
  },

  // Redirección universal a dashboard según rol
  { 
    path: '/home', 
    redirect: (to) => {
      const auth = useAuthStore()
      if (!auth.user) return '/login'
      
      switch(auth.user.rol) {
        case 'ESTUDIANTE': return '/dashboard'
        case 'PROFESOR': return '/dashboard/profesor'
        case 'ADMIN': return '/dashboard/admin'
        default: return '/onboarding/type'
      }
    },
    meta: { requiresAuth: true }
  },

   // RUTAS DE ESTUDIANTE
  { 
    path: '/asignaturas', 
    component: Asignaturas, 
    meta: { 
      requiresAuth: true, 
      allowedRoles: ['ESTUDIANTE'] 
    } 
  },
  { 
    path: '/inscripcion', 
    component: InscripcionView, 
    meta: { 
      requiresAuth: true, 
      allowedRoles: ['ESTUDIANTE'] 
    } 
  },

  // RUTAS DE ADMIN (todo bajo /admin/)
  { 
    path: '/admin/asignaturas', 
    component: Asignaturas, 
    meta: { 
      requiresAuth: true, 
      allowedRoles: ['ADMIN'] 
    } 
  },
  { 
    path: '/admin/carreras', 
    component: CarrerasView, 
    meta: { 
      requiresAuth: true, 
      allowedRoles: ['ADMIN'] 
    } 
  },
  { 
    path: '/admin/horarios', 
    component: HorariosView, 
    meta: { 
      requiresAuth: true, 
      allowedRoles: ['ADMIN'] 
    } 
  },
  { 
    path: '/admin/inscripciones', 
    component: GroupEnrollmentsView, 
    meta: { 
      requiresAuth: true, 
      allowedRoles: ['ADMIN'] 
    } 
  },
  { 
    path: '/admin/usuarios', 
    component: UsuariosView, 
    meta: { 
      requiresAuth: true, 
      allowedRoles: ['ADMIN'] 
    } 
  },

   // RUTAS DE PROFESOR
  { 
    path: '/profesor/asignaturas', 
    component: Asignaturas, 
    meta: { 
      requiresAuth: true, 
      allowedRoles: ['PROFESOR'] 
    } 
  },
  
   // Configuración (compartida para todos)
  { 
    path: '/configuracion', 
    component: ConfiguracionView, 
    meta: { 
      requiresAuth: true 
    } 
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

  if (to.query.resetSession === '1') {
    auth.logout()
    return { path: '/login', replace: true }
  }
  if (!auth.user && auth.token) {
    await auth.me()
  }

  if (to.meta.requiresAuth && !auth.isAuth) {
    return '/login'
  }

  if (to.meta.guestOnly && auth.isAuth) {
    if (!auth.user?.rol) return '/onboarding/type'

    switch(auth.user.rol) {
      case 'ESTUDIANTE': 
      
        if (!auth.user.preferencias && to.path !== '/onboarding/preferences') {
          return '/onboarding/preferences'
        }
        return '/dashboard'
      case 'PROFESOR': 
        return '/dashboard/profesor'
      case 'ADMIN': 
        return '/dashboard/admin'
      default: 
        return '/onboarding/type'
    }
  }

  if (to.meta.requiresAdmin) {
    if (!auth.user) return '/login'
    if (auth.user?.rol !== 'ADMIN') {
      switch(auth.user.rol) {
        case 'ESTUDIANTE': return '/dashboard'
        case 'PROFESOR': return '/dashboard/profesor'
        default: return '/onboarding/type'
      }
    }
  }

  if (to.meta.allowedRoles) {
    if (!auth.user) return '/login'
    
    if (!to.meta.allowedRoles.includes(auth.user.rol)) {
      switch(auth.user.rol) {
        case 'ESTUDIANTE': return '/dashboard'
        case 'PROFESOR': return '/dashboard/profesor'
        case 'ADMIN': return '/dashboard/admin'
        default: return '/onboarding/type'
      }
    }
  }

})

export default router;
