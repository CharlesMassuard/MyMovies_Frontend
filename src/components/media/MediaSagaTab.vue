<script setup>
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import noPoster from '../../assets/noPosterAvailable.webp';

const props = defineProps({
  collection: { type: Object, required: true },
  currentMovieId: { type: [String, Number], required: true },
  libraryStatusMap: { type: Object, default: () => ({}) }
});

const getStatusBadge = (movieId) => {
  const s = props.libraryStatusMap?.[`movie-${movieId}`];
  if (s === 'WATCHED') return { label: 'common.watched', color: '#22c55e', icon: 'mdi-check' };
  if (s === 'WATCHING') return { label: 'common.watching', color: '#3b82f6', icon: 'mdi-play' };
  if (s === 'TO_WATCH') return { label: 'common.watch', color: '#8C52FF', icon: 'mdi-clock-outline' };
  return null;
};

const router = useRouter();

const sortedParts = computed(() => {
  if (!Array.isArray(props.collection.parts)) return [];
  return [...props.collection.parts].sort((a, b) => {
    const dateA = a.release_date || '9999-12-31';
    const dateB = b.release_date || '9999-12-31';
    return dateA.localeCompare(dateB);
  });
});

const goToMovie = (id) => {
  if (String(id) === String(props.currentMovieId)) return;
  router.push(`/movie/${id}`);
};
</script>

<template>
  <div class="saga-panel">
    <!-- Saga Header Banner -->
    <div class="saga-header-card rounded-xl overflow-hidden mb-8">
      <div
        v-if="collection.backdrop_path"
        class="saga-backdrop"
        :style="{ backgroundImage: `url(https://image.tmdb.org/t/p/w1280${collection.backdrop_path})` }"
      ></div>
      <div class="saga-backdrop-overlay"></div>

      <div class="saga-header-content pa-6 pa-md-8 d-flex flex-column flex-md-row align-start align-md-center ga-6">
        <v-img
          v-if="collection.poster_path"
          :src="`https://image.tmdb.org/t/p/w300${collection.poster_path}`"
          :alt="collection.name"
          width="110"
          max-width="110"
          aspect-ratio="2/3"
          cover
          class="rounded-lg elevation-6 flex-shrink-0"
        />
        <div class="text-white">
          <div class="d-flex align-center ga-2 mb-2">
            <v-chip size="x-small" color="#8C52FF" variant="flat" class="font-weight-bold text-uppercase">
              {{ $t('media.saga') }}
            </v-chip>
            <span class="text-caption text-grey-lighten-2">
              {{ sortedParts.length }} {{ sortedParts.length > 1 ? $t('common.movies') : $t('common.movie') }}
            </span>
          </div>
          <h2 class="text-h4 font-weight-bold mb-2">{{ collection.name }}</h2>
          <p v-if="collection.overview" class="text-body-2 text-grey-lighten-2 mb-0" style="max-width: 780px; line-height: 1.6;">
            {{ collection.overview }}
          </p>
        </div>
      </div>
    </div>

    <!-- Movies Grid -->
    <v-row>
      <v-col
        v-for="(part, index) in sortedParts"
        :key="part.id"
        cols="6"
        sm="4"
        md="3"
        lg="2"
      >
        <v-card
          class="saga-movie-card rounded-xl overflow-hidden h-100"
          :class="{ 'is-current': String(part.id) === String(currentMovieId) }"
          elevation="3"
          @click="goToMovie(part.id)"
        >
          <div class="poster-wrapper">
            <v-img
              :src="part.poster_path ? `https://image.tmdb.org/t/p/w500${part.poster_path}` : noPoster"
              aspect-ratio="2/3"
              cover
              class="bg-grey-darken-3"
            />
            <div class="part-number-badge">#{{ index + 1 }}</div>
            <div
              v-if="getStatusBadge(part.id)"
              class="lib-status-badge"
              :style="{ backgroundColor: getStatusBadge(part.id).color }"
            >
              <v-icon size="11" class="mr-1">{{ getStatusBadge(part.id).icon }}</v-icon>
              {{ $t(getStatusBadge(part.id).label) }}
            </div>
            <div v-if="String(part.id) === String(currentMovieId)" class="current-badge">
              {{ $t('media.currentWork') }}
            </div>
          </div>

          <v-card-text class="pa-3">
            <p class="font-weight-bold text-body-2 mb-1 text-truncate" :title="part.title">
              {{ part.title }}
            </p>
            <div class="d-flex align-center justify-space-between text-caption opacity-75">
              <span>{{ part.release_date ? part.release_date.split('-')[0] : $t('common.upcomingShort') }}</span>
              <span v-if="part.vote_average > 0" class="d-inline-flex align-center">
                <v-icon size="13" color="amber" class="mr-1">mdi-star</v-icon>
                {{ (Math.round(part.vote_average * 10) / 10).toFixed(1) }}
              </span>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<style scoped>
.saga-header-card {
  position: relative;
  background: #171922;
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.saga-backdrop {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center;
  opacity: 0.45;
  z-index: 0;
}

.saga-backdrop-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, rgba(15, 16, 21, 0.94) 0%, rgba(15, 16, 21, 0.72) 100%);
  z-index: 1;
}

.saga-header-content {
  position: relative;
  z-index: 2;
}

.saga-movie-card {
  cursor: pointer;
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

.saga-movie-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.35) !important;
}

.saga-movie-card.is-current {
  border: 2px solid #8C52FF;
  cursor: default;
}

.saga-movie-card.is-current:hover {
  transform: none;
}

.poster-wrapper {
  position: relative;
}

.part-number-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(15, 16, 21, 0.78);
  backdrop-filter: blur(6px);
  color: #ffffff;
}

.lib-status-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  color: #ffffff;
}

.current-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  right: 8px;
  text-align: center;
  padding: 3px 8px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  background: #8C52FF;
  color: #ffffff;
}
</style>
