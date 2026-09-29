<script setup>
import { ref, computed, onMounted, watch } from 'vue';
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
import StreamingProviders from '../components/StreamingProviders.vue';
import CastCarousel from '../components/CastCarousel.vue';
import SimilarMediaCarousel from '../components/SimilarMediaCarousel.vue';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const router = useRouter();
const route = useRoute();
const movieId = computed(() => route.params.id);

const isLoading = ref(true);
const movieDetails = ref({});
const movieCredits = ref({});
const directors = ref([]);
const similarMovies = ref([]);
const watchProviders = ref([]);
const trailerKey = ref(null);

const dialogTrailer = ref(false);
const dialogConfirmation = ref(false);
const dialogDate = ref(false);
const dialogNote = ref(false);
const dialogAuth = ref(false);
const authMessage = ref("");

const userRating = ref(0);
const userComment = ref("");
const statusFilm = ref("");
const statusUserMovie = ref("UNDEFINED");
const textVuAvecDate = ref("Vu");

const textButtonStatus = computed(() => ({
  "WATCHED": { text: textVuAvecDate.value, icon: "mdi-check-all" },
  "WATCHING": { text: "En cours de visionnage", icon: "mdi-play-circle-outline" },
  "TO_WATCH": { text: "À voir", icon: "mdi-clock-outline" },
  "UNDEFINED": { text: "Ajouter à ma liste", icon: "mdi-plus" }
}));

const allActions = [
  { id: 'TO_WATCH', text: 'À voir', icon: 'mdi-clock-outline' },
  { id: 'WATCHING', text: 'En cours', icon: 'mdi-play-circle-outline' },
  { id: 'WATCHED', text: 'Vu', icon: 'mdi-check-all' },
  { id: 'DATE', text: 'Changer la date', icon: 'mdi-calendar' },
  { id: 'DELETE', text: 'Supprimer de la liste', icon: 'mdi-delete', color: 'error' }
];

const itemsStatus = computed(() => {
  if (statusFilm.value !== "Released") {
    return allActions.filter(i => ['DELETE'].includes(i.id));
  }
  switch (statusUserMovie.value) {
    case 'TO_WATCH': return allActions.filter(i => ['WATCHING', 'WATCHED', 'DELETE'].includes(i.id));
    case 'WATCHING': return allActions.filter(i => ['TO_WATCH', 'WATCHED', 'DELETE'].includes(i.id));
    case 'WATCHED': return allActions.filter(i => ['TO_WATCH', 'WATCHING', 'DATE', 'DELETE'].includes(i.id));
    default: return [];
  }
});

const formatCurrency = (value) => {
  if (!value || value === 0) return null;
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(value);
};

const handleAuthError = (error) => {
  if (error.response && error.response.status === 403) {
    localStorage.removeItem('user_token');
    authMessage.value = "Votre session a expiré. Veuillez vous reconnecter.";
    dialogAuth.value = true;
    return true;
  }
  return false;
};

const fetchDetailsMovies = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/${movieId.value}`);
    movieDetails.value = response.data;
    statusFilm.value = movieDetails.value.status;

    if (movieDetails.value.release_date) {
      const [year, month, day] = movieDetails.value.release_date.split('-');
      movieDetails.value.release_date_formatted = `${day}/${month}/${year}`;
      movieDetails.value.release_year = year;
    }

    const creditsResponse = await axios.get(`${API_BASE_URL}/movies/${movieId.value}/credits`);
    movieCredits.value = creditsResponse.data;
    directors.value = movieCredits.value.crew.filter(member => member.job === 'Director');  

    const runtimeMinutes = movieDetails.value.runtime;
    if (typeof runtimeMinutes === 'number' && runtimeMinutes > 0) {
      const hours = Math.floor(runtimeMinutes / 60);
      const minutes = runtimeMinutes % 60;
      movieDetails.value.runtimeFormatted = `${hours}h ${minutes.toString().padStart(2, '0')}min`;
    } else {
      movieDetails.value.runtimeFormatted = "Durée inconnue";
    }
  } catch (error) { console.error('Error fetching movie details:', error); }
};

const fetchSimilarMovies = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/${movieId.value}/similar`);
    similarMovies.value = response.data.results.slice(0, 12);
  } catch (error) { console.error('Error fetching similar:', error); }
};

const fetchVideos = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/${movieId.value}/videos`);
    const trailer = response.data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) trailerKey.value = trailer.key;
  } catch (error) { console.error('Error fetching videos:', error); }
};

const fetchProviders = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/${movieId.value}/providers`);
    const frProviders = response.data.results?.FR;
    if (frProviders) {
      watchProviders.value = frProviders.flatrate || frProviders.rent || frProviders.buy || [];
    }
  } catch (error) { console.error('Error fetching providers:', error); }
};

