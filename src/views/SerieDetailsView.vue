<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

// Modales
import ConfirmationDialog from '../components/ConfirmationDialog.vue';
import AuthDialog from '../components/AuthDialog.vue';
import DateDialog from '../components/DateDialog.vue';
import RatingDialog from '../components/RatingDialog.vue';
import TrailerDialog from '../components/TrailerDialog.vue';

// Nouveaux composants UI Extraits
import MediaBanner from '../components/MediaBanner.vue';
import MediaSkeletonLoader from '../components/MediaSkeletonLoader.vue';
import MediaActionButtons from '../components/MediaActionButtons.vue';
import TmdbScore from '../components/TmdbScore.vue';
import CastCarousel from '../components/CastCarousel.vue';
import SimilarMediaCarousel from '../components/SimilarMediaCarousel.vue';
import EpisodeNextLast from '../components/EpisodeNextLast.vue';
import SeasonCarousel from '../components/SeasonCarousel.vue';
import SeasonEpisodesList from '../components/SeasonEpisodesList.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const serieId = computed(() => route.params.id);

const isLoading = ref(true);
const serieDetails = ref({});
const serieCredits = ref({});
const similarSeries = ref([]);
const trailerKey = ref(null);

const dialogTrailer = ref(false);
const dialogConfirmation = ref(false);
const dialogDate = ref(false);
const dialogNote = ref(false);
const dialogAuth = ref(false);
const authMessage = ref("");

const userRating = ref(0);
const userComment = ref("");
const statusUserSerie = ref("UNDEFINED");
const textVuAvecDate = ref(t('common.watched'));

const selectedSeasonInfo = ref(null);
const loadingSeason = ref(false);
const activeSeasonNumber = ref(null);

const textButtonStatus = computed(() => ({
  "WATCHED": { text: textVuAvecDate.value, icon: "mdi-check-all" },
  "WATCHING": { text: t('common.watching'), icon: "mdi-play-circle-outline" },
  "TO_WATCH": { text: t('common.watch'), icon: "mdi-clock-outline" },
  "UNDEFINED": { text: t('media.add'), icon: "mdi-plus" }
}));

const allActions = computed(() => [
  { id: 'TO_WATCH', text: t('common.watch'), icon: 'mdi-clock-outline' },
  { id: 'WATCHING', text: t('common.watching'), icon: 'mdi-play-circle-outline' },
  { id: 'WATCHED', text: t('common.watched'), icon: 'mdi-check-all' },
  { id: 'DATE', text: t('media.changeDate'), icon: 'mdi-calendar' },
  { id: 'DELETE', text: t('media.deleteFromList'), icon: 'mdi-delete', color: 'error' }
]);

const itemsStatus = computed(() => {
  switch (statusUserSerie.value) {
    case 'TO_WATCH': return allActions.value.filter(i => ['WATCHING', 'WATCHED', 'DELETE'].includes(i.id));
    case 'WATCHING': return allActions.value.filter(i => ['TO_WATCH', 'WATCHED', 'DELETE'].includes(i.id));
    case 'WATCHED': return allActions.value.filter(i => ['TO_WATCH', 'WATCHING', 'DATE', 'DELETE'].includes(i.id));
    default: return [];
  }
});

const serieStatus = computed(() => {
  const status = serieDetails.value.status;
  if (status === 'Returning Series') return t('media.returningSeries');
  if (status === 'Ended') return t('media.ended');
  if (status === 'Canceled') return t('media.canceled');
  if (status === 'In Production') return t('media.production');
  return status || '';
});

const handleAuthError = (error) => {
  if (error.response && error.response.status === 403) {
    localStorage.removeItem('user_token');
    authMessage.value = t('media.sessionExpired');
    dialogAuth.value = true;
    return true;
  }
  return false;
};

