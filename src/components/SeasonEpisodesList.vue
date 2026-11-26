<script setup>
import { ref, computed, watch } from 'vue';
import noPoster from '../assets/noPosterAvailable.webp';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps({
  seasonInfo: Object,
  loading: Boolean,
  serieId: [String, Number]
});

defineEmits(['close']);

const watchedEpisodes = ref([]);

const storageKey = computed(() => {
  if (!props.serieId || !props.seasonInfo) return null;
  return `mymovies-ep-progress-${props.serieId}-s${props.seasonInfo.season_number}`;
});

const loadWatched = () => {
  if (!storageKey.value) {
    watchedEpisodes.value = [];
    return;
  }
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey.value) || '[]');
    watchedEpisodes.value = Array.isArray(saved) ? saved : [];
  } catch {
    watchedEpisodes.value = [];
  }
};

const saveWatched = () => {
  if (!storageKey.value) return;
  localStorage.setItem(storageKey.value, JSON.stringify(watchedEpisodes.value));
};

const isEpisodeWatched = (epNum) => watchedEpisodes.value.includes(epNum);

const toggleEpisode = (epNum) => {
  if (isEpisodeWatched(epNum)) {
    watchedEpisodes.value = watchedEpisodes.value.filter(n => n !== epNum);
  } else {
    watchedEpisodes.value = [...watchedEpisodes.value, epNum];
  }
  saveWatched();
};

const allWatched = computed(() => {
  const total = props.seasonInfo?.episodes?.length || 0;
  return total > 0 && watchedEpisodes.value.length >= total;
});

const progressPercent = computed(() => {
  const total = props.seasonInfo?.episodes?.length || 0;
  if (total === 0) return 0;
  return Math.round((watchedEpisodes.value.length / total) * 100);
});

const toggleAllSeason = () => {
  const eps = props.seasonInfo?.episodes || [];
  if (allWatched.value) {
    watchedEpisodes.value = [];
  } else {
    watchedEpisodes.value = eps.map(e => e.episode_number);
  }
  saveWatched();
};

watch(() => props.seasonInfo, loadWatched, { immediate: true });

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
  const types = {
    finale: t('episodes.seasonFinale'),
    premiere: t('episodes.seasonPremiere'),
    mid_season: t('episodes.midSeason'),
    series_finale: t('episodes.seriesFinale'),
    series_premiere: t('episodes.pilot')
  };
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
      <div v-if="seasonInfo && !loading" class="mt-4 season-details rounded-xl pa-6 border">
        <div class="d-flex justify-space-between align-center flex-wrap ga-3 mb-4">
          <div>
            <h3 class="text-h5 font-weight-bold">
              {{ seasonInfo.name }}
              <span class="text-body-1 text-medium-emphasis">
                ({{ watchedEpisodes.length }}/{{ seasonInfo.episodes?.length || 0 }} {{ $t('media.episodes') }})
              </span>
            </h3>
          </div>
          <div class="d-flex align-center ga-2">
            <v-btn
              variant="tonal"
              :color="allWatched ? 'success' : '#8C52FF'"
              rounded="pill"
              size="small"
              class="text-none font-weight-semibold"
              :prepend-icon="allWatched ? 'mdi-check-all' : 'mdi-checkbox-multiple-marked-outline'"
              @click="toggleAllSeason"
            >
              {{ allWatched ? $t('episodes.unmarkSeason') : $t('episodes.markSeasonWatched') }}
            </v-btn>
            <v-btn icon="mdi-close" variant="text" @click="$emit('close')"></v-btn>
          </div>
        </div>

        <!-- Season Progress Bar -->
        <v-progress-linear
          :model-value="progressPercent"
          color="#8C52FF"
          height="6"
          rounded
          class="mb-6"
        />

        <v-row>
          <v-col cols="12" v-for="episode in seasonInfo.episodes" :key="episode.id">
            <v-card
              class="d-flex flex-column flex-md-row rounded-xl overflow-hidden elevation-1 episode-card"
              :class="{ 'episode-watched': isEpisodeWatched(episode.episode_number) }"
            >
              <v-img
                :src="episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : noPoster"
                width="100%"
                max-width="250"
                height="150"
                cover
                class="bg-grey-darken-3 shrink-0 episode-img"
              ></v-img>
              <div class="pa-4 flex-grow-1 d-flex flex-column">
                <div class="d-flex justify-space-between align-start flex-wrap ga-2 mb-2">
                  <div class="d-flex align-center ga-2">
                    <v-btn
                      :icon="isEpisodeWatched(episode.episode_number) ? 'mdi-check-circle' : 'mdi-checkbox-blank-circle-outline'"
                      :color="isEpisodeWatched(episode.episode_number) ? 'success' : 'grey'"
                      variant="text"
                      density="compact"
                      @click="toggleEpisode(episode.episode_number)"
                    />
                    <h4 class="text-h6 font-weight-bold" style="line-height: 1.2;">
                      <span class="text-primary mr-2">{{ formatEpisodeNumber(episode.season_number, episode.episode_number) }}</span>
                      {{ episode.name }}
                    </h4>
                  </div>
                  <div class="d-flex align-center ga-2">
                    <v-chip v-if="translateEpisodeType(episode.episode_type)" size="small" color="error" variant="flat" class="font-weight-bold">
                      {{ translateEpisodeType(episode.episode_type) }}
                    </v-chip>
                    <v-chip size="small" color="primary" variant="outlined">
                      {{ formatDate(episode.air_date) }}
                    </v-chip>
                  </div>
                </div>
                <p class="text-body-2 text-medium-emphasis mb-3 flex-grow-1 text-justify">
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
.season-details {
  background: var(--app-surface);
}
.episode-card {
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.06);
  transition: opacity 0.2s ease, border-color 0.2s ease;
}
.episode-watched {
  opacity: 0.72;
  border-color: rgba(34, 197, 94, 0.35);
}
@media (max-width: 960px) {
  .episode-img {
    max-width: 100% !important;
    height: 180px;
  }
}
</style>
