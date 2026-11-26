<script setup>
import { ref, computed, onMounted, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';
import apiClient from '../api/client';
import noPoster from '../assets/noPosterAvailable.webp';
import AuthDialog from '../components/AuthDialog.vue';

const router = useRouter();
const authStore = useAuthStore();
const { t, locale } = useI18n();

const mediaType = ref('all');
const loadingData = ref(true);

const dayTrendingMovies = ref([]);
const popularMovies = ref([]);
const inTheaterMovies = ref([]);
const upcomingMovies = ref([]);
const dayTrendingSeries = ref([]);
const popularSeries = ref([]);
const upcomingSeries = ref([]);
const generalRecommendations = ref([]);
const loadingRecs = ref(false);

const backendSpotlight = ref([]);
const userLibrary = ref([]);
const newEpisodesMap = ref({});

const dialogAuth = ref(false);
const authMessage = ref('');

const sliderActions = ref(null);
const sliderTrending = ref(null);
const sliderPopular = ref(null);
const sliderInTheater = ref(null);
const sliderUpcoming = ref(null);
const sliderRecommendations = ref(null);

const scroll = (sliderRef, direction) => {
  if (!sliderRef || !sliderRef.$el) return;
  const el = sliderRef.$el.querySelector('.v-slide-group__container');
  if (!el) return;
  const scrollAmount = 600;
  el.scrollBy({ left: direction === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
};

const date = new Date();
const currentDateString = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
  date.getDate()
).padStart(2, '0')}`;

const spotlightItems = computed(() => {
  if (backendSpotlight.value.length > 0) {
    return backendSpotlight.value.map(item => ({
      ...item,
      logoPath: pickLogoPath(item),
      releaseYear: (item.release_date || item.first_air_date || '').split('-')[0]
    }));
  }
  const combined = [...dayTrendingMovies.value, ...dayTrendingSeries.value];
  return combined.sort((a, b) => b.popularity - a.popularity).slice(0, 8);
});

const currentTrending = computed(() => {
  if (mediaType.value === 'movie') return [...dayTrendingMovies.value].sort((a, b) => b.popularity - a.popularity);
  if (mediaType.value === 'serie') return [...dayTrendingSeries.value].sort((a, b) => b.popularity - a.popularity);
  return [...dayTrendingMovies.value, ...dayTrendingSeries.value].sort((a, b) => b.popularity - a.popularity);
});

const currentPopular = computed(() => {
  if (mediaType.value === 'movie') return [...popularMovies.value].sort((a, b) => b.popularity - a.popularity);
  if (mediaType.value === 'serie') return [...popularSeries.value].sort((a, b) => b.popularity - a.popularity);
  return [...popularMovies.value, ...popularSeries.value].sort((a, b) => b.popularity - a.popularity);
});

const filteredInTheaterMovies = computed(() => {
  return inTheaterMovies.value.filter(movie => movie.release_date && movie.release_date <= currentDateString);
});

const currentUpcoming = computed(() => {
  const movies = upcomingMovies.value
    .filter(m => m.release_date && m.release_date >= currentDateString)
    .map(m => ({ ...m, upcomingDate: m.release_date }));
  const series = upcomingSeries.value
    .filter(s => s.first_air_date && s.first_air_date >= currentDateString)
    .map(s => ({ ...s, upcomingDate: s.first_air_date }));

  if (mediaType.value === 'movie') return movies.sort((a, b) => a.upcomingDate.localeCompare(b.upcomingDate));
  if (mediaType.value === 'serie') return series.sort((a, b) => a.upcomingDate.localeCompare(b.upcomingDate));
  return [...movies, ...series].sort((a, b) => b.popularity - a.popularity);
});

const filteredRecommendations = computed(() => {
  if (mediaType.value === 'all') return generalRecommendations.value;
  return generalRecommendations.value.filter(item => item.type === mediaType.value);
});

const actionItems = computed(() => {
  let items = userLibrary.value
    .map(i => {
      const epInfo = i.type === 'serie' ? newEpisodesMap.value[i.id] : null;
      return {
        ...i,
        hasNewEpisodes: Boolean(epInfo && i.status === 'WATCHED'),
        isNewSeason: Boolean(epInfo?.isNewSeason),
        latestEpisodeCode: epInfo?.latestEpisodeCode || null
      };
    })
    .filter(i => {
      return i.hasNewEpisodes || i.status === 'WATCHING' || (i.status === 'WATCHED' && !i.rating);
    });

  if (mediaType.value !== 'all') {
    items = items.filter(i => i.type === mediaType.value);
  }

  return items
    .sort((a, b) => {
      if (a.hasNewEpisodes && !b.hasNewEpisodes) return -1;
      if (b.hasNewEpisodes && !a.hasNewEpisodes) return 1;
      if (a.status === 'WATCHING' && b.status !== 'WATCHING') return -1;
      if (b.status === 'WATCHING' && a.status !== 'WATCHING') return 1;
      return 0;
    })
    .slice(0, 15);
});

const formatShortDate = (dateStr) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'short' }).format(d);
};

const pickLogoPath = (detailsData) => {
  const logos = detailsData?.images?.logos;
  if (!Array.isArray(logos) || logos.length === 0) return null;
  const currentLang = locale.value === 'en' ? 'en' : 'fr';
  const match =
    logos.find(l => l.iso_639_1 === currentLang) ||
    logos.find(l => l.iso_639_1 === 'en') ||
    logos.find(l => !l.iso_639_1) ||
    logos[0];
  return match?.file_path || null;
};

const formatSpotlightMeta = (item) => {
  const parts = [];
  if (item.media_type === 'movie' && item.runtime > 0) {
    const h = Math.floor(item.runtime / 60);
    const m = item.runtime % 60;
    parts.push(h > 0 ? `${h} h ${String(m).padStart(2, '0')}` : `${m} min`);
  } else if (item.media_type === 'serie' && item.number_of_seasons) {
    parts.push(
      `${item.number_of_seasons} ${
        item.number_of_seasons > 1 ? t('media.seasonsPlural') : t('media.seasons')
      }`
    );
  }
  if (Array.isArray(item.genres) && item.genres.length > 0) {
    parts.push(item.genres.slice(0, 3).map(g => g.name).join(', '));
  }
  return parts.join(' • ');
};

const fetchSpotlight = async () => {
  try {
    const res = await apiClient.get('/movies/spotlight');
    backendSpotlight.value = Array.isArray(res.data) ? res.data : [];
  } catch (e) {
    console.error('Error fetching spotlight:', e);
  }
};

const fetchMovies = async () => {
  const [trendingRes, popularRes, inTheaterRes, upcomingRes] = await Promise.all([
    apiClient.get('/movies/trending/day'),
    apiClient.get('/movies/trending'),
    apiClient.get('/movies/in-theater'),
    apiClient.get('/movies/upcoming')
  ]);
  dayTrendingMovies.value = (trendingRes.data.results || []).map(m => ({ ...m, media_type: 'movie' }));
  popularMovies.value = (popularRes.data.results || []).map(m => ({ ...m, media_type: 'movie' }));
  inTheaterMovies.value = (inTheaterRes.data.results || []).map(m => ({ ...m, media_type: 'movie' }));
  upcomingMovies.value = (upcomingRes.data.results || []).map(m => ({ ...m, media_type: 'movie' }));
};

const fetchSeries = async () => {
  const [trendingRes, popularRes, upcomingRes] = await Promise.all([
    apiClient.get('/series/trending/day'),
    apiClient.get('/series/trending'),
    apiClient.get('/series/upcoming')
  ]);
  dayTrendingSeries.value = (trendingRes.data.results || []).map(s => ({ ...s, media_type: 'serie' }));
  popularSeries.value = (popularRes.data.results || []).map(s => ({ ...s, media_type: 'serie' }));
  upcomingSeries.value = (upcomingRes.data.results || []).map(s => ({ ...s, media_type: 'serie' }));
};

const fetchGeneralRecommendations = async (forceRefresh = false) => {
  const token = localStorage.getItem('user_token');
  if (!token) return;
  if (forceRefresh) loadingRecs.value = true;
  try {
    const response = await apiClient.get('/recommendations/general', {
      params: { forceRefresh }
    });
    generalRecommendations.value = response.data;
    if (forceRefresh && sliderRecommendations.value?.$el) {
      const el = sliderRecommendations.value.$el.querySelector('.v-slide-group__container');
      if (el) el.scrollTo({ left: 0, behavior: 'smooth' });
    }
  } catch (e) {
    console.error(e);
  } finally {
    loadingRecs.value = false;
  }
};

const fetchUserLibrary = async () => {
  const token = localStorage.getItem('user_token');
  if (!token) return;
  try {
    const [moviesRes, seriesRes, newEpRes] = await Promise.all([
      apiClient.get('/user/movies'),
      apiClient.get('/user/series'),
      apiClient.get('/user/series/new-episodes').catch(() => ({ data: [] }))
    ]);
    const m = moviesRes.data.map(i => ({ id: i.movie.id, type: 'movie', status: i.status, data: i.movie, rating: i.rating }));
    const s = seriesRes.data.map(i => ({ id: i.serie.id, type: 'serie', status: i.status, data: i.serie, rating: i.rating }));
    userLibrary.value = [...m, ...s];

    const epMap = {};
    (newEpRes.data || []).forEach(entry => {
      epMap[entry.serieId] = entry;
    });
    newEpisodesMap.value = epMap;
  } catch (error) {
    console.error('Erreur récupération bibliothèque:', error);
  }
};

const markSerieAsWatching = async (item, event) => {
  if (event) event.stopPropagation();
  try {
    await apiClient.put(`/user/series/status/${item.id}`, { status: 'WATCHING' });
    const target = userLibrary.value.find(i => i.id === item.id && i.type === 'serie');
    if (target) target.status = 'WATCHING';
    delete newEpisodesMap.value[item.id];
  } catch (error) {
    console.error('Erreur mise à jour statut série:', error);
  }
};

const preloadSpotlightImages = () => {
  spotlightItems.value.forEach(item => {
    const img = new Image();
    img.src = item.backdrop_path
      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
      : item.poster_path
      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
      : noPoster;
  });
};

const loadAllData = async () => {
  try {
    loadingData.value = true;
    await Promise.all([fetchSpotlight(), fetchMovies(), fetchSeries(), fetchGeneralRecommendations(), fetchUserLibrary()]);
    preloadSpotlightImages();
  } catch (error) {
    console.error('Erreur de chargement:', error);
  } finally {
    loadingData.value = false;
  }
};

const refreshRecommendations = () => fetchGeneralRecommendations(true);

const getStatusInfo = (item) => {
  const type = item.media_type || item.type;
  const libItem = userLibrary.value.find(i => i.id === item.id && i.type === type);

  if (!libItem) {
    return { icon: 'mdi-plus', text: t('home.added'), btnColor: 'white', isOutlined: true, hasStatus: false };
  }

  switch (libItem.status) {
    case 'TO_WATCH':
      return { icon: 'mdi-clock-outline', text: t('home.toWatch'), btnColor: 'white', isOutlined: false, hasStatus: true };
    case 'WATCHING':
      return { icon: 'mdi-play-circle-outline', text: t('home.watching'), btnColor: 'info', isOutlined: false, hasStatus: true };
    case 'WATCHED':
      return { icon: 'mdi-check-all', text: t('home.watched'), btnColor: 'success', isOutlined: false, hasStatus: true };
    default:
      return { icon: 'mdi-plus', text: t('home.added'), btnColor: 'white', isOutlined: true, hasStatus: false };
  }
};

const checkAuth = (message) => {
  if (!localStorage.getItem('user_token')) {
    authMessage.value = message;
    dialogAuth.value = true;
    return false;
  }
  return true;
};

const addToWatchlist = async (item, event) => {
  if (event) event.stopPropagation();
  const type = item.media_type || item.type;
  if (userLibrary.value.find(i => i.id === item.id && i.type === type)) return;
  if (!checkAuth(t('auth.mustLogin'))) return;

  const routePath = type === 'serie' ? `/user/series/to-watch/${item.id}` : `/user/movies/to-watch/${item.id}`;
  try {
    await apiClient.post(routePath, {});
    userLibrary.value.push({ id: item.id, type, status: 'TO_WATCH', rating: null });
  } catch (error) {
    console.error("Erreur lors de l'ajout :", error);
  }
};

watch(mediaType, async () => {
  await nextTick();
  [
    sliderActions.value,
    sliderTrending.value,
    sliderPopular.value,
    sliderInTheater.value,
    sliderUpcoming.value,
    sliderRecommendations.value
  ].forEach(slider => {
    if (slider?.$el) {
      const el = slider.$el.querySelector('.v-slide-group__container');
      if (el) el.scrollTo({ left: 0, behavior: 'smooth' });
    }
  });
});

onMounted(loadAllData);
</script>

<template>
  <v-container fluid class="pa-0" style="overflow-x: hidden;">
    <!-- Modern Skeleton Loading matching Hero + Sections -->
    <div v-if="loadingData">
      <div class="hero-skeleton">
        <v-container class="spotlight-content-container">
          <div class="spotlight-inner">
            <div class="d-flex ga-2 mb-4">
              <v-skeleton-loader type="chip" width="90" class="bg-transparent" />
              <v-skeleton-loader type="chip" width="70" class="bg-transparent" />
              <v-skeleton-loader type="chip" width="100" class="bg-transparent" />
            </div>
            <v-skeleton-loader type="heading" width="380" class="mb-4 bg-transparent" />
            <v-skeleton-loader type="text" width="280" class="mb-4 bg-transparent" />
            <v-skeleton-loader type="paragraph" width="520" class="mb-6 bg-transparent" />
            <div class="d-flex ga-3">
              <v-skeleton-loader type="button" width="150" height="46" class="rounded-lg bg-transparent" />
              <v-skeleton-loader type="button" width="180" height="46" class="rounded-lg bg-transparent" />
            </div>
          </div>
        </v-container>
      </div>

      <div class="px-4 px-md-8 pt-6">
        <div v-for="i in 3" :key="`skel-section-${i}`" class="mb-10">
          <v-skeleton-loader type="heading" width="240" class="mb-4 bg-transparent" />
          <div class="d-flex overflow-hidden ga-4">
            <v-skeleton-loader v-for="n in 8" :key="`skel-card-${n}`" type="image" width="150" height="225" class="rounded-xl flex-shrink-0" />
          </div>
        </div>
      </div>
    </div>

    <div v-else>
      <!-- Imposing Full-Bleed Spotlight Hero -->
      <section v-if="spotlightItems.length > 0" class="hero-spotlight-wrapper mb-6">
        <v-carousel
          cycle
          interval="9000"
          height="100%"
          hide-delimiter-background
          show-arrows="hover"
          transition="fade-transition"
          reverse-transition="fade-transition"
          class="spotlight-carousel"
        >
          <v-carousel-item
            v-for="item in spotlightItems"
            :key="`spotlight-${item.media_type}-${item.id}`"
          >
            <div class="spotlight-slide" @click="router.push(`/${item.media_type}/${item.id}`)">
              <div
                class="spotlight-backdrop"
                :style="{
                  backgroundImage: `url(${
                    item.backdrop_path
                      ? `https://image.tmdb.org/t/p/original${item.backdrop_path}`
                      : item.poster_path
                      ? `https://image.tmdb.org/t/p/w500${item.poster_path}`
                      : noPoster
                  })`
                }"
              ></div>
              <div class="spotlight-grad-left"></div>
              <div class="spotlight-grad-bottom"></div>
              <div class="spotlight-bottom-blur"></div>

              <v-container class="spotlight-content-container">
                <div class="spotlight-inner">
                  <div class="d-flex align-center flex-wrap ga-2 mb-4">
                    <span class="featured-pill">{{ $t('home.featured') }}</span>
                    <span class="meta-pill">
                      {{ item.media_type === 'serie' ? $t('common.series').toUpperCase() : $t('common.movie').toUpperCase() }}
                    </span>
                    <span v-if="item.releaseYear || item.release_date || item.first_air_date" class="meta-pill">
                      {{ item.releaseYear || (item.release_date || item.first_air_date).split('-')[0] }}
                    </span>
                    <span v-if="item.vote_average > 0" class="meta-pill meta-pill-score">
                      <v-icon size="14" color="#fbbf24" class="mr-1">mdi-star</v-icon>
                      {{ (Math.round(item.vote_average * 10) / 10).toFixed(1).replace('.', ',') }} {{ $t('common.tmdb') }}
                    </span>
                  </div>

                  <div class="mb-3">
                    <img
                      v-if="item.logoPath"
                      :src="`https://image.tmdb.org/t/p/w500${item.logoPath}`"
                      :alt="item.title || item.name"
                      class="spotlight-logo"
                    />
                    <h1 v-else class="spotlight-title">
                      {{ item.title || item.name }}
                    </h1>
                  </div>

                  <p v-if="formatSpotlightMeta(item)" class="spotlight-meta mb-3">
                    {{ formatSpotlightMeta(item) }}
                  </p>

                  <p class="spotlight-overview mb-6">
                    {{ item.overview || $t('common.noDescription') }}
                  </p>

                  <div class="d-flex align-center flex-wrap ga-3">
                    <v-btn
                      color="#8C52FF"
                      variant="flat"
                      rounded="lg"
                      height="46"
                      class="px-6 font-weight-bold text-none spotlight-primary-btn"
                      @click.stop="router.push(`/${item.media_type}/${item.id}`)"
                    >
                      <v-icon start size="20">mdi-information-outline</v-icon>
                      {{ $t('common.details') }}
                    </v-btn>

                    <v-btn
                      variant="flat"
                      rounded="lg"
                      height="46"
                      class="px-5 font-weight-semibold text-none spotlight-glass-btn"
                      @click.stop="addToWatchlist(item, $event)"
                    >
                      <v-icon start size="20">{{ getStatusInfo(item).icon }}</v-icon>
                      <span>{{ getStatusInfo(item).text }}</span>
                    </v-btn>
                  </div>
                </div>
              </v-container>
            </div>
          </v-carousel-item>
        </v-carousel>
      </section>

      <!-- Original Filter Toggle -->
      <div class="d-flex justify-end px-4 px-md-8 mb-6 toggle-container">
        <v-btn-toggle
          v-model="mediaType"
          color="#8C52FF"
          mandatory
          rounded="xl"
          variant="outlined"
          density="compact"
          class="filter-toggle"
        >
          <v-btn value="all" class="text-none font-weight-bold px-6">{{ $t('home.general') }}</v-btn>
          <v-btn value="movie" class="text-none font-weight-bold px-6">{{ $t('common.movies') }}</v-btn>
          <v-btn value="serie" class="text-none font-weight-bold px-6">{{ $t('common.seriesPlural') }}</v-btn>
        </v-btn-toggle>
      </div>

      <!-- Section Votre suivi (Original Style) -->
      <div v-if="authStore.showWatchlistOnMainPage && actionItems.length > 0" class="pb-8">
        <div class="d-flex align-center justify-space-between section-header">
          <h1 class="text-h5 font-weight-bold mb-2 section-title">{{ $t('home.followUp') }}</h1>
          <div class="navigation-arrows">
            <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderActions, 'prev')"></v-btn>
            <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderActions, 'next')"></v-btn>
          </div>
        </div>

        <v-slide-group ref="sliderActions" :show-arrows="false" class="full-width-slide">
          <v-slide-group-item v-for="item in actionItems" :key="`action-item-${item.type}-${item.id}`">
            <div class="card-container ma-4">
              <div class="border-wrapper">
                <v-card class="movie-card" rounded="l" width="150" flat @click="$router.push(`/${item.type}/${item.id}`)">
                  <v-tooltip activator="parent" location="bottom">{{ item.data.title || item.data.name }}</v-tooltip>
                  <v-img :src="item.data.posterUrl ? `https://image.tmdb.org/t/p/w500${item.data.posterUrl}` : noPoster" cover aspect-ratio="2/3" class="movie-img"></v-img>

                  <div v-if="mediaType === 'all'" class="badge-container pa-1">
                    <v-chip size="x-small" variant="flat" :color="item.type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                      {{ item.type === 'serie' ? $t('common.series') : $t('common.movie') }}
                    </v-chip>
                  </div>

                  <div class="badge-container-bottom pa-1">
                    <v-chip
                      v-if="item.hasNewEpisodes"
                      size="x-small"
                      color="#FF528C"
                      variant="flat"
                      class="text-white font-weight-bold shadow-badge"
                      :title="item.latestEpisodeCode ? `${item.isNewSeason ? $t('home.newSeason') : $t('home.newEpisode')} (${item.latestEpisodeCode})` : ''"
                    >
                      <v-icon start icon="mdi-star-four-points" size="12"></v-icon>
                      {{ item.isNewSeason ? $t('home.newSeason') : $t('home.newEpisode') }}
                    </v-chip>
                    <v-chip v-else size="x-small" :color="item.status === 'WATCHING' ? 'info' : 'success'" variant="flat" class="text-white font-weight-bold shadow-badge">
                      <v-icon start :icon="item.status === 'WATCHING' ? 'mdi-play-circle-outline' : 'mdi-star-outline'" size="12"></v-icon>
                      {{ item.status === 'WATCHING' ? $t('home.watching') : $t('common.rating') }}
                    </v-chip>
                  </div>

                  <div class="quick-actions-overlay d-flex flex-column align-center justify-center ga-3">
                    <v-btn icon="mdi-arrow-right" color="white" variant="flat" density="comfortable" class="elevation-4 no-focus hover-scale" :ripple="false" v-tooltip="$t('common.details')" @click.stop="$router.push(`/${item.type}/${item.id}`)"></v-btn>
                    <v-btn
                      v-if="item.hasNewEpisodes"
                      icon="mdi-play-circle-outline"
                      color="#8C52FF"
                      variant="flat"
                      density="comfortable"
                      class="elevation-4 no-focus hover-scale text-white"
                      :ripple="false"
                      v-tooltip="$t('home.resumeWatching')"
                      @click.stop="markSerieAsWatching(item, $event)"
                    ></v-btn>
                  </div>
                </v-card>
              </div>
            </div>
          </v-slide-group-item>
        </v-slide-group>
      </div>

      <!-- Section Recommandations (Original Style) -->
      <div v-if="filteredRecommendations.length > 0" class="pb-8">
        <div class="d-flex align-center justify-space-between section-header">
          <h1 class="text-h5 font-weight-bold mb-2 section-title d-flex align-center">
            <v-icon color="#8C52FF" class="mr-2" size="28">mdi-star-shooting</v-icon>
            {{ $t('home.recommended') }}
            <v-btn icon="mdi-refresh" variant="text" size="small" color="#8C52FF" class="ml-2 no-focus hover-scale" :ripple="false" :loading="loadingRecs" @click="refreshRecommendations"></v-btn>
          </h1>
          <div class="navigation-arrows">
            <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderRecommendations, 'prev')"></v-btn>
            <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderRecommendations, 'next')"></v-btn>
          </div>
        </div>

        <v-slide-group ref="sliderRecommendations" :show-arrows="false" class="full-width-slide">
          <v-slide-group-item v-for="item in filteredRecommendations" :key="`rec-item-${item.type}-${item.id}`">
            <div class="card-container ma-4">
              <div class="border-wrapper">
                <v-card class="movie-card" rounded="l" width="150" flat @click="$router.push(`/${item.type}/${item.id}`)">
                  <v-tooltip activator="parent" location="bottom">{{ item.title || item.name }}</v-tooltip>
                  <v-img :src="item.posterPath ? `https://image.tmdb.org/t/p/w500${item.posterPath}` : noPoster" cover aspect-ratio="2/3" class="movie-img"></v-img>

                  <div v-if="mediaType === 'all'" class="badge-container pa-1">
                    <v-chip size="x-small" variant="flat" :color="item.type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                      {{ item.type === 'serie' ? $t('common.series') : $t('common.movie') }}
                    </v-chip>
                  </div>

                  <div class="badge-container-bottom pa-1" v-if="item.voteAverage">
                    <v-chip size="x-small" color="black" variant="flat" class="text-white font-weight-bold shadow-badge opacity-90">
                      <v-icon start icon="mdi-star" size="12" color="amber"></v-icon>
                      {{ Math.round(item.voteAverage * 10) / 10 }}
                    </v-chip>
                  </div>

                  <div class="quick-actions-overlay d-flex flex-column align-center justify-center ga-3">
                    <v-btn icon="mdi-play" color="white" variant="flat" density="comfortable" class="elevation-4 no-focus hover-scale" :ripple="false" v-tooltip="$t('common.details')" @click.stop="$router.push(`/${item.type}/${item.id}`)"></v-btn>
                    <v-btn :icon="getStatusInfo(item).icon" :color="getStatusInfo(item).btnColor" :variant="getStatusInfo(item).isOutlined ? 'outlined' : 'flat'" density="comfortable" class="no-focus" :class="{ 'quick-btn-border': getStatusInfo(item).isOutlined, 'hover-scale': !getStatusInfo(item).hasStatus }" :ripple="false" v-tooltip="getStatusInfo(item).text" @click.stop="addToWatchlist(item, $event)" :style="{ cursor: getStatusInfo(item).hasStatus ? 'default' : 'pointer' }"></v-btn>
                  </div>
                </v-card>
              </div>
            </div>
          </v-slide-group-item>
        </v-slide-group>
      </div>

      <!-- Section Tendances (Original Style) -->
      <div class="pb-8">
        <div class="d-flex align-center justify-space-between section-header">
          <h1 class="text-h5 font-weight-bold mb-2 section-title">{{ $t('home.trending') }}</h1>
          <div class="navigation-arrows">
            <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderTrending, 'prev')"></v-btn>
            <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderTrending, 'next')"></v-btn>
          </div>
        </div>

        <v-slide-group ref="sliderTrending" :show-arrows="false" class="full-width-slide pt-4">
          <v-slide-group-item v-for="(item, index) in currentTrending" :key="`trend-${item.media_type}-${item.id}`">
            <div class="card-container ma-4">
              <div class="border-wrapper">
                <v-card class="movie-card" rounded="l" width="150" flat @click="$router.push(`/${item.media_type}/${item.id}`)">
                  <v-tooltip activator="parent" location="bottom">{{ item.title || item.name }}</v-tooltip>
                  <v-img :src="item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : noPoster" cover aspect-ratio="2/3" class="movie-img"></v-img>

                  <div v-if="mediaType === 'all'" class="badge-container pa-1">
                    <v-chip size="x-small" variant="flat" :color="item.media_type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                      {{ item.media_type === 'serie' ? $t('common.series') : $t('common.movie') }}
                    </v-chip>
                  </div>

                  <div class="quick-actions-overlay d-flex flex-column align-center justify-center ga-3">
                    <v-btn icon="mdi-play" color="white" variant="flat" density="comfortable" class="elevation-4 no-focus hover-scale" :ripple="false" v-tooltip="$t('common.details')" @click.stop="$router.push(`/${item.media_type}/${item.id}`)"></v-btn>
                    <v-btn :icon="getStatusInfo(item).icon" :color="getStatusInfo(item).btnColor" :variant="getStatusInfo(item).isOutlined ? 'outlined' : 'flat'" density="comfortable" class="no-focus" :class="{ 'quick-btn-border': getStatusInfo(item).isOutlined, 'hover-scale': !getStatusInfo(item).hasStatus }" :ripple="false" v-tooltip="getStatusInfo(item).text" @click.stop="addToWatchlist(item, $event)" :style="{ cursor: getStatusInfo(item).hasStatus ? 'default' : 'pointer' }"></v-btn>
                  </div>
                </v-card>
              </div>
              <svg class="ranking-number" viewBox="0 0 160 120" overflow="visible">
                <text x="0" y="105" class="svg-text">{{ index + 1 }}</text>
              </svg>
            </div>
          </v-slide-group-item>
        </v-slide-group>
      </div>

      <!-- Section Populaires (Original Style) -->
      <div class="pb-8">
        <div class="d-flex align-center justify-space-between section-header">
          <h1 class="text-h5 font-weight-bold mb-2 section-title">{{ $t('home.popular') }}</h1>
          <div class="navigation-arrows">
            <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderPopular, 'prev')"></v-btn>
            <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderPopular, 'next')"></v-btn>
          </div>
        </div>

        <v-slide-group ref="sliderPopular" :show-arrows="false" class="full-width-slide">
          <v-slide-group-item v-for="(item, index) in currentPopular" :key="`pop-${item.media_type}-${item.id}`">
            <div class="card-container ma-4">
              <div class="border-wrapper">
                <v-card class="movie-card" rounded="l" width="150" flat @click="$router.push(`/${item.media_type}/${item.id}`)">
                  <v-tooltip activator="parent" location="bottom">{{ item.title || item.name }}</v-tooltip>
                  <v-img :src="item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : noPoster" cover aspect-ratio="2/3" class="movie-img"></v-img>

                  <div v-if="mediaType === 'all'" class="badge-container pa-1">
                    <v-chip size="x-small" variant="flat" :color="item.media_type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                      {{ item.media_type === 'serie' ? $t('common.series') : $t('common.movie') }}
                    </v-chip>
                  </div>

                  <div class="quick-actions-overlay d-flex flex-column align-center justify-center ga-3">
                    <v-btn icon="mdi-play" color="white" variant="flat" density="comfortable" class="elevation-4 no-focus hover-scale" :ripple="false" v-tooltip="$t('common.details')" @click.stop="$router.push(`/${item.media_type}/${item.id}`)"></v-btn>
                    <v-btn :icon="getStatusInfo(item).icon" :color="getStatusInfo(item).btnColor" :variant="getStatusInfo(item).isOutlined ? 'outlined' : 'flat'" density="comfortable" class="no-focus" :class="{ 'quick-btn-border': getStatusInfo(item).isOutlined, 'hover-scale': !getStatusInfo(item).hasStatus }" :ripple="false" v-tooltip="getStatusInfo(item).text" @click.stop="addToWatchlist(item, $event)" :style="{ cursor: getStatusInfo(item).hasStatus ? 'default' : 'pointer' }"></v-btn>
                  </div>
                </v-card>
              </div>
              <svg class="ranking-number" viewBox="0 0 160 120" overflow="visible">
                <text x="0" y="105" class="svg-text">{{ index + 1 }}</text>
              </svg>
            </div>
          </v-slide-group-item>
        </v-slide-group>
      </div>

      <!-- Section En Salles (Original Style) -->
      <div v-if="mediaType === 'movie' || mediaType === 'all'" class="pb-8">
        <div class="d-flex align-center justify-space-between section-header">
          <h1 class="text-h5 font-weight-bold mb-2 section-title" :title="$t('home.releasedRecently')">{{ $t('home.theaters') }}</h1>
          <div class="navigation-arrows">
            <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderInTheater, 'prev')"></v-btn>
            <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderInTheater, 'next')"></v-btn>
          </div>
        </div>

        <v-slide-group ref="sliderInTheater" :show-arrows="false" class="full-width-slide">
          <v-slide-group-item v-for="(movie, index) in filteredInTheaterMovies" :key="`in-theater-${movie.id}`">
            <div class="card-container ma-4">
              <div class="border-wrapper">
                <v-card class="movie-card" rounded="l" width="150" flat @click="$router.push(`/movie/${movie.id}`)">
                  <v-tooltip activator="parent" location="bottom">{{ movie.title || movie.name }}</v-tooltip>
                  <v-img :src="movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : noPoster" cover aspect-ratio="2/3" class="movie-img"></v-img>

                  <div v-if="mediaType === 'all'" class="badge-container pa-1">
                    <v-chip size="x-small" variant="flat" color="grey-darken-3" class="text-white font-weight-bold shadow-badge">{{ $t('common.movie') }}</v-chip>
                  </div>

                  <div class="quick-actions-overlay d-flex flex-column align-center justify-center ga-3">
                    <v-btn icon="mdi-play" color="white" variant="flat" density="comfortable" class="elevation-4 no-focus hover-scale" :ripple="false" v-tooltip="$t('common.details')" @click.stop="$router.push(`/movie/${movie.id}`)"></v-btn>
                    <v-btn :icon="getStatusInfo(movie).icon" :color="getStatusInfo(movie).btnColor" :variant="getStatusInfo(movie).isOutlined ? 'outlined' : 'flat'" density="comfortable" class="no-focus" :class="{ 'quick-btn-border': getStatusInfo(movie).isOutlined, 'hover-scale': !getStatusInfo(movie).hasStatus }" :ripple="false" v-tooltip="getStatusInfo(movie).text" @click.stop="addToWatchlist(movie, $event)" :style="{ cursor: getStatusInfo(movie).hasStatus ? 'default' : 'pointer' }"></v-btn>
                  </div>
                </v-card>
              </div>
              <svg class="ranking-number" viewBox="0 0 160 120" overflow="visible">
                <text x="0" y="105" class="svg-text">{{ index + 1 }}</text>
              </svg>
            </div>
          </v-slide-group-item>
        </v-slide-group>
      </div>

      <!-- Section Bientôt (Original Style) -->
      <div v-if="currentUpcoming.length > 0" class="pb-8">
        <div class="d-flex align-center justify-space-between section-header">
          <h1 class="text-h5 font-weight-bold mb-2 section-title">{{ $t('home.upcoming') }}</h1>
          <div class="navigation-arrows">
            <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderUpcoming, 'prev')"></v-btn>
            <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderUpcoming, 'next')"></v-btn>
          </div>
        </div>

        <v-slide-group ref="sliderUpcoming" :show-arrows="false" class="full-width-slide">
          <v-slide-group-item v-for="item in currentUpcoming" :key="`upcoming-${item.media_type}-${item.id}`">
            <div class="card-container ma-4">
              <div class="border-wrapper">
                <v-card class="movie-card" rounded="l" width="150" flat @click="$router.push(`/${item.media_type}/${item.id}`)">
                  <v-tooltip activator="parent" location="bottom">{{ item.title || item.name }}</v-tooltip>
                  <v-img :src="item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : noPoster" cover aspect-ratio="2/3" class="movie-img"></v-img>

                  <div v-if="mediaType === 'all'" class="badge-container pa-1">
                    <v-chip size="x-small" variant="flat" :color="item.media_type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                      {{ item.media_type === 'serie' ? $t('common.series') : $t('common.movie') }}
                    </v-chip>
                  </div>

                  <div class="badge-container-bottom pa-1">
                    <v-chip size="x-small" color="#8C52FF" variant="flat" class="text-white font-weight-bold shadow-badge">
                      {{ formatShortDate(item.upcomingDate) }}
                    </v-chip>
                  </div>

                  <div class="quick-actions-overlay d-flex flex-column align-center justify-center ga-3">
                    <v-btn icon="mdi-play" color="white" variant="flat" density="comfortable" class="elevation-4 no-focus hover-scale" :ripple="false" v-tooltip="$t('common.details')" @click.stop="$router.push(`/${item.media_type}/${item.id}`)"></v-btn>
                    <v-btn :icon="getStatusInfo(item).icon" :color="getStatusInfo(item).btnColor" :variant="getStatusInfo(item).isOutlined ? 'outlined' : 'flat'" density="comfortable" class="no-focus" :class="{ 'quick-btn-border': getStatusInfo(item).isOutlined, 'hover-scale': !getStatusInfo(item).hasStatus }" :ripple="false" v-tooltip="getStatusInfo(item).text" @click.stop="addToWatchlist(item, $event)" :style="{ cursor: getStatusInfo(item).hasStatus ? 'default' : 'pointer' }"></v-btn>
                  </div>
                </v-card>
              </div>
            </div>
          </v-slide-group-item>
        </v-slide-group>
      </div>
    </div>
  </v-container>

  <AuthDialog v-model="dialogAuth" :message="authMessage" />