const fetchStatusUserMovie = async () => {
  try {
    const token = localStorage.getItem('user_token');
    if (!token) return;

    const response = await axios.get(`${API_BASE_URL}/user/movies/status/${movieId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    statusUserMovie.value = response.data;
    
    if (statusUserMovie.value === "WATCHED") {
      const watchedResponse = await axios.get(`${API_BASE_URL}/user/movies/watched-date/${movieId.value}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (watchedResponse.data && !String(watchedResponse.data).startsWith("1970-01-01")) {
        const d = new Date(watchedResponse.data);
        const day = String(d.getDate()).padStart(2, '0');
        const month = String(d.getMonth() + 1).padStart(2, '0');
        textVuAvecDate.value = `Vu le ${day}/${month}/${d.getFullYear()}`;
      } else {
        textVuAvecDate.value = "Vu il y a longtemps";
      }
    }
  } catch (error) { handleAuthError(error); }
};

const fetchRating = async () => {
  try {
    const token = localStorage.getItem('user_token');
    if (!token) return;
    const [resRating, resComment] = await Promise.all([
      axios.get(`${API_BASE_URL}/user/movies/rating/${movieId.value}`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE_URL}/user/movies/comment/${movieId.value}`, { headers: { Authorization: `Bearer ${token}` } })
    ]);
    userComment.value = ['UNDEFINED', null, 'NO_COMMENT'].includes(resComment.data) ? "" : (resComment.data || "");
    userRating.value = resRating.data || 0;
  } catch (error) {
    handleAuthError(error);
    userRating.value = 0;
    userComment.value = "";
  }
};

const displayRating = computed(() => userRating.value > 0 ? `${userRating.value}/10` : 'Noter');

const checkAuth = (message) => {
  if (!localStorage.getItem('user_token')) {
    authMessage.value = message;
    dialogAuth.value = true;
    return false;
  }
  return true;
};

const handleMainButtonClick = () => {
  if (!checkAuth("Connectez-vous pour ajouter ce film à votre liste.")) return;
  if (statusUserMovie.value === "UNDEFINED") {
    axios.post(`${API_BASE_URL}/user/movies/to-watch/${movieId.value}`, {}, { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } })
      .then(() => statusUserMovie.value = "TO_WATCH").catch(handleAuthError);
  }
};

const updateStatus = async (newStatus) => {
  if (!checkAuth("Connectez-vous pour modifier le statut de ce film.")) return;
  if (newStatus === 'DELETE') return (dialogConfirmation.value = true);
  if (newStatus === 'DATE') return (dialogDate.value = true);
  
  try {
    const token = localStorage.getItem('user_token');
    let payload = { status: newStatus };
    if (newStatus === 'WATCHED') {
      const today = new Date();
      payload.watchedAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
      textVuAvecDate.value = `Vu le ${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
    }
    await axios.put(`${API_BASE_URL}/user/movies/status/${movieId.value}`, payload, { headers: { Authorization: `Bearer ${token}` } });
    statusUserMovie.value = newStatus;
  } catch (error) { handleAuthError(error); }
};

const confirmDelete = async () => {
  try {
    await axios.delete(`${API_BASE_URL}/user/movies/status/${movieId.value}`, { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } });
    statusUserMovie.value = "UNDEFINED";
    dialogConfirmation.value = false;
    userComment.value = "";
    userRating.value = 0;
  } catch (error) { handleAuthError(error); }
};

const handleDateConfirm = async (dateData) => {
  try {
    let formattedDate = "1970-01-01";
    let dateText = "Vu il y a longtemps";
    if (dateData !== 'long-time-ago') {
      formattedDate = `${dateData.getFullYear()}-${String(dateData.getMonth() + 1).padStart(2, '0')}-${String(dateData.getDate()).padStart(2, '0')}`;
      dateText = `Vu le ${String(dateData.getDate()).padStart(2, '0')}/${String(dateData.getMonth() + 1).padStart(2, '0')}/${dateData.getFullYear()}`;
    }
    await axios.put(`${API_BASE_URL}/user/movies/status/${movieId.value}`, { status: "WATCHED", watchedAt: formattedDate }, { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } });
    textVuAvecDate.value = dateText;
    statusUserMovie.value = "WATCHED";
  } catch (error) { handleAuthError(error); }
};

const saveRating = async ({ rating, comment }) => {
  try {
    userRating.value = rating;
    userComment.value = comment;
    await axios.put(`${API_BASE_URL}/user/movies/rate/${movieId.value}`, { rating, comment }, { headers: { Authorization: `Bearer ${localStorage.getItem('user_token')}` } });
    fetchStatusUserMovie();
  } catch (error) { handleAuthError(error); }
};

const allGenres = computed(() => Array.isArray(movieDetails.value.genres) ? movieDetails.value.genres.map(g => g.name).join(', ') : '');

const loadAllData = async () => {
  isLoading.value = true;
  try {
    await Promise.all([fetchDetailsMovies(), fetchStatusUserMovie(), fetchRating(), fetchSimilarMovies(), fetchVideos(), fetchProviders()]);
  } catch (error) { console.error("Erreur", error); } 
  finally { isLoading.value = false; }
};

onMounted(loadAllData);

