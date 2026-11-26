<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import apiClient from '../api/client';
import noPoster from '../assets/noPosterAvailable.webp';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();

const query = ref(String(route.query.q || ''));
const activeTab = ref('all'); // 'all' | 'movie' | 'serie' | 'person'
const isLoading = ref(false);

const movies = ref([]);
const series = ref([]);
const people = ref([]);
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

const getStatusBadge = (item) => {
  if (item.media_type === 'person') return null;
  const s = libraryStatusMap.value[`${item.media_type}-${item.id}`];
  if (s === 'WATCHED') return { label: 'common.watched', color: '#22c55e', icon: 'mdi-check' };
  if (s === 'WATCHING') return { label: 'common.watching', color: '#3b82f6', icon: 'mdi-play' };
  if (s === 'TO_WATCH') return { label: 'common.watch', color: '#8C52FF', icon: 'mdi-clock-outline' };
  return null;
};

const runSearch = async (q) => {
  const trimmed = (q || '').trim();
  if (!trimmed) {
    movies.value = [];
    series.value = [];
    people.value = [];
    return;
  }
  isLoading.value = true;
  try {
    const [mRes, sRes, pRes] = await Promise.all([
      apiClient.get('/movies/search', { params: { query: trimmed } }),
      apiClient.get('/series/search', { params: { query: trimmed } }),
      apiClient.get('/person/search', { params: { query: trimmed } })
    ]);
    movies.value = (mRes.data.results || []).map(i => ({ ...i, media_type: 'movie' }));
    series.value = (sRes.data.results || []).map(i => ({ ...i, media_type: 'serie' }));
    people.value = (pRes.data.results || []).map(i => ({ ...i, media_type: 'person' }));
  } catch (e) {
    console.error('Search error:', e);
  } finally {
    isLoading.value = false;
  }
};

const allResults = computed(() => {
  return [...movies.value, ...series.value, ...people.value].sort(
    (a, b) => (b.popularity || 0) - (a.popularity || 0)
  );
});

const displayedItems = computed(() => {
  if (activeTab.value === 'movie') return movies.value;
  if (activeTab.value === 'serie') return series.value;
  if (activeTab.value === 'person') return people.value;
  return allResults.value;
});

const tabs = computed(() => [
  { id: 'all', label: t('library.allStatus'), count: allResults.value.length },
  { id: 'movie', label: t('common.movies'), count: movies.value.length },
  { id: 'serie', label: t('common.seriesPlural'), count: series.value.length },
  { id: 'person', label: t('search.people'), count: people.value.length }
]);

const submitSearch = () => {
  const trimmed = query.value.trim();
  if (!trimmed) return;
  router.replace({ path: '/search', query: { q: trimmed } });
  runSearch(trimmed);
};

const navigateTo = (item) => {
  if (item.media_type === 'serie') router.push(`/serie/${item.id}`);
  else if (item.media_type === 'person') router.push(`/person/${item.id}`);
  else router.push(`/movie/${item.id}`);
};

watch(
  () => route.query.q,
  (newQ) => {
    query.value = String(newQ || '');
    runSearch(query.value);
  }
);

onMounted(() => {
  fetchUserLibraryStatus();
  if (query.value) runSearch(query.value);
});
</script>