</template>

<style scoped>
/* Hero Spotlight & Skeleton */
.hero-spotlight-wrapper,
.hero-skeleton {
  position: relative;
  width: 100%;
  height: 76vh;
  min-height: 540px;
  max-height: 780px;
  overflow: hidden;
  background: #0b0c10;
}

.hero-skeleton {
  display: flex;
  align-items: flex-end;
  padding-bottom: 56px;
  background: linear-gradient(135deg, rgba(140, 82, 255, 0.12) 0%, rgba(23, 25, 34, 0.9) 60%, var(--app-background) 100%);
}

.spotlight-carousel {
  height: 100% !important;
}

.spotlight-slide {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: flex-end;
  padding-bottom: 56px;
  cursor: pointer;
}

.spotlight-backdrop {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 20%;
  transition: transform 6s ease;
  z-index: 0;
}

.spotlight-slide:hover .spotlight-backdrop {
  transform: scale(1.02);
}

.spotlight-grad-left {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(15, 16, 21, 0.96) 0%,
    rgba(15, 16, 21, 0.78) 40%,
    rgba(15, 16, 21, 0.25) 75%,
    rgba(15, 16, 21, 0.1) 100%
  );
  z-index: 1;
}

.spotlight-grad-bottom {
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, var(--app-background) 0%, rgba(15, 16, 21, 0.65) 26%, transparent 58%);
  z-index: 2;
}

