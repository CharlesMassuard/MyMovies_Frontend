import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/LoginView.vue'),
    alias: ['/register'],
    meta: { public: true }
  },
  {
    path: '/',
    name: 'main',
    component: () => import('../views/MainView.vue'),
    meta: { public: true, transparentHeader: true }
  },
  {
    path: '/explore',
    name: 'explore',
    component: () => import('../views/ExploreView.vue'),
    meta: { public: true }
  },
  {
    path: '/search',
    name: 'search',
    component: () => import('../views/SearchView.vue'),
    meta: { public: true }
  },
  {
    path: '/movie/:id',
    name: 'movieDetails',
    component: () => import('../views/MovieDetailsView.vue'),
    meta: { public: true, transparentHeader: true }
  },
  {
    path: '/serie/:id',
    name: 'serieDetails',
    component: () => import('../views/SerieDetailsView.vue'),
    meta: { public: true, transparentHeader: true }
  },
  {
    path: '/person/:id',
    name: 'personDetails',
    alias: ['/director/:id'],
    component: () => import('../views/PersonDetails.vue'),
    meta: { public: true, transparentHeader: true }
  },
  {
    path: '/library',
    name: 'library',
    component: () => import('../views/LibraryView.vue'),
    meta: { public: false }
  },
  {
    path: '/profil',
    name: 'profil',
    component: () => import('../views/ProfilView.vue'),
    meta: { public: false }
  },
  {
    path: '/legal-notice',
    name: 'legalNotice',
    component: () => import('../views/LegalNoticeView.vue'),
    meta: { public: true }
  },
  {
    path: '/privacy-policy',
    name: 'privacyPolicy',
    component: () => import('../views/PrivacyPolicyView.vue'),
    meta: { public: true }
  },
  {
    path: '/forgot-password',
    name: 'forgotPassword',
    component: () => import('../views/ForgotPasswordView.vue'),
    meta: { public: true, hideHeader: true, hideFooter: true }
  },
  {
    path: '/reset-password',
    name: 'resetPassword',
    component: () => import('../views/ResetPasswordView.vue'),
    meta: { public: true, hideHeader: true, hideFooter: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'notFound',
    component: () => import('../views/NotFoundView.vue'),
    meta: { public: true, hideHeader: true, hideFooter: true }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition;
    return { top: 0 };
  }
});

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore();

  if (authStore.isAuthenticated && (to.path === '/login' || to.path === '/register')) {
    next('/');
  } else if (!to.meta.public && !authStore.isAuthenticated) {
    next('/login');
  } else {
    next();
  }
});

export default router;
