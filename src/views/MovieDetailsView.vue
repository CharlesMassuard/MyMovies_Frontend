<script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import axios  from 'axios';
  import ConfirmationDialog from '../components/ConfirmationDialog.vue';
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const router = useRouter();

  const route = useRoute();
  const movieId = computed(() => route.params.id);
  const movieDetails = ref({});
  const movieCredits = ref({});
  const directors = ref([]);
  
  const dialogConfirmation = ref(false);
  const dialogDate = ref(false);
  const dialogNote = ref(false);
  const selectedDate = ref(new Date());
  const dialogAuth = ref(false);
  const authMessage = ref("");

  const userRating = ref(0);
  const userComment = ref("");

  const editRating = ref(0);
  const editComment = ref("");

  const statusFilm = ref("");

  const changeDateViewed = () => {
    dialogDate.value = true;
  };

  const statusUserMovie = ref("UNDEFINED");

  const textVuAvecDate = ref("Vu")

  const textButtonStatus = computed(() => ({
    "WATCHED": { text: textVuAvecDate.value, icon: "mdi-check-all" },
    "WATCHING": { text: "En cours", icon: "mdi-play-circle-outline" },
    "TO_WATCH": { text: "À voir", icon: "mdi-clock-outline" },
    "UNDEFINED": { text: "Ajouter à ma liste de lecture", icon: "mdi-plus" }
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
  
  const fetchDetailsMovies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/movies/${movieId.value}`);
      movieDetails.value = response.data;

      statusFilm.value = movieDetails.value.status;

      if (movieDetails.value.release_date) {
        const [year, month, day] = movieDetails.value.release_date.split('-');
        movieDetails.value.release_date = `${day}/${month}/${year}`;
      }

      const creditsResponse = await axios.get(`${API_BASE_URL}/movies/${movieId.value}/credits`);
      movieCredits.value = creditsResponse.data;
      directors.value = movieCredits.value.crew.filter(member => member.job === 'Director');  

      const runtimeMinutes = movieDetails.value.runtime;
      if (typeof runtimeMinutes === 'number') {
        const hours = Math.floor(runtimeMinutes / 60);
        const minutes = runtimeMinutes % 60;
        movieDetails.value.runtimeFormatted = `${hours}h ${minutes.toString().padStart(2, '0')}min`;
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
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
        const watchedDate = new Date(watchedResponse.data);
        const day = String(watchedDate.getDate()).padStart(2, '0');
        const month = String(watchedDate.getMonth() + 1).padStart(2, '0');
        const year = watchedDate.getFullYear();
        textVuAvecDate.value = `Vu le ${day}/${month}/${year}`;
      }
    } catch (error) {
      console.error('Error fetching status:', error);
    }
  };

  const fetchRating = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/user/movies/rating/${movieId.value}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const responseComment = await axios.get(`${API_BASE_URL}/user/movies/comment/${movieId.value}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      userComment.value = responseComment.data || "";
      if(userComment.value === "UNDEFINED" || userComment.value === null || userComment.value === "NO_COMMENT") {
        userComment.value = "";
      }
      userRating.value = response.data || 0;
    } catch (error) {
      console.error('Error fetching rating:', error);
      userRating.value = 0;
      userComment.value = "";
    }
  };

  const displayRating = computed(() => {
    return userRating.value > 0 ? `${userRating.value}/10` : 'Noter';
  });

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
      if (error.response && error.response.status === 403) {
        dialogAuth.value = true;
      }
      console.error('Erreur lors de l\'ajout :', error);
    }
  };

  const updateStatus = async (newStatus) => {
    if (!checkAuth("Connectez-vous pour modifier le statut de ce film.")) return;

    if (newStatus === 'DELETE') {
      dialogConfirmation.value = true;
      return;
    }

    if(newStatus === 'DATE') {
      changeDateViewed();
      return;
    }
    
    try {
      const token = localStorage.getItem('user_token');
      await axios.put(`${API_BASE_URL}/user/movies/status/${movieId.value}`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      statusUserMovie.value = newStatus;
    } catch (error) {
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
      console.error('Erreur lors de la suppression :', error);
    }
  };

  const confirmDateChange = async () => {
    try {
      const token = localStorage.getItem('user_token');
      
      const year = selectedDate.value.getFullYear();
      const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.value.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`; 
      
      await axios.put(`${API_BASE_URL}/user/movies/status/${movieId.value}`, 
        { 
          status: "WATCHED",
          watchedAt: formattedDate 
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      textVuAvecDate.value = `Vu le ${day}/${month}/${year}`;
      statusUserMovie.value = "WATCHED";
      
      dialogDate.value = false;
    } catch (error) {
      console.error('Erreur lors du changement de date :', error);
    }
  };

  const saveRating = async () => {
    if (!checkAuth("Connectez-vous pour noter ce film.")) return;
    try {
      if(editRating.value < 1 || editRating.value > 10) {
        return;
      }
      if(editComment.value.length > 500) {
        alert('Le commentaire ne doit pas dépasser 500 caractères.');
        return;
      }

      userRating.value = editRating.value;
      userComment.value = editComment.value;
      const token = localStorage.getItem('user_token');
      await axios.put(`${API_BASE_URL}/user/movies/rate/${movieId.value}`, 
        { 
          rating: userRating.value,
          comment: userComment.value
        }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStatusUserMovie();
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la note :', error);
    }
    dialogNote.value = false; //fermeture du dialog
  };

  const checkAuth = (message) => {
    if (!localStorage.getItem('user_token')) {
      authMessage.value = message;
      dialogAuth.value = true;
      return false;
    }
    return true;
  };

  const openDialogNote = () => {
    if (!checkAuth("Connectez-vous pour noter ce film.")) return;
    dialogNote.value = true;
  }

  onMounted(() => {
    fetchDetailsMovies();
    fetchStatusUserMovie();
    fetchRating();
  });

  watch(dialogNote, (isOpen) => {
    if (isOpen) {
      if(userRating.value === 0 || userRating.value === -1) {
        editRating.value = 5;
      } else {
        editRating.value = userRating.value;
      }
      editComment.value = userComment.value;
    }
  });

  watch(() => movieId.value, () => {
    movieDetails.value = {};
    movieCredits.value = {};
    statusUserMovie.value = "UNDEFINED";
    // On réinitialise la note et le commentaire pour le nouveau film
    userRating.value = 0;
    userComment.value = "";
    
    fetchDetailsMovies();
    fetchStatusUserMovie();
    fetchRating(); // Ne pas oublier de le relancer ici aussi
  });

  const allGenres = computed(() => {
    const genres = movieDetails.value.genres;
    return Array.isArray(genres) ? genres.map(g => g.name).join(', ') : '';
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
              :src="`https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`"
              :alt="movieDetails.title"
              class="poster-img elevation-10"
              cover
            ></v-img>
          </v-col>

          <v-col cols="12" md="9" class="text-white px-md-10">
            <div class="movie-header">
              <h1 class="text-h3 font-weight-bold">{{ movieDetails.title }}</h1>
              <p class="subtitle-info d-flex align-center flex-wrap mt-2">
                <span v-if="statusFilm === 'Released'">{{ movieDetails.release_date }}</span>
                <span v-else>{{ movieDetails.release_date }} (Non sorti)</span>
                <span class="mx-2">•</span>
                <span>{{ allGenres }}</span>
                <span class="mx-2">•</span>
                <span>{{ movieDetails.runtimeFormatted }}</span>
              </p>
            </div>

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

            <div class="actions-row mb-8 d-flex align-center">
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
                        :icon="$vuetify.display.smAndDown"
                        width="350"
                        @click="handleMainButtonClick"
                    >
                        <v-icon :start="!$vuetify.display.smAndDown">{{ textButtonStatus[statusUserMovie].icon }}</v-icon>
                        <span v-if="!$vuetify.display.smAndDown">{{ textButtonStatus[statusUserMovie].text }}</span>
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
                :icon="$vuetify.display.smAndDown"
                class="ml-5"
                @click="openDialogNote()"
                v-if="statusFilm === 'Released'"
              >
                <v-icon :start="!$vuetify.display.smAndDown">mdi-star</v-icon>
                <span>{{ displayRating }}</span>
              </v-btn>
            </div>

            <div class="synopsis-section">
              <p v-if="movieDetails.tagline" class="tagline mb-4 text-grey-lighten-1 italic"><i>{{ movieDetails.tagline}}</i></p>
              <h3 v-if="movieDetails.overview" class="text-h6 font-weight-bold mb-2">Synopsis</h3>
              <p v-if="movieDetails.overview" class="overview-text">{{ movieDetails.overview }}</p>
              
              <div v-if="directors.length > 0" class="director-info mt-8">
                <h3 class="text-h6 font-weight-bold mb-2">{{ directors.length === 1 ? 'Réalisateur' : 'Réalisateurs' }}</h3>
                <div v-for="director in directors" :key="director.id">
                  <p class="text-body-2">{{ director.name }}</p>
                </div>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <v-container class="mt-10">
      <h3 class="text-h5 font-weight-bold mb-6">Têtes d'affiche</h3>
      <v-row class="flex-nowrap overflow-x-auto pb-4">
        <v-col v-for="actor in movieCredits.cast" :key="actor.id" cols="6" sm="4" md="2" class="flex-shrink-0">
          <v-card class="rounded-lg overflow-hidden elevation-2" height="100%">
            <v-img 
              :src="`https://image.tmdb.org/t/p/w200${actor.profile_path}`" 
              height="200" 
              cover
              class="bg-grey-lighten-2"
            ></v-img>
            <v-card-text class="pa-2">
              <p class="font-weight-bold mb-0 text-truncate text-body-2">{{ actor.name }}</p>
              <p class="text-caption text-grey-darken-1 text-truncate">{{ actor.character }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>

  <ConfirmationDialog
    v-model="dialogConfirmation"
    title="Supprimer le film de votre liste"
    message="Êtes-vous sûr de vouloir supprimer ce film de votre liste ?"
    confirm-text="Supprimer"
    cancel-text="Annuler"
    @confirm="confirmDelete"
  ></ConfirmationDialog>

  <v-dialog v-model="dialogDate" width="auto">
    <v-card title="Quand avez-vous vu ce film ?">
      <v-card-text class="pa-0">
        <v-date-picker v-model="selectedDate" color="#8C52FF" hide-header show-adjacent-months control-variant="modal" :max="new Date()"></v-date-picker>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text="Annuler" variant="text" @click="dialogDate = false"></v-btn>
        <v-btn color="#8C52FF" variant="flat" text="Confirmer" @click="confirmDateChange"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <v-dialog v-model="dialogNote" width="450px">
    <v-card class="pa-4 rounded-xl relative">
      <div class="d-flex align-center justify-center mb-4">
        <v-card-title class="pa-0 font-weight-bold">Noter ce film</v-card-title>
        <v-btn
          icon="mdi-close"
          variant="text"
          density="comfortable"
          position="absolute"
          style="right: 16px; top: 16px"
          @click="dialogNote = false"
        ></v-btn>
      </div>

      <v-textarea
        v-model="editComment"
        placeholder="Écrivez ce que vous voulez retenir..."
        variant="outlined"
        rounded="lg"
        auto-grow
        rows="4"
        class="mb-6 comment-area"
        hide-details
      ></v-textarea>

      <div class="d-flex justify-space-between mb-8 px-1">
        <v-slide-group
          v-model="editRating"
          class="pa-0 mb-8"
          selected-class="selected-rating"
          mandatory
          center-active
        >
        <v-slide-group-item
          v-for="n in 10"
          :key="n"
          :value="n"
          v-slot="{ isSelected, toggle }"
        >
          <v-card
            :color="isSelected ? '#8C52FF' : 'white'"
            :class="[
              'ma-2 d-flex align-center justify-center rating-card elevation-2',
              isSelected ? 'text-white' : 'text-grey-darken-3'
            ]"
            height="40"
            width="40"
            rounded="lg"
            @click="toggle"
          >
            <span class="text-h6 font-weight-bold">{{ n }}</span>
          </v-card>
        </v-slide-group-item>
      </v-slide-group>
      </div>

      <v-btn
        block
        color="#6236FF"
        size="large"
        rounded="xl"
        class="text-none font-weight-bold text-white elevation-0"
        @click="saveRating"
      >
        Sauvegarder
      </v-btn>
    </v-card>
  </v-dialog>
  <v-dialog v-model="dialogAuth" width="400">
    <v-card class="rounded-xl pa-4">
      <div class="text-center">
        <v-icon color="#8C52FF" size="64" class="mb-4">mdi-account-lock</v-icon>
        <v-card-title class="text-h5 font-weight-bold justify-center">Authentification requise</v-card-title>
      </div>
      
      <v-card-text class="text-center text-body-1 text-grey-darken-1">
        {{ authMessage || "Vous devez être connecté pour effectuer cette action." }}
      </v-card-text>

      <v-card-actions class="flex-column ga-2 mt-4">
        <v-btn
          block
          color="#8C52FF"
          size="large"
          rounded="xl"
          variant="flat"
          @click="router.push({path: '/login', query: { redirect: $route.fullPath } })"
        >
          Se connecter
        </v-btn>
        
        <v-btn
          block
          variant="text"
          rounded="xl"
          @click="dialogAuth = false"
        >
          Plus tard
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
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

.period-select :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

.comment-area :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

.rating-box {
  width: 42px !important;
  height: 42px !important;
  border-radius: 12px !important;
  border: 1px solid #e0e0e0 !important;
  background-color: white !important;
  transition: all 0.2s ease;
}

.selected-rating {
  background-color: #8C52FF !important;
  border-color: #8C52FF !important;
}

@media (max-width: 960px) {
  .backdrop-image::after {
    background-image: linear-gradient(to bottom, rgba(10, 20, 40, 0.9), rgba(10, 20, 40, 1));
  }
}
</style>