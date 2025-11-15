// src/router/index.js
import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import UserTypeSelector from '../components/UserTypeSelector.vue'
import PreferenceSelector from '../components/PreferenceSelector.vue'
import Dashboard from '../views/Dashboard.vue'
import DashboardPro from '../views/DashboardProfesor.vue'
import Asignaturas from '../views/Asignaturas.vue'

const routes = [
  { path: '/', redirect: '/login' },

  { path: '/login', component: LoginView, meta: { guestOnly: true } },
  { path: '/register', component: RegisterView, meta: { guestOnly: true } },

  { path: '/onboarding/type', component: UserTypeSelector, meta: { requiresAuth: true } },
  { path: '/onboarding/preferences', component: PreferenceSelector, meta: { requiresAuth: true } },

  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/dashboardProfesor', component: DashboardPro, meta: { requiresAuth: true } },
  { path: '/asignaturas', component: Asignaturas, meta: { requiresAuth: true } },

]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()

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
})

export default router;
