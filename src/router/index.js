import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainView from '../views/MainView.vue'
import { useAuthStore } from '../stores/auth';
import MovieDetailsView from '../views/MovieDetailsView.vue';
import NotFoundView from '../views/NotFoundView.vue';

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
    },
    {
        path: '/movie/:id',
        name: 'movieDetails',
        component: MovieDetailsView,
        meta: { public: true }
    },
    //404
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: NotFoundView,
      meta: { public: true, hideHeader: true }
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();
  
  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    next('/');
  }
  else if (!to.meta.public && !authStore.isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router