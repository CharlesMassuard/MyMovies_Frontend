<template>
  <v-app>
    <MaintenanceView v-if="isMaintenance" />

    <template v-else>
      <HeaderView />
      <v-main :class="mainClasses">
        <router-view />
      </v-main>
      <BackToTop />
      <FooterView />
    </template>
  </v-app>
</template>

<script setup>
  import { computed } from 'vue';
  import { useRoute } from 'vue-router';
  import HeaderView from './views/HeaderView.vue';
  import FooterView from './views/FooterView.vue';
  import MaintenanceView from './views/MaintenanceView.vue';
  import BackToTop from './components/BackToTop.vue';

  const route = useRoute();
  const isMaintenance = import.meta.env.VITE_APP_MAINTENANCE === 'true';

  const hideHeader = computed(() => {
    return route.path === '/login' || route.path === '/register' || Boolean(route.meta.hideHeader);
  });

  const mainClasses = computed(() => ({
    'pa-0': true,
    'main-with-header-offset': !hideHeader.value && !route.meta.transparentHeader,
  }));
</script>

<style scoped>
.main-with-header-offset {
  padding-top: 68px !important;
}
</style>
