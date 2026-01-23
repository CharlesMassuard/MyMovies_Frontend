<template>
  <v-app>
    <HeaderView />
    <v-main>
      <router-view />
    </v-main>
    <FooterView />
  </v-app>
</template>

<script setup>
  import HeaderView from './views/HeaderView.vue'
  import FooterView from './views/FooterView.vue';
</script>