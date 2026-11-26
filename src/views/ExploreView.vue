<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import apiClient from '../api/client';
import noPoster from '../assets/noPosterAvailable.webp';

const router = useRouter();
const { t } = useI18n();

const mediaType = ref('movie'); // 'movie' | 'serie'
const genres = ref([]);
const selectedGenre = ref(null);
const selectedYear = ref(null);
const selectedMinRating = ref(null);
const selectedSort = ref('popularity.desc');
const selectedProvider = ref(null);

const items = ref([]);
const page = ref(1);
const totalPages = ref(1);
const isLoading = ref(true);
const isLoadingMore = ref(false);
const libraryStatusMap = ref({});

const fetchUserLibraryStatus = async () => {
  if (!localStorage.getItem('user_token')) return;
  try {
    const [mRes, sRes] = await Promise.all([
      apiClient.get('/user/movies'),
      apiClient.get('/user/series')
    ]);
    const map = {};
    (mRes.data || []).forEach(i => {
      if (i.movie?.id) map[`movie-${i.movie.id}`] = i.status;
    });
    (sRes.data || []).forEach(i => {
      if (i.serie?.id) map[`serie-${i.serie.id}`] = i.status;
    });
    libraryStatusMap.value = map;
  } catch {
    // Ignore if unauthenticated
  }
};

const getStatusBadge = (id) => {
  const s = libraryStatusMap.value[`${mediaType.value}-${id}`];
  if (s === 'WATCHED') return { label: 'common.watched', color: '#22c55e', icon: 'mdi-check' };
  if (s === 'WATCHING') return { label: 'common.watching', color: '#3b82f6', icon: 'mdi-play' };
  if (s === 'TO_WATCH') return { label: 'common.watch', color: '#8C52FF', icon: 'mdi-clock-outline' };
  return null;
};

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: currentYear - 1969 }, (_, i) => currentYear - i);

const ratingOptions = [
  { title: '8+', value: 8 },
  { title: '7+', value: 7 },
  { title: '6+', value: 6 },
  { title: '5+', value: 5 }
];

const sortOptions = computed(() => [
  { title: t('explore.sortPopular'), value: 'popularity.desc' },
  { title: t('explore.sortRating'), value: 'vote_average.desc' },
  {
    title: t('explore.sortNewest'),
    value: mediaType.value === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc'
  }
]);

const providerOptions = [
  { title: 'Netflix', value: '8' },
  { title: 'Prime Video', value: '119' },
  { title: 'Disney+', value: '337' },
  { title: 'Canal+', value: '381' },
  { title: 'Apple TV+', value: '350' },
  { title: 'Max', value: '1899' },
  { title: 'Paramount+', value: '531' }
];

const fetchGenres = async () => {
  try {
    const seg = mediaType.value === 'movie' ? 'movies' : 'series';
    const res = await apiClient.get(`/${seg}/genres`);
    genres.value = res.data.genres || [];
  } catch (e) {
    console.error('Error fetching genres:', e);
  }
};

const fetchResults = async (reset = true) => {
  if (reset) {
    page.value = 1;
    isLoading.value = true;
  } else {
    isLoadingMore.value = true;
  }

  try {
    const seg = mediaType.value === 'movie' ? 'movies' : 'series';
    const res = await apiClient.get(`/${seg}/discover`, {
      params: {
        genre: selectedGenre.value || undefined,
        year: selectedYear.value || undefined,
        minRating: selectedMinRating.value || undefined,
        sortBy: selectedSort.value,
        provider: selectedProvider.value || undefined,
        page: page.value
      }
    });

    const fetched = res.data.results || [];
    totalPages.value = Math.min(res.data.total_pages || 1, 50);
    items.value = reset ? fetched : [...items.value, ...fetched];
  } catch (e) {
    console.error('Error discovering media:', e);
  } finally {
    isLoading.value = false;
    isLoadingMore.value = false;
  }
};

const loadMore = () => {
  if (page.value >= totalPages.value) return;
  page.value += 1;
  fetchResults(false);
};

const resetFilters = () => {
  selectedGenre.value = null;
  selectedYear.value = null;
  selectedMinRating.value = null;
  selectedProvider.value = null;
  selectedSort.value = 'popularity.desc';
};

watch(mediaType, async () => {
  selectedGenre.value = null;
  if (selectedSort.value.includes('date')) {
    selectedSort.value = mediaType.value === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc';
  }
  await fetchGenres();
  fetchResults(true);
});

watch([selectedGenre, selectedYear, selectedMinRating, selectedSort, selectedProvider], () => {
  fetchResults(true);
});

onMounted(async () => {
  fetchUserLibraryStatus();
  await fetchGenres();
  fetchResults(true);
});
</script>