const fetchDetailsSerie = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/series/${serieId.value}`);
    serieDetails.value = response.data;
    if (serieDetails.value.first_air_date) {
      serieDetails.value.release_year = serieDetails.value.first_air_date.split('-')[0];
    }
    if (serieDetails.value.last_air_date) {
      serieDetails.value.last_air_year = serieDetails.value.last_air_date.split('-')[0];
    }
    if (serieDetails.value.episode_run_time?.length > 0) {
      const rm = serieDetails.value.episode_run_time[0];
      serieDetails.value.runtimeFormatted = rm >= 60 ? `${Math.floor(rm/60)}h ${String(rm%60).padStart(2, '0')}min / ${t('media.episodeShort')}` : `${rm} min / ${t('media.episodeShort')}`;
    }
    const creditsResponse = await axios.get(`${API_BASE_URL}/series/${serieId.value}/credits`);
    serieCredits.value = creditsResponse.data;
  } catch (error) { console.error('Error fetching series details:', error); }
};

const fetchSimilarSeries = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/series/${serieId.value}/similar`);
    similarSeries.value = response.data.results.slice(0, 12);
  } catch (error) { console.error('Error fetching similar series:', error); }
};

const fetchVideos = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/series/${serieId.value}/videos`);
    const trailer = response.data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) trailerKey.value = trailer.key;
  } catch (error) { console.error('Error fetching videos:', error); }
};

const fetchStatusUserSerie = async () => {
  try {
    const token = localStorage.getItem('user_token');
    if (!token) return;
    const response = await axios.get(`${API_BASE_URL}/user/series/status/${serieId.value}`, { headers: { Authorization: `Bearer ${token}` } });
    statusUserSerie.value = response.data;
    
    if (statusUserSerie.value === "WATCHED") {
      const watchedResponse = await axios.get(`${API_BASE_URL}/user/series/watched-date/${serieId.value}`, { headers: { Authorization: `Bearer ${token}` } });
      if (watchedResponse.data && !String(watchedResponse.data).startsWith("1970-01-01")) {
        const d = new Date(watchedResponse.data);
        textVuAvecDate.value = `${t('media.finishedOn')} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
      } else {
        textVuAvecDate.value = t('media.finishedLongAgo');
      }
    }
  } catch (error) { handleAuthError(error); }
};

const fetchRating = async () => {
  try {
    const token = localStorage.getItem('user_token');
    if (!token) return;
    const [resRating, resComment] = await Promise.all([
      axios.get(`${API_BASE_URL}/user/series/rating/${serieId.value}`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE_URL}/user/series/comment/${serieId.value}`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    userComment.value = ['UNDEFINED', null, 'NO_COMMENT'].includes(resComment.data) ? "" : (resComment.data || "");
    userRating.value = resRating.data || 0;
  } catch (error) {
    handleAuthError(error);
    userRating.value = 0;
    userComment.value = "";
  }
};

const fetchSeasonDetails = async (seasonNumber) => {
  if (activeSeasonNumber.value === seasonNumber) {
    selectedSeasonInfo.value = null; activeSeasonNumber.value = null; return;
  }
  loadingSeason.value = true;
  activeSeasonNumber.value = seasonNumber;
  try {
    const response = await axios.get(`${API_BASE_URL}/series/${serieId.value}/season/${seasonNumber}`);
    selectedSeasonInfo.value = response.data;
  } catch (error) { console.error('Erreur chargement saison:', error); } 
  finally { loadingSeason.value = false; }
};

const displayRating = computed(() => userRating.value > 0 ? `${userRating.value}/10` : t('common.rating'));
const allGenres = computed(() => Array.isArray(serieDetails.value.genres) ? serieDetails.value.genres.map(g => g.name).join(', ') : '');
const periodYears = computed(() => {
  if (!serieDetails.value.release_year) return '';
  if (serieDetails.value.status === 'Ended' || serieDetails.value.status === 'Canceled') {
    return `${serieDetails.value.release_year} - ${serieDetails.value.last_air_year || ''}`;
  }
  return `${serieDetails.value.release_year} - ${t('common.today')}`;
});

const checkAuth = (message) => {
  if (!localStorage.getItem('user_token')) {
    authMessage.value = message; dialogAuth.value = true; return false;
  }
  return true;
};

const handleMainButtonClick = () => {
  if (!checkAuth(t('auth.mustLogin'))) return;
  if (statusUserSerie.value === "UNDEFINED") {
    axios.post(`${API_BASE_URL}/user/series/to-watch/${serieId.value}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } })
      .then(() => statusUserSerie.value = "TO_WATCH").catch(handleAuthError);
  }
};

