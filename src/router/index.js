import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainView from '../views/MainView.vue'
import { useAuthStore } from '../stores/auth';
import MovieDetailsView from '../views/MovieDetailsView.vue';
import NotFoundView from '../views/NotFoundView.vue';
import LibraryView from '../views/LibraryView.vue';
import ProfilView from '../views/ProfilView.vue';
import LegalNoticeView from '../views/LegalNoticeView.vue';
import PrivacyPolicyView from '../views/PrivacyPolicyView.vue';
import SerieDetailsView from '../views/SerieDetailsView.vue';

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
    {
      path: '/serie/:id',
      name: 'serieDetails',
      component: SerieDetailsView,
      meta: { public: true }
    },
    {
      path: '/library',
      name: 'library',
      component: LibraryView,
      meta: { public: false }
    },
    {
      path: '/profil',
      name: 'profil',
      component: ProfilView,
      meta: { public: false }
    },
    {
      path: '/mentions-legales',
      name: 'legalNotice',
      component: LegalNoticeView,
      meta: { public: true }
    },
    {
      path: '/confidentialite',
      name: 'privacyPolicy',
      component: PrivacyPolicyView,
      meta: { public: true }
    },
    //404
    {
      path: '/:pathMatch(.*)*',
      name: 'notFound',
      component: NotFoundView,
      meta: { public: true, hideHeader: true, hideFooter: true }
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