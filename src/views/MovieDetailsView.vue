<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import ConfirmationDialog from '../components/ConfirmationDialog.vue';
import AuthDialog from '../components/AuthDialog.vue';
import DateDialog from '../components/DateDialog.vue';
import RatingDialog from '../components/RatingDialog.vue';
import TrailerDialog from '../components/TrailerDialog.vue';
import noPoster from '../assets/noPosterAvailable.webp';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const router = useRouter();
const route = useRoute();
const movieId = computed(() => route.params.id);
const movieDetails = ref({});
const movieCredits = ref({});
const directors = ref([]);

//Nouvelles-variables-pour-les-fonctionnalités
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

const changeDateViewed = () => {
  dialogDate.value = true;
};

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
  if(statusFilm.value !== "Released") {
    return allActions.filter(i => ['DELETE'].includes(i.id));
  }
  switch (statusUserMovie.value) {
    case 'TO_WATCH':
      return allActions.filter(i => ['WATCHING', 'WATCHED', 'DELETE'].includes(i.id));
    case 'WATCHING':
      return allActions.filter(i => ['TO_WATCH', 'WATCHED', 'DELETE'].includes(i.id));
    case 'WATCHED':
      return allActions.filter(i => ['TO_WATCH', 'WATCHING', 'DATE', 'DELETE'].includes(i.id));
    default:
      return [];
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
  } catch (error) {
    console.error('Error fetching movie details:', error);
  }
};

//Récupération-des-films-similaires
const fetchSimilarMovies = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/${movieId.value}/similar`);
    similarMovies.value = response.data.results.slice(0, 12);
  } catch (error) {
    console.error('Error fetching similar movies:', error);
  }
};

//Récupération-de-la-bande-annonce
const fetchVideos = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/${movieId.value}/videos`);
    //On-cherche-un-trailer-officiel-sur-YouTube
    const trailer = response.data.results.find(v => v.type === 'Trailer' && v.site === 'YouTube');
    if (trailer) trailerKey.value = trailer.key;
  } catch (error) {
    console.error('Error fetching videos:', error);
  }
};