const updateStatus = async (newStatus) => {
  if (!checkAuth(t('auth.mustLogin'))) return;
  if (newStatus === 'DELETE') return (dialogConfirmation.value = true);
  if (newStatus === 'DATE') return (dialogDate.value = true);
  
  try {
    const token = localStorage.getItem('user_token');
    let payload = { status: newStatus };
    if (newStatus === 'WATCHED') {
      const today = new Date();
      payload.watchedAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      textVuAvecDate.value = `${t('media.finishedOn')} ${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    }
    await axios.put(`${API_BASE_URL}/user/series/status/${serieId.value}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    statusUserSerie.value = newStatus;
  } catch (error) { handleAuthError(error); }
};

const confirmDelete = async () => {
  try {
    await axios.delete(`${API_BASE_URL}/user/series/status/${serieId.value}`, { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } });
    statusUserSerie.value = "UNDEFINED";
    dialogConfirmation.value = false;
    userComment.value = "";
    userRating.value = 0;
  } catch (error) { handleAuthError(error); }
};

const handleDateConfirm = async (dateData) => {
  try {
    let formattedDate = "1970-01-01";
    let dateText = t('media.finishedLongAgo');
    if (dateData !== 'long-time-ago') {
      formattedDate = `${dateData.getFullYear()}-${String(dateData.getMonth() + 1).padStart(2, '0')}-${String(dateData.getDate()).padStart(2, '0')}`;
      dateText = `${t('media.finishedOn')} ${String(dateData.getDate()).padStart(2, '0')}/${String(dateData.getMonth() + 1).padStart(2, '0')}/${dateData.getFullYear()}`;
    }
    await axios.put(`${API_BASE_URL}/user/series/status/${serieId.value}`, { status: "WATCHED", watchedAt: formattedDate }, { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } });
    textVuAvecDate.value = dateText;
    statusUserSerie.value = "WATCHED";
  } catch (error) { handleAuthError(error); }
};

const saveRating = async ({ rating, comment }) => {
  try {
    userRating.value = rating;
    userComment.value = comment;
    await axios.put(`${API_BASE_URL}/user/series/rate/${serieId.value}`, { rating, comment }, { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } });
    fetchStatusUserSerie();
  } catch (error) { handleAuthError(error); }
};

const loadAllData = async () => {
  isLoading.value = true;
  try {
    await Promise.all([fetchDetailsSerie(), fetchStatusUserSerie(), fetchRating(), fetchSimilarSeries(), fetchVideos()]);
  } catch (error) { console.error(error); } 
  finally { isLoading.value = false; }
};

onMounted(loadAllData);