.spotlight-bottom-blur {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 100px;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  mask-image: linear-gradient(to top, black 0%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, black 0%, transparent 100%);
  z-index: 2;
  pointer-events: none;
}

.spotlight-content-container {
  position: relative;
  z-index: 3;
  max-width: 1440px;
}

.spotlight-inner {
  max-width: 660px;
  color: #ffffff;
}

.featured-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  background: linear-gradient(135deg, #8C52FF 0%, #FF528C 100%);
  color: #ffffff;
  box-shadow: 0 4px 16px rgba(140, 82, 255, 0.45);
}

.meta-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 11px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.14);
  border: 1px solid rgba(255, 255, 255, 0.16);
  backdrop-filter: blur(10px);
  color: #f3f4f6;
}

.meta-pill-score {
  background: rgba(251, 191, 36, 0.16);
  border-color: rgba(251, 191, 36, 0.3);
  color: #fde68a;
}

.spotlight-logo {
  max-height: 110px;
  max-width: min(440px, 82vw);
  width: auto;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 6px 24px rgba(0, 0, 0, 0.6));
}

.spotlight-title {
  font-size: clamp(2rem, 4vw, 3.2rem);
  font-weight: 800;
  line-height: 1.1;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

.spotlight-meta {
  font-size: 0.92rem;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.84);
}