//Récupération-des-plateformes-de-streaming-(focus-sur-la-France)
const fetchProviders = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/movies/${movieId.value}/providers`);
    //FR-pour-la-France,-on-privilégie-le-streaming-gratuit/inclus-(flatrate)
    const frProviders = response.data.results?.FR;
    if (frProviders) {
      watchProviders.value = frProviders.flatrate || frProviders.rent || frProviders.buy || [];
    }
  } catch (error) {
    console.error('Error fetching providers:', error);
  }
};

const fetchStatusUserMovie = async () => {
  try {
    const token = localStorage.getItem('user_token');
    if (!token) return;

    const response = await axios.get(`${API_BASE_URL}/user/movies/status/${movieId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    statusUserMovie.value = response.data;
    
    if(statusUserMovie.value === "WATCHED") {
      const watchedResponse = await axios.get(`${API_BASE_URL}/user/movies/watched-date/${movieId.value}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (watchedResponse.data && !String(watchedResponse.data).startsWith("1970-01-01")) {
        const watchedDate = new Date(watchedResponse.data);
        const day = String(watchedDate.getDate()).padStart(2, '0');
        const month = String(watchedDate.getMonth() + 1).padStart(2, '0');
        const year = watchedDate.getFullYear();
        textVuAvecDate.value = `Vu le ${day}/${month}/${year}`;
      } else {
        textVuAvecDate.value = "Vu il y a longtemps";
      }
    }
  } catch (error) {
    handleAuthError(error);
    console.error('Error fetching status:', error);
  }
};

const fetchRating = async () => {
  try {
    const token = localStorage.getItem('user_token');
    if (!token) return;

    const [resRating, resComment] = await Promise.all([
      axios.get(`${API_BASE_URL}/user/movies/rating/${movieId.value}`, { headers: { Authorization: `Bearer ${token}` } }),
      axios.get(`${API_BASE_URL}/user/movies/comment/${movieId.value}`, { headers: { Authorization: `Bearer ${token}` } })
    ]);

    userComment.value = resComment.data || "";
    if(['UNDEFINED', null, 'NO_COMMENT'].includes(userComment.value)) {
      userComment.value = "";
    }
    userRating.value = resRating.data || 0;
  } catch (error) {
    handleAuthError(error);
    console.error('Error fetching rating:', error);
    userRating.value = 0;
    userComment.value = "";
  }
};

const displayRating = computed(() => {
  return userRating.value > 0 ? `${userRating.value}/10` : 'Noter';
});

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
    addFilmToWatchlist(movieId.value);
  }
};

const addFilmToWatchlist = async (id) => {
  try {
    const token = localStorage.getItem('user_token');
    await axios.post(`${API_BASE_URL}/user/movies/to-watch/${id}`, {}, {
      headers: { Authorization: `Bearer ${token}` }
    });
    statusUserMovie.value = "TO_WATCH";
  } catch (error) {
    handleAuthError(error);
    console.error('Erreur lors de l\'ajout :', error);
  }
};

const updateStatus = async (newStatus) => {
  if (!checkAuth("Connectez-vous pour modifier le statut de ce film.")) return;

  if (newStatus === 'DELETE') {
    dialogConfirmation.value = true;
    return;
  }
  if (newStatus === 'DATE') {
    changeDateViewed();
    return;
  }
  
  try {
    const token = localStorage.getItem('user_token');
    let payload = { status: newStatus };

    if (newStatus === 'WATCHED') {
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      
      payload.watchedAt = `${year}-${month}-${day}`;
      textVuAvecDate.value = `Vu le ${day}/${month}/${year}`;
    }

    await axios.put(`${API_BASE_URL}/user/movies/status/${movieId.value}`, 
      payload, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    statusUserMovie.value = newStatus;
  } catch (error) {
    handleAuthError(error);
    console.error('Erreur lors de la mise à jour du statut :', error);
  }
};

const confirmDelete = async () => {
  try {
    const token = localStorage.getItem('user_token');
    await axios.delete(`${API_BASE_URL}/user/movies/status/${movieId.value}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    statusUserMovie.value = "UNDEFINED";
    dialogConfirmation.value = false;
    userComment.value = "";
    userRating.value = 0;
  } catch (error) {
    handleAuthError(error);
    console.error('Erreur lors de la suppression :', error);
  }
};

const handleDateConfirm = async (dateData) => {
  try {
    const token = localStorage.getItem('user_token');
    let formattedDate = "1970-01-01";
    let dateText = "Vu il y a longtemps";

    if (dateData !== 'long-time-ago') {
      const year = dateData.getFullYear();
      const month = String(dateData.getMonth() + 1).padStart(2, '0');
      const day = String(dateData.getDate()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}`;
      dateText = `Vu le ${day}/${month}/${year}`;
    }
    
    await axios.put(`${API_BASE_URL}/user/movies/status/${movieId.value}`, 
      { status: "WATCHED", watchedAt: formattedDate }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    
    textVuAvecDate.value = dateText;
    statusUserMovie.value = "WATCHED";
  } catch (error) {
    handleAuthError(error);
    console.error('Erreur lors du changement de date :', error);
  }
};

const saveRating = async ({ rating, comment }) => {
  try {
    const token = localStorage.getItem('user_token');
    userRating.value = rating;
    userComment.value = comment;
    await axios.put(`${API_BASE_URL}/user/movies/rate/${movieId.value}`, 
      { rating: userRating.value, comment: userComment.value }, 
      { headers: { Authorization: `Bearer ${token}` } }
    );
    fetchStatusUserMovie();
  } catch (error) {
    handleAuthError(error);
    console.error('Erreur lors de la sauvegarde de la note :', error);
  }
};

const openDialogNote = () => {
  if (!checkAuth("Connectez-vous pour noter ce film.")) return;
  dialogNote.value = true;
};

const allGenres = computed(() => {
  const genres = movieDetails.value.genres;
  return Array.isArray(genres) ? genres.map(g => g.name).join(', ') : '';
});

//Fonction-pour-naviguer-vers-un-film-similaire
const goToMovie = (id) => {
  router.push(`/movie/${id}`);
};

onMounted(() => {
  fetchDetailsMovies();
  fetchStatusUserMovie();
  fetchRating();
  fetchSimilarMovies();
  fetchVideos();
  fetchProviders();
});

//Gestion-du-changement-de-film-(ex:-clic-sur-un-film-similaire)
watch(() => movieId.value, () => {
  movieDetails.value = {};
  movieCredits.value = {};
  similarMovies.value = [];
  watchProviders.value = [];
  trailerKey.value = null;
  statusUserMovie.value = "UNDEFINED";
  userRating.value = 0;
  userComment.value = "";
  
  fetchDetailsMovies();
  fetchStatusUserMovie();
  fetchRating();
  fetchSimilarMovies();
  fetchVideos();
  fetchProviders();
  
  //Scroll-en-haut-de-page
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
</script>

<template>
  <div v-if="movieDetails.title" class="movie-page">
    <div class="banner-wrapper">
      <div 
        class="backdrop-image" 
        :style="{ backgroundImage: `url(https://image.tmdb.org/t/p/original${movieDetails.backdrop_path})` }"
      ></div>
      
      <v-container class="content-overlay py-10">
        <v-row align="center">
          <v-col cols="12" md="3" class="d-flex justify-center">
            <v-img
              :src="movieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${movieDetails.poster_path}` : noPoster"
              :alt="movieDetails.title"
              class="poster-img elevation-10"
              cover
            ></v-img>
          </v-col>

          <v-col cols="12" md="9" class="text-white px-md-10">
            <div class="movie-header">
              <!--Badges-de-statut-et-type-->
              <div class="d-flex align-center flex-wrap ga-2 mb-2">
                <v-chip color="grey-darken-3" variant="flat" size="small" class="text-white font-weight-bold">
                  <v-icon start size="small" color="white">mdi-movie-open</v-icon>
                  Film
                </v-chip>
                <v-chip v-if="statusFilm === 'Released'" color="success" variant="flat" size="small" class="font-weight-bold">
                  Sorti
                </v-chip>
                <v-chip v-else-if="statusFilm" color="#8C52FF" variant="flat" size="small" class="font-weight-bold">
                  À venir
                </v-chip>
              </div>

              <h1 class="text-h3 font-weight-bold">{{ movieDetails.title }}</h1>
              
              <p class="subtitle-info d-flex align-center flex-wrap mt-2">
                <span>{{ movieDetails.release_year || 'Date inconnue' }}</span>
                <span class="mx-2">•</span>
                <span>{{ movieDetails.release_date_formatted }}</span>
                <span class="mx-2">•</span>
                <span>{{ allGenres }}</span>
                <span class="mx-2">•</span>
                <span>{{ movieDetails.runtimeFormatted }}</span>
              </p>

              <!--Informations-Box-Office-et-Bouton-site-web-->
              <div class="d-flex align-center flex-wrap mt-3 ga-4">
                <div v-if="movieDetails.budget || movieDetails.revenue" class="d-flex align-center flex-wrap ga-3 text-caption text-grey-lighten-2">
                  <span v-if="movieDetails.budget">Budget : <strong class="text-white">{{ formatCurrency(movieDetails.budget) }}</strong></span>
                  <span v-if="movieDetails.budget && movieDetails.revenue">|</span>
                  <span v-if="movieDetails.revenue">Revenus : <strong class="text-white">{{ formatCurrency(movieDetails.revenue) }}</strong></span>
                </div>
                
                <v-btn 
                  v-if="movieDetails.homepage"
                  :href="movieDetails.homepage"
                  target="_blank"
                  variant="outlined"
                  size="small"
                  color="white"
                  prepend-icon="mdi-open-in-new"
                  rounded="xl"
                  class="ml-md-auto"
                >
                  Site officiel
                </v-btn>
              </div>

              <!--Plateformes-de-streaming-(Providers)-->
              <div v-if="watchProviders.length > 0" class="d-flex align-center flex-wrap mt-4 ga-3">
                <span class="text-caption text-grey-lighten-2">Disponible en streaming :</span>
                <div 
                  v-for="provider in watchProviders" 
                  :key="provider.provider_id" 
                  class="rounded overflow-hidden elevation-2 d-flex"
                >
                  <img 
                    :src="`https://image.tmdb.org/t/p/w92${provider.logo_path}`" 
                    :alt="provider.provider_name"
                    :title="provider.provider_name"
                    style="height: 35px; width: 35px; object-fit: cover;" 
                  />
                </div>
              </div>

            </div>

            <!--Score-TMDB-->
            <div class="score-section my-6 d-flex align-center">
              <v-progress-circular
                :model-value="movieDetails.vote_average * 10"
                color="green-accent-3"
                size="60"
                width="6"
                class="bg-black rounded-circle"
              >
                <span class="font-weight-bold text-caption">{{ Math.round(movieDetails.vote_average * 10) }}%</span>
              </v-progress-circular>
              <span class="ml-3 font-weight-bold leading-tight">Score d'évaluation<br>TMDB</span>
            </div>

            <!--Actions-Utilisateur-->
            <div class="actions-row mb-8 d-flex flex-wrap align-center ga-3">
              <v-menu 
                :close-on-content-click="true" 
                location="bottom center"
                offset="10"
                :disabled="statusUserMovie === 'UNDEFINED'"
              >
                <template v-slot:activator="{ props }">
                    <v-btn 
                        rounded="xl" 
                        color="#8C52FF" 
                        variant="flat"
                        v-bind="props"
                        class="action-btn flex-grow-1 flex-md-grow-0"
                        min-width="250"
                        @click="handleMainButtonClick"
                    >
                        <v-icon start>{{ textButtonStatus[statusUserMovie].icon }}</v-icon>
                        <span class="font-weight-bold">{{ textButtonStatus[statusUserMovie].text }}</span>
                    </v-btn>
                </template>

                <v-list class="pa-2" width="350" elevation="12" rounded="lg">
                    <v-list-item
                        v-for="(item, index) in itemsStatus"
                        :key="index"
                        rounded="md"
                        class="mb-1"
                        @click="updateStatus(item.id)"
                    >
                        <template v-slot:prepend>
                            <v-icon size="small" :icon="item.icon" :color="item.color"></v-icon>
                        </template>
                        <v-list-item-title class="text-body-2 font-weight-medium" :class="item.color ? `text-${item.color}` : ''">
                          {{ item.text }}
                        </v-list-item-title>
                    </v-list-item>
                </v-list>
              </v-menu>
              
              <v-btn 
                rounded="xl" 
                color="white" 
                variant="flat"
                class="action-btn px-6"
                @click="openDialogNote()"
                v-if="statusFilm === 'Released'"
              >
                <v-icon start color="amber">mdi-star</v-icon>
                <span class="text-black font-weight-bold">{{ displayRating }}</span>
              </v-btn>

              <!--Bouton-Bande-Annonce-->
              <v-btn
                v-if="trailerKey"
                rounded="xl"
                variant="outlined"
                color="white"
                class="action-btn px-6"
                @click="dialogTrailer = true"
              >
                <v-icon start>mdi-play</v-icon>
                <span class="font-weight-bold">Bande-annonce</span>
              </v-btn>
            </div>

            <!--Synopsis-et-Équipe-->
            <div class="synopsis-section">
              <p v-if="movieDetails.tagline" class="tagline mb-4 text-grey-lighten-1 italic"><i>{{ movieDetails.tagline}}</i></p>
              <h3 v-if="movieDetails.overview" class="text-h6 font-weight-bold mb-2">Synopsis</h3>
              <p v-if="movieDetails.overview" class="overview-text">{{ movieDetails.overview }}</p>
              
              <div v-if="directors.length > 0" class="director-info mt-6">
                <h3 class="text-h6 font-weight-bold mb-2">{{ directors.length === 1 ? 'Réalisateur' : 'Réalisateurs' }}</h3>
                <p class="text-body-2">{{ directors.map(d => d.name).join(', ') }}</p>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!--Têtes-d'affiche-->
    <v-container class="mt-10 mb-6" v-if="movieCredits.cast?.length">
      <h3 class="text-h5 font-weight-bold mb-6">Têtes d'affiche</h3>
      <v-row class="flex-nowrap overflow-x-auto pb-4">
        <v-col v-for="actor in movieCredits.cast" :key="actor.id" cols="6" sm="4" md="2" class="flex-shrink-0">
          <v-card class="rounded-lg overflow-hidden elevation-2 h-100">
            <v-img 
              :src="actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : noPoster" 
              height="200" 
              cover
              class="bg-grey-lighten-2"
            ></v-img>
            <v-card-text class="pa-2">
              <p class="font-weight-bold mb-0 text-truncate text-body-2" :title="actor.name">{{ actor.name }}</p>
              <p class="text-caption text-grey-darken-1 text-truncate" :title="actor.character">{{ actor.character }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!--Films-Similaires-->
    <v-container class="mb-10" v-if="similarMovies.length">
      <h3 class="text-h5 font-weight-bold mb-6">Les spectateurs ont aussi aimé</h3>
      <v-row class="flex-nowrap overflow-x-auto pb-4">
        <v-col v-for="similar in similarMovies" :key="similar.id" cols="6" sm="4" md="3" lg="2" class="flex-shrink-0">
          <v-card 
            class="rounded-lg overflow-hidden elevation-2 h-100 similar-card"
            @click="goToMovie(similar.id)"
          >
            <v-img 
              :src="similar.poster_path ? `https://image.tmdb.org/t/p/w300${similar.poster_path}` : noPoster" 
              height="220" 
              cover
              class="bg-grey-lighten-2"
            ></v-img>
            <v-card-text class="pa-2">
              <p class="font-weight-bold mb-0 text-truncate text-body-2" :title="similar.title">{{ similar.title }}</p>
              <div class="d-flex align-center mt-1" v-if="similar.vote_average">
                <v-icon color="amber" size="small" class="mr-1">mdi-star</v-icon>
                <span class="text-caption font-weight-medium">{{ Math.round(similar.vote_average * 10) / 10 }}</span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>

  <!--Composants-modales-réutilisables-->
  <ConfirmationDialog
    v-model="dialogConfirmation"
    title="Supprimer le film de votre liste"
    message="Êtes-vous sûr de vouloir supprimer ce film de votre liste ?"
    confirm-text="Supprimer"
    cancel-text="Annuler"
    @confirm="confirmDelete"
  />

  <DateDialog
    v-model="dialogDate"
    title="Quand avez-vous vu ce film ?"
    @confirm="handleDateConfirm"
  />

  <RatingDialog
    v-model="dialogNote"
    title="Noter ce film"
    :initial-rating="userRating"
    :initial-comment="userComment"
    @save="saveRating"
  />
  
  <AuthDialog
    v-model="dialogAuth"
    :message="authMessage"
  />

  <TrailerDialog
    v-model="dialogTrailer"
    :videoKey="trailerKey"
  />
</template>

<style scoped>
.movie-page {
  background: white;
  min-height: 100vh;
}
.banner-wrapper {
  position: relative;
  width: 100%;
  min-height: 510px;
  background-color: #032541;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.backdrop-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: right 20% center;
  z-index: 0;
}
.backdrop-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to right, rgb(42, 24, 78) 150px, rgba(42, 24, 78, 0.84) 100%);
}
.content-overlay {
  position: relative;
  z-index: 1;
}
.poster-img {
  border-radius: 12px;
  width: 300px;
  height: 450px;
}
.subtitle-info {
  font-size: 0.95rem;
  color: #efefef;
}
.leading-tight {
  line-height: 1.2;
}
.overview-text {
  font-size: 0.95rem;
  line-height: 1.4;
  text-align: justify;
}
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #dbdbdb transparent;
}
.action-btn {
  height: 44px !important;
}
/*Effet-de-survol-pour-les-cartes-similaires*/
.similar-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.similar-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0,0,0,0.15) !important;
}
@media (max-width: 960px) {
  .backdrop-image::after {
    background-image: linear-gradient(to bottom, rgba(10, 20, 40, 0.9), rgba(10, 20, 40, 1));
  }
}
</style>