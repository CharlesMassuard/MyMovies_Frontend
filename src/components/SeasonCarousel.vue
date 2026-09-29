<script setup>
import noPoster from '../assets/noPosterAvailable.webp';
defineProps({
  seasons: Array,
  totalSeasons: Number,
  activeSeasonNumber: Number
});
defineEmits(['select-season']);
</script>

<template>
  <v-container class="mt-8" v-if="seasons?.length">
    <h3 class="text-h5 font-weight-bold mb-4">{{ $t('episodes.seasons') }} ({{ totalSeasons }})</h3>
    <v-row class="flex-nowrap overflow-x-auto pb-4">
      <v-col 
        v-for="season in seasons" 
        :key="season.id" 
        cols="8" sm="4" md="3" lg="2" 
        class="flex-shrink-0"
      >
        <v-card 
          class="rounded-lg overflow-hidden h-100 d-flex flex-column season-card" 
          :class="{'active-season': activeSeasonNumber === season.season_number}"
          :elevation="activeSeasonNumber === season.season_number ? 8 : 2"
          @click="$emit('select-season', season.season_number)"
        >
          <v-img 
            :src="season.poster_path ? `https://image.tmdb.org/t/p/w300${season.poster_path}` : noPoster" 
            height="240" 
            cover
            class="bg-grey-lighten-2"
          ></v-img>
          <v-card-text class="pa-3">
            <p class="font-weight-bold mb-1 text-truncate text-body-2">{{ season.name }}</p>
            <p class="text-caption text-grey-darken-1 mb-0">
              {{ season.episode_count }} {{ $t('media.episodes') }}
            </p>
            <p v-if="season.air_date" class="text-caption text-grey-darken-1">
              {{ season.air_date.split('-')[0] }}
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
.season-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}
.season-card:hover {
  transform: translateY(-5px);
}
.active-season {
  border-color: #8C52FF !important;
  background-color: #f8f5ff;
}
</style>
