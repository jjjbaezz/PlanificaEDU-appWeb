// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import UserTypeSelector from '../components/UserTypeSelector.vue'
import PreferenceSelector from '../components/PreferenceSelector.vue'
import Dashboard from '../views/Dashboard.vue'
import MateriasView from '../views/MateriasView.vue'
import MateriasAdminView from '../views/admin/MateriasAdminView.vue'
import ConfiguracionView from '../views/ConfiguracionView.vue'
import UsuariosView from '../views/admin/UsuariosView.vue'
import CarrerasView from '../views/admin/CarrerasView.vue'
import HorariosView from '../views/admin/HorariosView.vue'
import GroupEnrollmentsView from '../views/admin/GroupEnrollmentsView.vue'
import DashboardPro from '../views/DashboardProfesor.vue'
import Asignaturas from '../views/Asignaturas.vue'
import InscripcionView from '../views/InscripcionView.vue'

const routes = [
  { path: '/', redirect: '/login' },

  { path: '/login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', component: RegisterView, meta: { guestOnly: true } },

  { path: '/onboarding/type', component: UserTypeSelector, meta: { requiresAuth: true } },
  { path: '/onboarding/preferences', component: PreferenceSelector, meta: { requiresAuth: true } },

  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/dashboardProfesor', component: DashboardPro, meta: { requiresAuth: true } },
  { path: '/materias', component: MateriasView, meta: { requiresAuth: true } },
  { path: '/asignaturas', component: Asignaturas, meta: { requiresAuth: true } },
  { path: '/admin/materias', component: MateriasAdminView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/carreras', component: CarrerasView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/horarios', component: HorariosView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/admin/inscripciones', component: GroupEnrollmentsView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/usuarios', component: UsuariosView, meta: { requiresAuth: true, requiresAdmin: true } },
  { path: '/inscripcion', component: InscripcionView, meta: { requiresAuth: true, allowedRoles: ['ESTUDIANTE'] } },
  { path: '/configuracion', component: ConfiguracionView, meta: { requiresAuth: true } },
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
    return '/dashboard'
  }

  // Protege rutas que requieren rol ADMIN
  if (to.meta.requiresAdmin) {
    if (!auth.user) return '/login'
    if (auth.user?.rol !== 'ADMIN') return '/dashboard'
  }

  if (to.meta.allowedRoles) {
    if (!auth.user) return '/login'
    if (!to.meta.allowedRoles.includes(auth.user.rol)) return '/dashboard'
  }
})

export default router;
