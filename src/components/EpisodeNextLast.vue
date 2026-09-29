<script setup>
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

defineProps({
  lastEpisode: Object,
  nextEpisode: Object
});

const formatDate = (dateString) => {
  if (!dateString) return t('common.unknownDate');
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const formatEpisodeNumber = (season, episode) => {
  if (season === undefined || episode === undefined) return '';
  return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
};

const translateEpisodeType = (type) => {
  if (!type || type === 'standard') return null;
  const types = {
    'finale': t('episodes.seasonFinale'), 'premiere': t('episodes.seasonPremiere'),
    'mid_season': t('episodes.midSeason'), 'series_finale': t('episodes.seriesFinale'), 'series_premiere': t('episodes.pilot')
  };
  return types[type.toLowerCase()] || type;
};
</script>

<template>
  <v-container class="mt-8" v-if="lastEpisode || nextEpisode">
    <h3 class="text-h5 font-weight-bold mb-4">{{ $t('media.broadcast') }}</h3>
    <v-row>
      <!-- Dernier épisode -->
      <v-col cols="12" md="6" v-if="lastEpisode">
        <v-card class="pa-5 rounded-xl elevation-2 h-100 d-flex flex-column" color="#fcfcfc">
          <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
            <span class="text-overline text-grey-darken-1 text-no-wrap flex-shrink-0">{{ $t('media.lastEpisode') }}</span>
            <div class="d-flex align-center ga-2">
              <v-chip v-if="translateEpisodeType(lastEpisode.episode_type)" size="small" color="error" variant="flat" class="font-weight-bold">
                {{ translateEpisodeType(lastEpisode.episode_type) }}
              </v-chip>
              <v-chip size="small" color="primary" class="text-white font-weight-bold">
                {{ formatDate(lastEpisode.air_date) }}
              </v-chip>
            </div>
          </div>
          <h4 class="text-h6 font-weight-bold mb-2">
            <span class="text-primary mr-2">{{ formatEpisodeNumber(lastEpisode.season_number, lastEpisode.episode_number) }}</span>
            {{ lastEpisode.name }}
          </h4>
          <p class="text-body-2 text-grey-darken-3 mb-4 flex-grow-1 text-justify">
            {{ lastEpisode.overview || $t('episodes.noOverview') }}
          </p>
          <div class="d-flex align-center mt-auto" v-if="lastEpisode.vote_average">
            <v-icon color="amber" size="small" class="mr-1">mdi-star</v-icon>
            <span class="text-body-2 font-weight-bold">{{ Math.round(lastEpisode.vote_average * 10) / 10 }} / 10</span>
          </div>
        </v-card>
      </v-col>

      <!-- Prochain épisode -->
      <v-col cols="12" md="6" v-if="nextEpisode">
        <v-card class="pa-5 rounded-xl elevation-0 border h-100 d-flex flex-column">
          <div class="d-flex align-center justify-space-between mb-3 flex-wrap ga-2">
            <span class="text-overline text-primary font-weight-bold text-no-wrap flex-shrink-0">{{ $t('media.nextEpisode') }}</span>
            <div class="d-flex align-center ga-2">
              <v-chip v-if="translateEpisodeType(nextEpisode.episode_type)" size="small" color="error" variant="flat" class="font-weight-bold">
                {{ translateEpisodeType(nextEpisode.episode_type) }}
              </v-chip>
              <v-chip size="small" color="success" class="text-white font-weight-bold">
                {{ formatDate(nextEpisode.air_date) }}
              </v-chip>
            </div>
          </div>
          <h4 class="text-h6 font-weight-bold mb-2">
            <span class="text-primary mr-2">{{ formatEpisodeNumber(nextEpisode.season_number, nextEpisode.episode_number) }}</span>
            {{ nextEpisode.name }}
          </h4>
          <p class="text-body-2 text-grey-darken-3 mb-4 flex-grow-1 text-justify">
            {{ nextEpisode.overview || $t('episodes.noOverview') }}
          </p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>
