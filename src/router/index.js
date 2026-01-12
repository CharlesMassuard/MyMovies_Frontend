import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainView from '../views/MainView.vue'
import { useAuthStore } from '../stores/auth';

const routes = [
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        alias: ['/register'],
        meta: { public: true }
    },
    {
        path: '/',
        name: 'main',
        component: MainView,
        meta: { public: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (!to.meta.public && !authStore.isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router