.spotlight-overview {
  font-size: 0.96rem;
  line-height: 1.55;
  color: rgba(255, 255, 255, 0.88);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.spotlight-primary-btn {
  box-shadow: 0 8px 24px rgba(140, 82, 255, 0.4);
}

.spotlight-glass-btn {
  background: rgba(255, 255, 255, 0.14) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  backdrop-filter: blur(12px);
  color: #ffffff !important;
}

/* Original Section & Card Styles */
.filter-toggle {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
}

.no-focus::after,
.no-focus:focus-visible::after,
.no-focus:focus::after {
  opacity: 0 !important;
  display: none !important;
}
.no-focus .v-btn__overlay,
.no-focus .v-btn__underlay {
  opacity: 0 !important;
  background: transparent !important;
  display: none !important;
}
.no-focus {
  transition: transform 0.2s ease;
}

.hover-scale:hover {
  transform: scale(1.08);
}

.full-width-slide {
  width: 100%;
}

.section-header {
  width: 100%;
  padding: 0 16px;
  position: relative;
  border-bottom: 2px solid rgba(255, 255, 255, 0.12);
  padding-bottom: 10px;
  margin-bottom: 15px;
}

:root[data-theme='light'] .section-header {
  border-bottom-color: rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .section-header {
    padding: 0 32px;
  }
}

.navigation-arrows {
  display: flex;
  gap: 4px;
}

.section-title {
  margin-left: 0 !important;
  margin-bottom: 0 !important;
}

.card-container {
  position: relative;
}

.v-slide-group-item:first-child .card-container {
  margin-left: 0 !important;
}

.border-wrapper {
  border: 4px solid var(--poster-border);
  border-radius: 20px;
  overflow: hidden;
  width: fit-content;
  z-index: 1;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
  position: relative;
  transform: translateZ(0);
}

.movie-card {
  cursor: pointer;
  background: #000;
  position: relative;
}

.movie-img {
  transition: transform 0.3s ease, filter 0.3s ease;
  width: 150px;
  height: 225px;
  backface-visibility: hidden;
  transform-style: preserve-3d;
}

.quick-actions-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  opacity: 0;
  transition: opacity 0.3s ease;
  z-index: 15;
}

