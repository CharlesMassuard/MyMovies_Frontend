<template>
  <v-app>

    <MaintenanceView v-if="isMaintenance" />

    <template v-else>
      <HeaderView />
      <v-main>
        <router-view />
      </v-main>
      <FooterView />
    </template>
  </v-app>
</template>

<script setup>
  import HeaderView from './views/HeaderView.vue'
  import FooterView from './views/FooterView.vue';
  import MaintenanceView from './views/MaintenanceView.vue';

  const isMaintenance = import.meta.env.VITE_APP_MAINTENANCE === 'true';
</script>