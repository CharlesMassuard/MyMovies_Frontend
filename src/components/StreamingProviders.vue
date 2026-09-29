<script setup>
defineProps({
  providers: { type: Array, default: () => [] }
});
</script>

<template>
  <div v-if="providers.length > 0" class="d-flex align-center flex-wrap mt-4 ga-3">
    <span class="text-caption text-grey-lighten-2">{{ $t('common.streaming') }}</span>
    <div 
      v-for="provider in providers" 
      :key="provider.provider_id" 
      class="rounded overflow-hidden elevation-2 d-flex bg-white"
    >
      <img 
        :src="`https://image.tmdb.org/t/p/w92${provider.logo_path}`" 
        :alt="provider.provider_name"
        :title="provider.provider_name"
        style="height: 35px; width: 35px; object-fit: cover;" 
      />
    </div>
  </div>
</template>
