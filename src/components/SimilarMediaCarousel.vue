<script setup>
import { useRouter } from 'vue-router';
import noPoster from '../assets/noPosterAvailable.webp';

defineProps({
  mediaList: { type: Array, default: () => [] },
  mediaType: { type: String, required: true } // 'movie' ou 'serie'
});

const router = useRouter();
const goToMedia = (id, type) => router.push(`/${type}/${id}`);
</script>

<template>
  <v-container class="mb-10" v-if="mediaList?.length">
    <h3 class="text-h5 font-weight-bold mb-6">{{ $t('media.similar') }}</h3>
    <v-row class="flex-nowrap overflow-x-auto pb-4">
      <v-col v-for="similar in mediaList" :key="similar.id" cols="6" sm="4" md="3" lg="2" class="flex-shrink-0">
        <v-card 
          class="rounded-lg overflow-hidden elevation-2 h-100 similar-card"
          @click="goToMedia(similar.id, mediaType)"
        >
          <v-img 
            :src="similar.poster_path ? `https://image.tmdb.org/t/p/w300${similar.poster_path}` : noPoster" 
            height="220" 
            cover
            class="bg-grey-lighten-2"
          ></v-img>
          <v-card-text class="pa-2">
            <p class="font-weight-bold mb-0 text-truncate text-body-2" :title="similar.title || similar.name">
              {{ similar.title || similar.name }}
            </p>
            <div class="d-flex align-center mt-1" v-if="similar.vote_average">
              <v-icon color="amber" size="small" class="mr-1">mdi-star</v-icon>
              <span class="text-caption font-weight-medium">{{ Math.round(similar.vote_average * 10) / 10 }}</span>
            </div>
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
.similar-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.similar-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15) !important;
}
</style>