.quick-btn-border {
  border: 2px solid white !important;
}
.v-btn--variant-flat.quick-btn-border {
  border: 2px solid transparent !important;
}

.movie-card:hover .movie-img {
  transform: scale(1.1) translateZ(0);
  filter: blur(2px);
}

.movie-card:hover .quick-actions-overlay {
  opacity: 1;
}

@media (max-width: 767px) {
  .hero-spotlight-wrapper,
  .hero-skeleton {
    height: 68vh;
    min-height: 480px;
  }
  .quick-actions-overlay {
    display: none !important;
  }
  .movie-card:hover .movie-img {
    transform: none !important;
    filter: none !important;
  }
}

.badge-container {
  position: absolute;
  top: 0;
  right: 0;
  z-index: 10;
  pointer-events: none;
}

.badge-container-bottom {
  position: absolute;
  bottom: 0;
  right: 0;
  z-index: 10;
  pointer-events: none;
}

.ranking-number {
  position: absolute;
  bottom: -15px;
  left: -25px;
  width: 160px;
  height: 120px;
  z-index: 2;
  pointer-events: none;
  user-select: none;
  filter: drop-shadow(2px 2px 6px rgba(0, 0, 0, 0.4));
}

.svg-text {
  font-size: 6rem;
  font-weight: 900;
  fill: #e1e1e1;
  stroke: #ffffff;
  stroke-width: 4px;
  stroke-linejoin: round;
  paint-order: stroke fill;
}

:root[data-theme='light'] .svg-text {
  fill: #1f2937;
  stroke: #ffffff;
}

.shadow-badge {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.4);
}

:deep(.v-slide-group__content) {
  padding: 0 16px;
}
@media (min-width: 768px) {
  :deep(.v-slide-group__content) {
    padding: 0 32px;
  }
}
:deep(.v-slide-group__prev),
:deep(.v-slide-group__next) {
  display: none !important;
}
</style>