<template>
  <v-container class="explore-container py-8 py-md-10">
    <!-- Header -->
    <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4 mb-6">
      <div>
        <h1 class="text-h4 font-weight-bold d-flex align-center ga-2 mb-1">
          <v-icon color="#8C52FF" size="30">mdi-compass-outline</v-icon>
          {{ $t('header.explore') }}
        </h1>
        <p class="text-body-2 opacity-70 mb-0">{{ $t('explore.subtitle') }}</p>
      </div>

      <div class="type-pill-toggle">
        <button
          type="button"
          class="type-btn"
          :class="{ 'type-btn-active': mediaType === 'movie' }"
          @click="mediaType = 'movie'"
        >
          {{ $t('common.movies') }}
        </button>
        <button
          type="button"
          class="type-btn"
          :class="{ 'type-btn-active': mediaType === 'serie' }"
          @click="mediaType = 'serie'"
        >
          {{ $t('common.seriesPlural') }}
        </button>
      </div>
    </div>

    <!-- Filters Bar -->
    <v-card class="filters-card rounded-xl pa-4 mb-8" elevation="0">
      <v-row dense align="center">
        <v-col cols="12" sm="6" md="2">
          <v-select
            v-model="selectedGenre"
            :items="genres"
            item-title="name"
            item-value="id"
            :label="$t('explore.genre')"
            variant="outlined"
            density="compact"
            rounded="lg"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="6" md="2">
          <v-select
            v-model="selectedYear"
            :items="yearOptions"
            :label="$t('explore.year')"
            variant="outlined"
            density="compact"
            rounded="lg"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="6" sm="6" md="2">
          <v-select
            v-model="selectedMinRating"
            :items="ratingOptions"
            item-title="title"
            item-value="value"
            :label="$t('explore.minRating')"
            variant="outlined"
            density="compact"
            rounded="lg"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="12" sm="6" md="3">
          <v-select
            v-model="selectedProvider"
            :items="providerOptions"
            item-title="title"
            item-value="value"
            :label="$t('explore.provider')"
            variant="outlined"
            density="compact"
            rounded="lg"
            clearable
            hide-details
          />
        </v-col>
        <v-col cols="10" sm="10" md="2">
          <v-select
            v-model="selectedSort"
            :items="sortOptions"
            item-title="title"
            item-value="value"
            :label="$t('explore.sortBy')"
            variant="outlined"
            density="compact"
            rounded="lg"
            hide-details
          />
        </v-col>
        <v-col cols="2" sm="2" md="1" class="d-flex justify-end">
          <v-btn
            icon="mdi-filter-off-outline"
            variant="tonal"
            size="small"
            color="#8C52FF"
            v-tooltip="$t('explore.reset')"
            @click="resetFilters"
          />
        </v-col>
      </v-row>
    </v-card>

    <!-- Loading Skeleton -->
    <v-row v-if="isLoading">
      <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="3" lg="2">
        <v-skeleton-loader type="image, article" class="rounded-xl" />
      </v-col>
    </v-row>

    <!-- Empty State -->
    <div v-else-if="items.length === 0" class="text-center py-16">
      <v-icon size="64" class="opacity-40 mb-4">mdi-movie-search-outline</v-icon>
      <h3 class="text-h6 font-weight-bold mb-2">{{ $t('common.noResults') }}</h3>
      <v-btn color="#8C52FF" variant="tonal" rounded="pill" class="mt-3 text-none" @click="resetFilters">
        {{ $t('explore.reset') }}
      </v-btn>
    </div>

    <!-- Results Grid -->
    <template v-else>
      <v-row>
        <v-col v-for="item in items" :key="`${mediaType}-${item.id}`" cols="6" sm="4" md="3" lg="2">
          <v-card
            class="explore-card rounded-xl overflow-hidden h-100"
            elevation="2"
            @click="router.push(`/${mediaType}/${item.id}`)"
          >
            <div class="poster-wrap">
              <v-img
                :src="item.poster_path ? `https://image.tmdb.org/t/p/w342${item.poster_path}` : noPoster"
                aspect-ratio="2/3"
                cover
              />
              <span
                v-if="getStatusBadge(item.id)"
                class="lib-status-pill"
                :style="{ backgroundColor: getStatusBadge(item.id).color }"
              >
                <v-icon size="11" class="mr-1">{{ getStatusBadge(item.id).icon }}</v-icon>
                {{ $t(getStatusBadge(item.id).label) }}
              </span>
              <span v-if="item.vote_average > 0" class="score-pill">
                <v-icon size="11" color="#fbbf24" class="mr-1">mdi-star</v-icon>
                {{ (Math.round(item.vote_average * 10) / 10).toFixed(1) }}
              </span>
            </div>
            <div class="pa-3">
              <p class="font-weight-bold text-body-2 mb-1 text-truncate" :title="item.title || item.name">
                {{ item.title || item.name }}
              </p>
              <p class="text-caption opacity-65 mb-0">
                {{ (item.release_date || item.first_air_date || '').split('-')[0] || '—' }}
              </p>
            </div>
          </v-card>
        </v-col>
      </v-row>

      <div v-if="page < totalPages" class="d-flex justify-center mt-10">
        <v-btn
          color="#8C52FF"
          variant="tonal"
          rounded="pill"
          size="large"
          class="px-8 text-none font-weight-bold"
          :loading="isLoadingMore"
          @click="loadMore"
        >
          {{ $t('explore.loadMore') }}
        </v-btn>
      </div>
    </template>
  </v-container>
</template>

<style scoped>
.explore-container {
  max-width: 1360px;
}

.type-pill-toggle {
  display: inline-flex;
  padding: 4px;
  border-radius: 999px;
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .type-pill-toggle {
  border-color: rgba(0, 0, 0, 0.08);
}

.type-btn {
  padding: 7px 20px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.68;
  cursor: pointer;
  transition: all 0.18s ease;
}

.type-btn-active {
  background: #8C52FF;
  color: #ffffff;
  opacity: 1;
}

.filters-card {
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .filters-card {
  border-color: rgba(0, 0, 0, 0.08);
}

.explore-card {
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

:root[data-theme='light'] .explore-card {
  border-color: rgba(0, 0, 0, 0.08);
}

.explore-card:hover {
  transform: translateY(-4px);
  border-color: rgba(140, 82, 255, 0.45);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.32) !important;
}

.poster-wrap {
  position: relative;
}

.score-pill {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(15, 16, 21, 0.84);
  color: #ffffff;
}

.lib-status-pill {
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
</style>