watch(() => serieId.value, () => {
  if(!serieId.value) return;
  serieDetails.value = {}; serieCredits.value = {}; similarSeries.value = []; trailerKey.value = null;
  statusUserSerie.value = "UNDEFINED"; userRating.value = 0; userComment.value = "";
  selectedSeasonInfo.value = null; activeSeasonNumber.value = null;
  loadAllData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
</script>

<template>
  <div class="serie-page">
    <MediaSkeletonLoader v-if="isLoading" />

    <div v-else-if="serieDetails.name">
      <MediaBanner 
        :backdropPath="serieDetails.backdrop_path" 
        :posterPath="serieDetails.poster_path" 
        :title="serieDetails.name"
      >
        <div class="serie-header">
          <div class="d-flex align-center flex-wrap ga-2 mb-2">
            <v-chip color="grey-darken-3" variant="flat" size="small" class="text-white font-weight-bold">
              <v-icon start size="small" color="white">mdi-television-classic</v-icon>{{ $t('common.series') }}
            </v-chip>
            <v-chip v-if="serieStatus" color="#8C52FF" variant="flat" size="small" class="font-weight-bold">{{ serieStatus }}</v-chip>
          </div>

          <h1 class="text-h3 font-weight-bold">{{ serieDetails.name }}</h1>
          
          <p class="subtitle-info d-flex align-center flex-wrap mt-2">
            <span>{{ periodYears }}</span><span class="mx-2">•</span>
            <span>{{ allGenres }}</span><span class="mx-2">•</span>
            <span>{{ serieDetails.number_of_seasons }} {{ serieDetails.number_of_seasons > 1 ? $t('media.seasonsPlural') : $t('media.seasons') }}</span><span class="mx-2">•</span>
            <span>{{ serieDetails.number_of_episodes }} {{ $t('media.episodes') }}</span>
            <span v-if="serieDetails.runtimeFormatted" class="mx-2">•</span>
            <span v-if="serieDetails.runtimeFormatted">{{ serieDetails.runtimeFormatted }}</span>
          </p>

          <div class="d-flex align-center flex-wrap mt-3 ga-4">
            <div v-if="serieDetails.networks?.length" class="d-flex align-center ga-3">
              <span class="text-caption text-grey-lighten-2">{{ $t('media.showOn') }}</span>
              <div v-for="net in serieDetails.networks" :key="net.id" class="network-badge pa-1 bg-white rounded">
                <img v-if="net.logo_path" :src="`https://image.tmdb.org/t/p/w92${net.logo_path}`" :alt="net.name" :title="net.name" style="height: 20px; max-width: 100px; object-fit: contain; display: block;" />
                <span v-else class="text-caption text-black px-1 font-weight-bold">{{ net.name }}</span>
              </div>
            </div>
            
            <v-btn v-if="serieDetails.homepage" :href="serieDetails.homepage" target="_blank" variant="outlined" size="small" color="white" prepend-icon="mdi-open-in-new" rounded="xl">
              {{ $t('common.officialWebsite') }}
            </v-btn>
          </div>
        </div>

        <TmdbScore :voteAverage="serieDetails.vote_average" />

        <MediaActionButtons
          :statusUserMedia="statusUserSerie"
          :textButtonStatus="textButtonStatus"
          :itemsStatus="itemsStatus"
          :displayRating="displayRating"
          :showRatingButton="true"
          :trailerKey="trailerKey"
          @main-click="handleMainButtonClick"
          @update-status="updateStatus"
          @open-rating="checkAuth($t('media.authRateSeries')) ? (dialogNote = true) : null"
          @open-trailer="dialogTrailer = true"
        />

        <div class="synopsis-section">
          <p v-if="serieDetails.tagline" class="tagline mb-4 text-grey-lighten-1 italic"><i>{{ serieDetails.tagline }}</i></p>
          <h3 v-if="serieDetails.overview" class="text-h6 font-weight-bold mb-2">{{ $t('common.synopsis') }}</h3>
          <p v-if="serieDetails.overview" class="overview-text">{{ serieDetails.overview }}</p>
          
          <div v-if="serieDetails.created_by?.length" class="creator-info mt-6">
            <h3 class="text-h6 font-weight-bold mb-2">{{ serieDetails.created_by.length === 1 ? $t('media.creator') : $t('media.creators') }}</h3>
            <p class="text-body-2">{{ serieDetails.created_by.map(c => c.name).join(', ') }}</p>
          </div>
        </div>
      </MediaBanner>

      <EpisodeNextLast :lastEpisode="serieDetails.last_episode_to_air" :nextEpisode="serieDetails.next_episode_to_air" />
      
      <SeasonCarousel 
        :seasons="serieDetails.seasons" 
        :totalSeasons="serieDetails.number_of_seasons" 
        :activeSeasonNumber="activeSeasonNumber" 
        @select-season="fetchSeasonDetails" 
      />
      
      <SeasonEpisodesList 
        :seasonInfo="selectedSeasonInfo" 
        :loading="loadingSeason" 
        @close="selectedSeasonInfo = null; activeSeasonNumber = null" 
      />

      <CastCarousel :cast="serieCredits.cast" />
      <SimilarMediaCarousel :mediaList="similarSeries" mediaType="serie" />
    </div>
  </div>

  <ConfirmationDialog v-model="dialogConfirmation" :title="$t('media.deleteSeries')" :message="$t('media.deleteQuestionSeries')" :confirm-text="$t('common.delete')" :cancel-text="$t('common.cancel')" @confirm="confirmDelete" />
  <DateDialog v-model="dialogDate" :title="$t('media.finishedOn') + ' ?'" @confirm="handleDateConfirm" />
  <RatingDialog v-model="dialogNote" :title="$t('media.rateSeries')" :placeholder="$t('media.reviewSeries')" :initial-rating="userRating" :initial-comment="userComment" @save="saveRating" />
  <AuthDialog v-model="dialogAuth" :message="authMessage" />
  <TrailerDialog v-model="dialogTrailer" :videoKey="trailerKey" />
</template>

<style scoped>
.serie-page { background: white; min-height: 100vh; }
.subtitle-info { font-size: 0.95rem; color: #efefef; }
.overview-text { font-size: 0.95rem; line-height: 1.4; text-align: justify; }
.network-badge { display: inline-flex; align-items: center; justify-content: center; }
</style>
