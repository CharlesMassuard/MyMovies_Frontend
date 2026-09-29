<script setup>
import { useRouter } from 'vue-router';
import noPoster from '../assets/noPosterAvailable.webp';

defineProps({
  cast: { type: Array, default: () => [] }
});

const router = useRouter();
const goToPerson = (id) => router.push(`/person/${id}`);
</script>

<template>
  <v-container class="mt-6 mb-6" v-if="cast?.length">
    <h3 class="text-h5 font-weight-bold mb-6">{{ $t('media.cast') }}</h3>
    <v-row class="flex-nowrap overflow-x-auto pb-4">
      <v-col v-for="actor in cast" :key="actor.id" cols="6" sm="4" md="2" class="flex-shrink-0">
        <v-card 
          class="rounded-lg overflow-hidden elevation-2 h-100 actor-card"
          @click="goToPerson(actor.id)"
        >
          <v-img 
            :src="actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : noPoster" 
            height="200" 
            cover
            class="bg-grey-lighten-2"
          ></v-img>
          <v-card-text class="pa-2">
            <p class="font-weight-bold mb-0 text-truncate text-body-2" :title="actor.name">{{ actor.name }}</p>
            <p class="text-caption text-grey-darken-1 text-truncate" :title="actor.roles?.[0]?.character || actor.character">
              {{ actor.roles?.[0]?.character || actor.character }}
            </p>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #dbdbdb transparent;
}
.actor-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.actor-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15) !important;
}
</style>