watch(() => movieId.value, () => {
  if(!movieId.value) return;
  movieDetails.value = {}; movieCredits.value = {}; similarMovies.value = []; watchProviders.value = []; trailerKey.value = null;
  statusUserMovie.value = "UNDEFINED"; userRating.value = 0; userComment.value = "";
  loadAllData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
</script>

<template>
  <div class="movie-page">
    <MediaSkeletonLoader v-if="isLoading" />

    <div v-else-if="movieDetails.title">
      <MediaBanner 
        :backdropPath="movieDetails.backdrop_path" 
        :posterPath="movieDetails.poster_path" 
        :title="movieDetails.title"
      >
        <div class="movie-header">
          <div class="d-flex align-center flex-wrap ga-2 mb-2">
            <v-chip color="grey-darken-3" variant="flat" size="small" class="text-white font-weight-bold">
              <v-icon start size="small" color="white">mdi-movie-open</v-icon>Film
            </v-chip>
            <v-chip v-if="statusFilm === 'Released'" color="success" variant="flat" size="small" class="font-weight-bold">Sorti</v-chip>
            <v-chip v-else-if="statusFilm" color="#8C52FF" variant="flat" size="small" class="font-weight-bold">À venir</v-chip>
          </div>

          <h1 class="text-h3 font-weight-bold">{{ movieDetails.title }}</h1>
          
          <p class="subtitle-info d-flex align-center flex-wrap mt-2">
            <span>{{ movieDetails.release_year || 'Date inconnue' }}</span><span class="mx-2">•</span>
            <span>{{ movieDetails.release_date_formatted }}</span><span class="mx-2">•</span>
            <span>{{ allGenres }}</span><span class="mx-2">•</span>
            <span>{{ movieDetails.runtimeFormatted }}</span>
          </p>

          <div class="d-flex align-center flex-wrap mt-3 ga-4">
            <div v-if="movieDetails.budget || movieDetails.revenue" class="d-flex align-center flex-wrap ga-3 text-caption text-grey-lighten-2">
              <span v-if="movieDetails.budget">Budget : <strong class="text-white">{{ formatCurrency(movieDetails.budget) }}</strong></span>
              <span v-if="movieDetails.budget && movieDetails.revenue">|</span>
              <span v-if="movieDetails.revenue">Revenus : <strong class="text-white">{{ formatCurrency(movieDetails.revenue) }}</strong></span>
            </div>
            
            <v-btn v-if="movieDetails.homepage" :href="movieDetails.homepage" target="_blank" variant="outlined" size="small" color="white" prepend-icon="mdi-open-in-new" rounded="xl" class="ml-md-auto">
              Site officiel
            </v-btn>
          </div>

          <StreamingProviders :providers="watchProviders" />
        </div>

        <TmdbScore :voteAverage="movieDetails.vote_average" />

        <MediaActionButtons
          :statusUserMedia="statusUserMovie"
          :textButtonStatus="textButtonStatus"
          :itemsStatus="itemsStatus"
          :displayRating="displayRating"
          :showRatingButton="statusFilm === 'Released'"
          :trailerKey="trailerKey"
          @main-click="handleMainButtonClick"
          @update-status="updateStatus"
          @open-rating="checkAuth('Connectez-vous pour noter ce film.') ? (dialogNote = true) : null"
          @open-trailer="dialogTrailer = true"
        />

        <div class="synopsis-section">
          <p v-if="movieDetails.tagline" class="tagline mb-4 text-grey-lighten-1 italic"><i>{{ movieDetails.tagline}}</i></p>
          <h3 v-if="movieDetails.overview" class="text-h6 font-weight-bold mb-2">Synopsis</h3>
          <p v-if="movieDetails.overview" class="overview-text">{{ movieDetails.overview }}</p>
          
          <div v-if="directors.length > 0" class="director-info mt-6">
            <h3 class="text-h6 font-weight-bold mb-2">{{ directors.length === 1 ? 'Réalisateur' : 'Réalisateurs' }}</h3>
            <p class="text-body-2">{{ directors.map(d => d.name).join(', ') }}</p>
          </div>
        </div>
      </MediaBanner>

      <CastCarousel :cast="movieCredits.cast" />
      <SimilarMediaCarousel :mediaList="similarMovies" mediaType="movie" />
    </div>
  </div>

  <ConfirmationDialog v-model="dialogConfirmation" title="Supprimer le film de votre liste" message="Êtes-vous sûr de vouloir supprimer ce film ?" confirm-text="Supprimer" cancel-text="Annuler" @confirm="confirmDelete" />
  <DateDialog v-model="dialogDate" title="Quand avez-vous vu ce film ?" @confirm="handleDateConfirm" />
  <RatingDialog v-model="dialogNote" title="Noter ce film" :initial-rating="userRating" :initial-comment="userComment" @save="saveRating" />
  <AuthDialog v-model="dialogAuth" :message="authMessage" />
  <TrailerDialog v-model="dialogTrailer" :videoKey="trailerKey" />
</template>

<style scoped>
.movie-page { background: white; min-height: 100vh; }
.subtitle-info { font-size: 0.95rem; color: #efefef; }
.overview-text { font-size: 0.95rem; line-height: 1.4; text-align: justify; }
</style>