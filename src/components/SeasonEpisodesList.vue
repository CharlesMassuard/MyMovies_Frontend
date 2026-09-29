<script setup>
import noPoster from '../assets/noPosterAvailable.webp';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps({
  seasonInfo: Object,
  loading: Boolean
});

defineEmits(['close']);

const formatDate = (dateString) => {
  if (!dateString) return t('common.unknownDate');
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const formatEpisodeNumber = (season, episode) => {
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
};

const translateEpisodeType = (type) => {
  if (!type || type === 'standard') return null;
  const types = { 'finale': t('episodes.seasonFinale'), 'premiere': t('episodes.seasonPremiere'), 'mid_season': t('episodes.midSeason'), 'series_finale': t('episodes.seriesFinale'), 'series_premiere': t('episodes.pilot') };
  return types[type.toLowerCase()] || type;
};
</script>

<template>
  <v-container class="pt-0">
    <!-- Chargement -->
    <div v-if="loading" class="text-center py-8">
      <v-progress-circular indeterminate color="#8C52FF" size="50"></v-progress-circular>
    </div>

    <v-expand-transition>
      <div v-if="seasonInfo && !loading" class="mt-4 bg-grey-lighten-4 rounded-xl pa-6 border">
        <div class="d-flex justify-space-between align-center mb-6">
          <h3 class="text-h5 font-weight-bold">
            {{ seasonInfo.name }} <span class="text-body-1 text-grey-darken-1">({{ seasonInfo.episodes?.length }} {{ $t('media.episodes') }})</span>
          </h3>
          <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
        </div>

        <v-row>
          <v-col cols="12" v-for="episode in seasonInfo.episodes" :key="episode.id">
            <v-card class="d-flex flex-column flex-md-row rounded-lg overflow-hidden elevation-1" color="white">
              <v-img
                :src="episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : noPoster"
                width="100%"
                max-width="250"
                height="150"
                cover
                class="bg-grey-lighten-2 shrink-0 episode-img"
              ></v-img>
              <div class="pa-4 flex-grow-1 d-flex flex-column">
                <div class="d-flex justify-space-between align-start flex-wrap ga-2 mb-2">
                  <h4 class="text-h6 font-weight-bold" style="line-height: 1.2;">
                    <span class="text-primary mr-2">{{ formatEpisodeNumber(episode.season_number, episode.episode_number) }}</span>
                    {{ episode.name }}
                  </h4>
                  <div class="d-flex align-center ga-2">
                    <v-chip v-if="translateEpisodeType(episode.episode_type)" size="small" color="error" variant="flat" class="font-weight-bold">
                      {{ translateEpisodeType(episode.episode_type) }}
                    </v-chip>
                    <v-chip size="small" color="grey-darken-3" variant="outlined" class="bg-white">
                      {{ formatDate(episode.air_date) }}
                    </v-chip>
                  </div>
                </div>
                <p class="text-body-2 text-grey-darken-3 mb-3 flex-grow-1 text-justify">
                  {{ episode.overview || $t('episodes.noOverview') }}
                </p>
                <div class="d-flex align-center mt-auto" v-if="episode.vote_average">
                  <v-icon color="amber" size="small" class="mr-1">mdi-star</v-icon>
                  <span class="text-caption font-weight-bold">{{ Math.round(episode.vote_average * 10) / 10 }} / 10</span>
                </div>
              </div>
            </v-card>
          </v-col>
        </v-row>
      </div>
    </v-expand-transition>
  </v-container>
</template>

<style scoped>
.episode-img {
  min-width: 250px;
}
@media (max-width: 960px) {
  .episode-img {
    max-width: 100% !important;
    height: 180px;
  }
}
</style>
