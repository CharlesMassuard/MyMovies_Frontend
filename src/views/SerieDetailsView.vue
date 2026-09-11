<script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute, useRouter } from 'vue-router';
  import axios from 'axios';
  import ConfirmationDialog from '../components/ConfirmationDialog.vue';
  import noPoster from '../assets/noPosterAvailable.webp';
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const router = useRouter();
  const route = useRoute();

  const serieId = computed(() => route.params.id);
  const serieDetails = ref({});
  const serieCredits = ref({});
  
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

  const statusUserSerie = ref("UNDEFINED");
  const textVuAvecDate = ref("Vu");

  // Gestion des saisons et épisodes
  const selectedSeasonInfo = ref(null);
  const loadingSeason = ref(false);
  const activeSeasonNumber = ref(null);

  const textButtonStatus = computed(() => ({
    "WATCHED": { text: textVuAvecDate.value, icon: "mdi-check-all" },
    "WATCHING": { text: "En cours de visionnage", icon: "mdi-play-circle-outline" },
    "TO_WATCH": { text: "À voir", icon: "mdi-clock-outline" },
    "UNDEFINED": { text: "Ajouter à mes séries", icon: "mdi-plus" }
  }));

  const allActions = [
    { id: 'TO_WATCH', text: 'À voir', icon: 'mdi-clock-outline' },
    { id: 'WATCHING', text: 'En cours', icon: 'mdi-play-circle-outline' },
    { id: 'WATCHED', text: 'Terminée / Vue', icon: 'mdi-check-all' },
    { id: 'DATE', text: 'Changer la date de fin', icon: 'mdi-calendar' },
    { id: 'DELETE', text: 'Supprimer de la liste', icon: 'mdi-delete', color: 'error' }
  ];

  const itemsStatus = computed(() => {
    switch (statusUserSerie.value) {
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

  // Fonction utilitaire pour formater les dates
  const formatDate = (dateString) => {
    if (!dateString) return 'Date inconnue';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Formate les numéros d'épisodes type S01E03
  const formatEpisodeNumber = (season, episode) => {
    if (season === undefined || episode === undefined) return '';
    return `S${String(season).padStart(2, '0')}E${String(episode).padStart(2, '0')}`;
  };

  // Traduit le type d'épisode pour afficher des badges pertinents
  const translateEpisodeType = (type) => {
    if (!type || type === 'standard') return null;
    const types = {
      'finale': 'Final de saison',
      'premiere': 'Début de saison',
      'mid_season': 'Mi-saison',
      'series_finale': 'Final de la série',
      'series_premiere': 'Pilote'
    };
    return types[type.toLowerCase()] || type;
  };

  const serieStatus = computed(() => {
    const status = serieDetails.value.status;
    if (status === 'Returning Series') return 'En cours de production';
    if (status === 'Ended') return 'Terminée';
    if (status === 'Canceled') return 'Annulée';
    if (status === 'In Production') return 'En production';
    return status || '';
  });

  const handleAuthError = (error) => {
    if (error.response && error.response.status === 403) {
      localStorage.removeItem('user_token');
      authMessage.value = "Votre session a expiré. Veuillez vous reconnecter.";
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
        serieDetails.value.first_air_date_formatted = formatDate(serieDetails.value.first_air_date);
        serieDetails.value.release_year = serieDetails.value.first_air_date.split('-')[0];
      }

      if (serieDetails.value.last_air_date) {
        serieDetails.value.last_air_year = serieDetails.value.last_air_date.split('-')[0];
      }

      // Durée moyenne d'un épisode si l'info est dispo
      if (serieDetails.value.episode_run_time && serieDetails.value.episode_run_time.length > 0) {
        const runtimeMinutes = serieDetails.value.episode_run_time[0];
        const hours = Math.floor(runtimeMinutes / 60);
        const minutes = runtimeMinutes % 60;
        if (hours > 0) {
          serieDetails.value.runtimeFormatted = `${hours}h ${minutes.toString().padStart(2, '0')}min / ép.`;
        } else {
          serieDetails.value.runtimeFormatted = `${minutes} min / ép.`;
        }
      }

      const creditsResponse = await axios.get(`${API_BASE_URL}/series/${serieId.value}/credits`);
      serieCredits.value = creditsResponse.data;
    } catch (error) {
      console.error('Error fetching series details:', error);
    }
  };

  const fetchStatusUserSerie = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/user/series/status/${serieId.value}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      statusUserSerie.value = response.data;
      if (statusUserSerie.value === "WATCHED") {
        const watchedResponse = await axios.get(`${API_BASE_URL}/user/series/watched-date/${serieId.value}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const watchedDate = new Date(watchedResponse.data);
        const day = String(watchedDate.getDate()).padStart(2, '0');
        const month = String(watchedDate.getMonth() + 1).padStart(2, '0');
        const year = watchedDate.getFullYear();
        textVuAvecDate.value = `Terminée le ${day}/${month}/${year}`;
      }
    } catch (error) {
      handleAuthError(error);
      console.error('Error fetching series status:', error);
    }
  };

  const fetchRating = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;

      const [resRating, resComment] = await Promise.all([
        axios.get(`${API_BASE_URL}/user/series/rating/${serieId.value}`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get(`${API_BASE_URL}/user/series/comment/${serieId.value}`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      userComment.value = resComment.data || "";
      if (['UNDEFINED', null, 'NO_COMMENT'].includes(userComment.value)) {
        userComment.value = "";
      }
      userRating.value = resRating.data || 0;
    } catch (error) {
      handleAuthError(error);
      console.error('Error fetching series rating:', error);
      userRating.value = 0;
      userComment.value = "";
    }
  };

  const fetchSeasonDetails = async (seasonNumber) => {
    if (activeSeasonNumber.value === seasonNumber) {
      selectedSeasonInfo.value = null;
      activeSeasonNumber.value = null;
      return;
    }
    
    loadingSeason.value = true;
    activeSeasonNumber.value = seasonNumber;
    try {
      const response = await axios.get(`${API_BASE_URL}/series/${serieId.value}/season/${seasonNumber}`);
      selectedSeasonInfo.value = response.data;
    } catch (error) {
      console.error('Erreur chargement des épisodes de la saison:', error);
    } finally {
      loadingSeason.value = false;
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
    if (!checkAuth("Connectez-vous pour ajouter cette série à votre liste.")) return;
    if (statusUserSerie.value === "UNDEFINED") {
      addSerieToWatchlist();
    }
  };

  const addSerieToWatchlist = async () => {
    try {
      const token = localStorage.getItem('user_token');
      await axios.post(`${API_BASE_URL}/user/series/to-watch/${serieId.value}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      statusUserSerie.value = "TO_WATCH";
    } catch (error) {
      handleAuthError(error);
      console.error('Erreur ajout série watchlist:', error);
    }
  };

  const updateStatus = async (newStatus) => {
    if (!checkAuth("Connectez-vous pour modifier le statut de cette série.")) return;

    if (newStatus === 'DELETE') {
      dialogConfirmation.value = true;
      return;
    }
    if (newStatus === 'DATE') {
      dialogDate.value = true;
      return;
    }
    
    try {
      const token = localStorage.getItem('user_token');
      await axios.put(`${API_BASE_URL}/user/series/status/${serieId.value}`, 
        { status: newStatus }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      statusUserSerie.value = newStatus;
    } catch (error) {
      handleAuthError(error);
      console.error('Erreur statut série:', error);
    }
  };

  const confirmDelete = async () => {
    try {
      const token = localStorage.getItem('user_token');
      await axios.delete(`${API_BASE_URL}/user/series/status/${serieId.value}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      statusUserSerie.value = "UNDEFINED";
      dialogConfirmation.value = false;
      userComment.value = "";
      userRating.value = 0;
    } catch (error) {
      handleAuthError(error);
      console.error('Erreur suppression série:', error);
    }
  };

  const confirmDateChange = async () => {
    try {
      const token = localStorage.getItem('user_token');
      const year = selectedDate.value.getFullYear();
      const month = String(selectedDate.value.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.value.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`; 
      
      await axios.put(`${API_BASE_URL}/user/series/status/${serieId.value}`, 
        { status: "WATCHED", watchedAt: formattedDate }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      textVuAvecDate.value = `Terminée le ${day}/${month}/${year}`;
      statusUserSerie.value = "WATCHED";
      dialogDate.value = false;
    } catch (error) {
      handleAuthError(error);
      console.error('Erreur modification date série:', error);
    }
  };

  const saveRating = async () => {
    if (!checkAuth("Connectez-vous pour noter cette série.")) return;
    try {
      if (editRating.value < 1 || editRating.value > 10) return;
      if (editComment.value.length > 500) {
        alert('Le commentaire ne doit pas dépasser 500 caractères.');
        return;
      }

      userRating.value = editRating.value;
      userComment.value = editComment.value;
      const token = localStorage.getItem('user_token');
      await axios.put(`${API_BASE_URL}/user/series/rate/${serieId.value}`, 
        { rating: userRating.value, comment: userComment.value }, 
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchStatusUserSerie();
    } catch (error) {
      handleAuthError(error);
      console.error('Erreur sauvegarde note série:', error);
    }
    dialogNote.value = false;
  };

  const openDialogNote = () => {
    if (!checkAuth("Connectez-vous pour noter cette série.")) return;
    dialogNote.value = true;
  };

  const allGenres = computed(() => {
    const genres = serieDetails.value.genres;
    return Array.isArray(genres) ? genres.map(g => g.name).join(', ') : '';
  });

  const periodYears = computed(() => {
    if (!serieDetails.value.release_year) return '';
    if (serieDetails.value.status === 'Ended' || serieDetails.value.status === 'Canceled') {
      return `${serieDetails.value.release_year} - ${serieDetails.value.last_air_year || ''}`;
    }
    return `${serieDetails.value.release_year} - Aujourd'hui`;
  });

  onMounted(() => {
    fetchDetailsSerie();
    fetchStatusUserSerie();
    fetchRating();
  });

  watch(dialogNote, (isOpen) => {
    if (isOpen) {
      editRating.value = (userRating.value <= 0) ? 5 : userRating.value;
      editComment.value = userComment.value;
    }
  });

  watch(() => serieId.value, () => {
    serieDetails.value = {};
    serieCredits.value = {};
    statusUserSerie.value = "UNDEFINED";
    userRating.value = 0;
    userComment.value = "";
    selectedSeasonInfo.value = null;
    activeSeasonNumber.value = null;
    fetchDetailsSerie();
    fetchStatusUserSerie();
    fetchRating();
  });
</script>

<template>
  <div v-if="serieDetails.name" class="serie-page">
    <!-- Bannière principale -->
    <div class="banner-wrapper">
      <div 
        class="backdrop-image" 
        :style="{ backgroundImage: `url(https://image.tmdb.org/t/p/original${serieDetails.backdrop_path})` }"
      ></div>
      
      <v-container class="content-overlay py-10">
        <v-row align="center">
          <v-col cols="12" md="3" class="d-flex justify-center">
            <v-img
              :src="serieDetails.poster_path ? `https://image.tmdb.org/t/p/w500${serieDetails.poster_path}` : noPoster"
              :alt="serieDetails.name"
              class="poster-img elevation-10"
              cover
            ></v-img>
          </v-col>

          <v-col cols="12" md="9" class="text-white px-md-10">
            <div class="serie-header">
              <!-- Badges de statut et type -->
              <div class="d-flex align-center flex-wrap ga-2 mb-2">
                <v-chip color="grey-darken-3" variant="flat" size="small" class="text-white font-weight-bold">
                  <v-icon start size="small" color="white">mdi-television-classic</v-icon>
                  Série
                </v-chip>
                <v-chip v-if="serieStatus" color="#8C52FF" variant="flat" size="small" class="font-weight-bold">
                  {{ serieStatus }}
                </v-chip>
              </div>

              <h1 class="text-h3 font-weight-bold">{{ serieDetails.name }}</h1>
              
              <p class="subtitle-info d-flex align-center flex-wrap mt-2">
                <span>{{ periodYears }}</span>
                <span class="mx-2">•</span>
                <span>{{ allGenres }}</span>
                <span class="mx-2">•</span>
                <span>{{ serieDetails.number_of_seasons }} saison{{ serieDetails.number_of_seasons > 1 ? 's' : '' }}</span>
                <span class="mx-2">•</span>
                <span>{{ serieDetails.number_of_episodes }} épisodes</span>
                <span v-if="serieDetails.runtimeFormatted" class="mx-2">•</span>
                <span v-if="serieDetails.runtimeFormatted">{{ serieDetails.runtimeFormatted }}</span>
              </p>

              <!-- Diffuseurs / Networks & Site web (sur la même ligne) -->
              <div class="d-flex align-center flex-wrap mt-3 ga-4">
                <div v-if="serieDetails.networks?.length" class="d-flex align-center ga-3">
                  <span class="text-caption text-grey-lighten-2">Diffusé sur :</span>
                  <div 
                    v-for="net in serieDetails.networks" 
                    :key="net.id" 
                    class="network-badge pa-1 bg-white rounded" 
                  >
                    <img 
                      v-if="net.logo_path" 
                      :src="`https://image.tmdb.org/t/p/w92${net.logo_path}`" 
                      :alt="net.name"
                      style="height: 20px; max-width: 100px; object-fit: contain; display: block;" 
                    />
                    <span v-else class="text-caption text-black px-1 font-weight-bold">{{ net.name }}</span>
                  </div>
                </div>
                
                <v-btn 
                  v-if="serieDetails.homepage"
                  :href="serieDetails.homepage"
                  target="_blank"
                  variant="outlined"
                  size="small"
                  color="white"
                  prepend-icon="mdi-open-in-new"
                  rounded="xl"
                >
                  Site officiel
                </v-btn>
              </div>
            </div>

            <!-- Note globale TMDB -->
            <div class="score-section my-6 d-flex align-center">
              <v-progress-circular
                :model-value="serieDetails.vote_average * 10"
                color="green-accent-3"
                size="60"
                width="6"
                class="bg-black rounded-circle"
              >
                <span class="font-weight-bold text-caption">{{ Math.round(serieDetails.vote_average * 10) }}%</span>
              </v-progress-circular>
              <span class="ml-3 font-weight-bold leading-tight">Score d'évaluation<br>TMDB</span>
            </div>

            <!-- Actions Utilisateur -->
            <div class="actions-row mb-8 d-flex flex-wrap align-center ga-3">
              <v-menu 
                :close-on-content-click="true" 
                location="bottom center"
                offset="10"
                :disabled="statusUserSerie === 'UNDEFINED'"
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
                    <v-icon start>{{ textButtonStatus[statusUserSerie].icon }}</v-icon>
                    <span class="font-weight-bold">{{ textButtonStatus[statusUserSerie].text }}</span>
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
              >
                <v-icon start color="amber">mdi-star</v-icon>
                <span class="text-black font-weight-bold">{{ displayRating }}</span>
              </v-btn>
            </div>

            <!-- Synopsis & Créateurs & Production -->
            <div class="synopsis-section">
              <p v-if="serieDetails.tagline" class="tagline mb-4 text-grey-lighten-1 italic">
                <i>{{ serieDetails.tagline }}</i>
              </p>
              <h3 v-if="serieDetails.overview" class="text-h6 font-weight-bold mb-2">Synopsis</h3>
              <p v-if="serieDetails.overview" class="overview-text">{{ serieDetails.overview }}</p>
              
              <div v-if="serieDetails.created_by?.length" class="creator-info mt-6">
                <h3 class="text-h6 font-weight-bold mb-2">
                  {{ serieDetails.created_by.length === 1 ? 'Créateur' : 'Créateurs' }}
                </h3>
                <p class="text-body-2">{{ serieDetails.created_by.map(c => c.name).join(', ') }}</p>
              </div>
            </div>
          </v-col>
        </v-row>
      </v-container>
    </div>

    <!-- Section Épisodes (Dernier / Prochain) -->
    <v-container class="mt-8" v-if="serieDetails.last_episode_to_air || serieDetails.next_episode_to_air">
      <h3 class="text-h5 font-weight-bold mb-4">Diffusion</h3>
      <v-row>
        <!-- Dernier épisode diffusé -->
        <v-col cols="12" md="6" v-if="serieDetails.last_episode_to_air">
          <v-card class="pa-5 rounded-xl elevation-2 h-100 d-flex flex-column" color="#fcfcfc">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-overline text-grey-darken-1">Dernier épisode diffusé</span>
              <div class="d-flex align-center ga-2">
                <v-chip 
                  v-if="translateEpisodeType(serieDetails.last_episode_to_air.episode_type)" 
                  size="small" 
                  color="error" 
                  variant="flat" 
                  class="font-weight-bold"
                >
                  {{ translateEpisodeType(serieDetails.last_episode_to_air.episode_type) }}
                </v-chip>
                <v-chip size="small" color="primary" class="text-white font-weight-bold">
                  {{ formatDate(serieDetails.last_episode_to_air.air_date) }}
                </v-chip>
              </div>
            </div>
            <h4 class="text-h6 font-weight-bold mb-2">
              <span class="text-primary mr-2">{{ formatEpisodeNumber(serieDetails.last_episode_to_air.season_number, serieDetails.last_episode_to_air.episode_number) }}</span>
              {{ serieDetails.last_episode_to_air.name }}
            </h4>
            <p class="text-body-2 text-grey-darken-3 mb-4 flex-grow-1 text-justify">
              {{ serieDetails.last_episode_to_air.overview || 'Aucun résumé disponible pour cet épisode.' }}
            </p>
            <div class="d-flex align-center mt-auto" v-if="serieDetails.last_episode_to_air.vote_average">
              <v-icon color="amber" size="small" class="mr-1">mdi-star</v-icon>
              <span class="text-body-2 font-weight-bold">{{ Math.round(serieDetails.last_episode_to_air.vote_average * 10) / 10 }} / 10</span>
            </div>
          </v-card>
        </v-col>

        <!-- Prochain épisode -->
        <v-col cols="12" md="6" v-if="serieDetails.next_episode_to_air">
          <v-card class="pa-5 rounded-xl elevation-0 border h-100 d-flex flex-column">
            <div class="d-flex align-center justify-space-between mb-3">
              <span class="text-overline text-primary font-weight-bold">Prochain épisode à venir</span>
              <div class="d-flex align-center ga-2">
                <v-chip 
                  v-if="translateEpisodeType(serieDetails.next_episode_to_air.episode_type)" 
                  size="small" 
                  color="error" 
                  variant="flat" 
                  class="font-weight-bold"
                >
                  {{ translateEpisodeType(serieDetails.next_episode_to_air.episode_type) }}
                </v-chip>
                <v-chip size="small" color="success" class="text-white font-weight-bold">
                  {{ formatDate(serieDetails.next_episode_to_air.air_date) }}
                </v-chip>
              </div>
            </div>
            <h4 class="text-h6 font-weight-bold mb-2">
              <span class="text-primary mr-2">{{ formatEpisodeNumber(serieDetails.next_episode_to_air.season_number, serieDetails.next_episode_to_air.episode_number) }}</span>
              {{ serieDetails.next_episode_to_air.name }}
            </h4>
            <p class="text-body-2 text-grey-darken-3 mb-4 flex-grow-1 text-justify">
              {{ serieDetails.next_episode_to_air.overview || 'Aucun résumé disponible pour cet épisode.' }}
            </p>
          </v-card>
        </v-col>
      </v-row>
    </v-container>

    <!-- Section Saisons -->
    <v-container class="mt-8" v-if="serieDetails.seasons?.length">
      <h3 class="text-h5 font-weight-bold mb-4">Saisons ({{ serieDetails.number_of_seasons }})</h3>
      <v-row class="flex-nowrap overflow-x-auto pb-4">
        <v-col 
          v-for="season in serieDetails.seasons" 
          :key="season.id" 
          cols="8" sm="4" md="3" lg="2" 
          class="flex-shrink-0"
        >
          <v-card 
            class="rounded-lg overflow-hidden h-100 d-flex flex-column season-card" 
            :class="{'active-season': activeSeasonNumber === season.season_number}"
            :elevation="activeSeasonNumber === season.season_number ? 8 : 2"
            @click="fetchSeasonDetails(season.season_number)"
          >
            <v-img 
              :src="season.poster_path ? `https://image.tmdb.org/t/p/w300${season.poster_path}` : noPoster" 
              height="240" 
              cover
              class="bg-grey-lighten-2"
            ></v-img>
            <v-card-text class="pa-3">
              <p class="font-weight-bold mb-1 text-truncate text-body-2">{{ season.name }}</p>
              <p class="text-caption text-grey-darken-1 mb-0">
                {{ season.episode_count }} épisode{{ season.episode_count > 1 ? 's' : '' }}
              </p>
              <p v-if="season.air_date" class="text-caption text-grey-darken-1">
                {{ season.air_date.split('-')[0] }}
              </p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- Chargement des épisodes -->
      <div v-if="loadingSeason" class="text-center py-8">
        <v-progress-circular indeterminate color="#8C52FF" size="50"></v-progress-circular>
      </div>

      <!-- Liste détaillée des épisodes de la saison sélectionnée -->
      <v-expand-transition>
        <div v-if="selectedSeasonInfo && !loadingSeason" class="mt-4 bg-grey-lighten-4 rounded-xl pa-6 border">
          <div class="d-flex justify-space-between align-center mb-6">
            <h3 class="text-h5 font-weight-bold">{{ selectedSeasonInfo.name }} <span class="text-body-1 text-grey-darken-1">({{ selectedSeasonInfo.episodes?.length }} épisodes)</span></h3>
            <v-btn icon="mdi-close" variant="text" @click="selectedSeasonInfo = null; activeSeasonNumber = null"></v-btn>
          </div>

          <v-row>
            <v-col cols="12" v-for="episode in selectedSeasonInfo.episodes" :key="episode.id">
              <v-card class="d-flex flex-column flex-md-row rounded-lg overflow-hidden elevation-1" color="white">
                <v-img
                  :src="episode.still_path ? `https://image.tmdb.org/t/p/w300${episode.still_path}` : noPoster"
                  width="100%"
                  max-width="250"
                  height="150"
                  cover
                  class="bg-grey-lighten-2 shrink-0 episode-img"
                ></v-img>
                <div class="pa-4 flex-grow-1 d-flex flex-column">
                  <div class="d-flex justify-space-between align-start flex-wrap ga-2 mb-2">
                    <h4 class="text-h6 font-weight-bold leading-tight">
                      <span class="text-primary mr-2">{{ formatEpisodeNumber(episode.season_number, episode.episode_number) }}</span>
                      {{ episode.name }}
                    </h4>
                    <div class="d-flex align-center ga-2">
                      <v-chip 
                        v-if="translateEpisodeType(episode.episode_type)" 
                        size="small" 
                        color="error" 
                        variant="flat" 
                        class="font-weight-bold"
                      >
                        {{ translateEpisodeType(episode.episode_type) }}
                      </v-chip>
                      <v-chip size="small" color="grey-darken-3" variant="outlined" class="bg-white">
                        {{ formatDate(episode.air_date) }}
                      </v-chip>
                    </div>
                  </div>
                  <p class="text-body-2 text-grey-darken-3 mb-3 flex-grow-1 text-justify">
                    {{ episode.overview || 'Aucun résumé disponible pour cet épisode.' }}
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

    <!-- Casting / Têtes d'affiche -->
    <v-container class="mt-6 mb-10" v-if="serieCredits.cast?.length">
      <h3 class="text-h5 font-weight-bold mb-6">Têtes d'affiche</h3>
      <v-row class="flex-nowrap overflow-x-auto pb-4">
        <v-col 
          v-for="actor in serieCredits.cast" 
          :key="actor.id" 
          cols="6" sm="4" md="2" 
          class="flex-shrink-0"
        >
          <v-card class="rounded-lg overflow-hidden elevation-2 h-100">
            <v-img 
              :src="actor.profile_path ? `https://image.tmdb.org/t/p/w200${actor.profile_path}` : noPoster" 
              height="200" 
              cover
              class="bg-grey-lighten-2"
            ></v-img>
            <v-card-text class="pa-2">
              <p class="font-weight-bold mb-0 text-truncate text-body-2">{{ actor.name }}</p>
              <p class="text-caption text-grey-darken-1 text-truncate">{{ actor.roles?.[0]?.character || actor.character }}</p>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>

  <!-- Dialog de confirmation suppression -->
  <ConfirmationDialog
    v-model="dialogConfirmation"
    title="Supprimer la série"
    message="Êtes-vous sûr de vouloir supprimer cette série de votre liste ?"
    confirm-text="Supprimer"
    cancel-text="Annuler"
    @confirm="confirmDelete"
  ></ConfirmationDialog>

  <!-- Dialog date visionnage -->
  <v-dialog v-model="dialogDate" width="auto">
    <v-card title="Quand avez-vous fini cette série ?">
      <v-card-text class="pa-0">
        <v-date-picker 
          v-model="selectedDate" 
          color="#8C52FF" 
          hide-header 
          show-adjacent-months 
          control-variant="modal" 
          :max="new Date()"
        ></v-date-picker>
      </v-card-text>
      <v-divider></v-divider>
      <v-card-actions>
        <v-spacer></v-spacer>
        <v-btn text="Annuler" variant="text" @click="dialogDate = false"></v-btn>
        <v-btn color="#8C52FF" variant="flat" text="Confirmer" @click="confirmDateChange"></v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>

  <!-- Dialog Notation / Critique -->
  <v-dialog v-model="dialogNote" width="450px">
    <v-card class="pa-4 rounded-xl relative">
      <div class="d-flex align-center justify-center mb-4">
        <v-card-title class="pa-0 font-weight-bold">Noter cette série</v-card-title>
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
        placeholder="Votre avis sur la série..."
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

  <!-- Dialog redirection connexion -->
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
          @click="router.push({ path: '/login', query: { redirect: $route.fullPath } })"
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
.serie-page {
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

.network-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.comment-area :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

.selected-rating {
  background-color: #8C52FF !important;
  border-color: #8C52FF !important;
}

.action-btn {
  height: 44px !important;
}

/* Saisons et Épisodes */
.season-card {
  cursor: pointer;
  transition: all 0.3s ease;
  border: 2px solid transparent;
}

.season-card:hover {
  transform: translateY(-5px);
}

.active-season {
  border-color: #8C52FF !important;
  background-color: #f8f5ff;
}

.episode-img {
  min-width: 250px;
}

@media (max-width: 960px) {
  .backdrop-image::after {
    background-image: linear-gradient(to bottom, rgba(10, 20, 40, 0.9), rgba(10, 20, 40, 1));
  }
  .episode-img {
    max-width: 100% !important;
    height: 180px;
  }
}
</style>