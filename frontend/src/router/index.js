import { createRouter, createWebHistory } from 'vue-router'

// Views
const LoginView = () => import('../views/LoginView.vue')
const RegisterView = () => import('../views/RegisterView.vue')

// Componentes 
const PreferenceSelector = () => import('../components/PreferenceSelector.vue')
const UserTypeSelector = () => import('../components/UserTypeSelector.vue')

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', name: 'login', component: LoginView },
  { path: '/register', name: 'register', component: RegisterView },

  // Eto son lo componente pa verlo
  { path: '/preferencias', name: 'preferencias', component: PreferenceSelector },
  { path: '/quien-eres', name: 'quien-eres', component: UserTypeSelector },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: { template: '<div style="padding:24px">404 - Página no encontrada</div>' } }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})