<template>
  <v-container class="search-container py-8 py-md-10">
    <div class="mb-6">
      <h1 class="text-h4 font-weight-bold mb-4">{{ $t('header.search') }}</h1>
      <v-text-field
        v-model="query"
        :placeholder="$t('header.searchPlaceholder')"
        prepend-inner-icon="mdi-magnify"
        variant="outlined"
        rounded="pill"
        hide-details
        clearable
        class="max-w-search"
        @keydown.enter="submitSearch"
      />
    </div>

    <!-- Filter Tabs -->
    <div class="d-flex flex-wrap ga-2 mb-8">
      <button
        v-for="tab in tabs"
        :key="tab.id"
        type="button"
        class="tab-pill"
        :class="{ 'tab-pill-active': activeTab === tab.id }"
        @click="activeTab = tab.id"
      >
        {{ tab.label }}
        <span class="tab-count">{{ tab.count }}</span>
      </button>
    </div>

    <!-- Loading -->
    <v-row v-if="isLoading">
      <v-col v-for="n in 12" :key="n" cols="6" sm="4" md="3" lg="2">
        <v-skeleton-loader type="image, article" class="rounded-xl" />
      </v-col>
    </v-row>

    <!-- Empty -->
    <div v-else-if="displayedItems.length === 0" class="text-center py-16 opacity-65">
      <v-icon size="60" class="mb-3">mdi-magnify-close</v-icon>
      <p class="text-h6 font-weight-bold">{{ $t('common.noResults') }}</p>
    </div>

    <!-- Results Grid -->
    <v-row v-else>
      <v-col
        v-for="item in displayedItems"
        :key="`${item.media_type}-${item.id}`"
        cols="6"
        sm="4"
        md="3"
        lg="2"
      >
        <v-card class="result-card rounded-xl overflow-hidden h-100" elevation="2" @click="navigateTo(item)">
          <div class="poster-wrap">
            <v-img
              :src="
                item.poster_path || item.profile_path
                  ? `https://image.tmdb.org/t/p/w342${item.poster_path || item.profile_path}`
                  : noPoster
              "
              aspect-ratio="2/3"
              cover
            />
            <span
              v-if="getStatusBadge(item)"
              class="lib-status-pill"
              :style="{ backgroundColor: getStatusBadge(item).color }"
            >
              <v-icon size="11" class="mr-1">{{ getStatusBadge(item).icon }}</v-icon>
              {{ $t(getStatusBadge(item).label) }}
            </span>
            <span
              class="type-badge"
              :class="
                item.media_type === 'serie'
                  ? 'b-serie'
                  : item.media_type === 'person'
                  ? 'b-person'
                  : 'b-movie'
              "
            >
              {{
                item.media_type === 'serie'
                  ? $t('header.typeSeries')
                  : item.media_type === 'person'
                  ? $t('header.typePerson')
                  : $t('header.typeMovie')
              }}
            </span>
          </div>
          <div class="pa-3">
            <p class="font-weight-bold text-body-2 mb-1 text-truncate" :title="item.title || item.name">
              {{ item.title || item.name }}
            </p>
            <p class="text-caption opacity-65 mb-0 text-truncate">
              {{
                item.media_type === 'person'
                  ? item.known_for_department || ''
                  : (item.release_date || item.first_air_date || '').split('-')[0] || '—'
              }}
            </p>
          </div>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.search-container {
  max-width: 1360px;
}

.max-w-search {
  max-width: 560px;
}

.tab-pill {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 16px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--app-surface);
  color: inherit;
  font-size: 0.85rem;
  font-weight: 600;
  opacity: 0.72;
  cursor: pointer;
  transition: all 0.18s ease;
}

:root[data-theme='light'] .tab-pill {
  border-color: rgba(0, 0, 0, 0.1);
}

.tab-pill-active {
  background: #8C52FF;
  border-color: #8C52FF;
  color: #ffffff;
  opacity: 1;
}

.tab-count {
  font-size: 0.72rem;
  padding: 1px 7px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.16);
}

.result-card {
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

:root[data-theme='light'] .result-card {
  border-color: rgba(0, 0, 0, 0.08);
}

.result-card:hover {
  transform: translateY(-4px);
  border-color: rgba(140, 82, 255, 0.45);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.32) !important;
}

.poster-wrap {
  position: relative;
}

.type-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  color: #ffffff;
  text-transform: uppercase;
}

.lib-status-pill {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  color: #ffffff;
}

.b-movie {
  background: rgba(59, 130, 246, 0.9);
}
.b-serie {
  background: rgba(140, 82, 255, 0.92);
}
.b-person {
  background: rgba(16, 185, 129, 0.92);
}
</style>
