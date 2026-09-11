<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { useRouter } from 'vue-router';
    import axios from 'axios';
    import noPoster from '../assets/noPosterAvailable.webp';

    const router = useRouter();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const userLibrary = ref([]);
    const loading = ref(true);
    
    const currentType = ref('all');
    const currentStatus = ref('all');

    const fetchUserLibrary = async () => {
      try {
          loading.value = true;
          const token = localStorage.getItem('user_token');
          if (!token) return;

          const [moviesRes, seriesRes] = await Promise.all([
              axios.get(`${API_BASE_URL}/user/movies`, { headers: { Authorization: `Bearer ${token}` } }),
              axios.get(`${API_BASE_URL}/user/series`, { headers: { Authorization: `Bearer ${token}` } })
          ]);

          const movies = moviesRes.data.map(item => ({ ...item, type: 'movie', data: item.movie }));
          const series = seriesRes.data.map(item => ({ ...item, type: 'serie', data: item.serie }));

          let combinedLibrary = [...movies, ...series];

          // Tri par date de dernière modification (du plus récent au plus ancien)
          // Remplace 'updatedAt' par le vrai nom du champ renvoyé par ton backend si différent
          combinedLibrary.sort((a, b) => {
              const dateA = new Date(a.updatedAt || 0); // fallback à 0 si la date est absente
              const dateB = new Date(b.updatedAt || 0);
              return dateB - dateA; // Tri décroissant
          });

          userLibrary.value = combinedLibrary;

      } catch (error) {
          console.error('Erreur lors de la récupération de la bibliothèque:', error);
      } finally {
          loading.value = false;
      }
    };

    const filteredLibrary = computed(() => {
        let result = userLibrary.value;
        
        if (currentType.value !== 'all') {
            result = result.filter(item => item.type === currentType.value);
        }
        
        if (currentStatus.value !== 'all') {
            result = result.filter(item => item.status === currentStatus.value);
        }
        
        return result;
    });

    const navigateToItem = (item) => {
        if (item.type === 'serie') {
            router.push(`/serie/${item.data.id}`);
        } else {
            router.push(`/movie/${item.data.id}`);
        }
    };

    onMounted(() => {
        fetchUserLibrary();
    });
</script>

<template>
  <v-container class="py-8">
    
    <div class="d-flex flex-column flex-md-row align-start align-md-center justify-space-between mb-8 section-header ga-4">
      <div class="d-flex align-baseline">
        <h1 class="text-h5 font-weight-bold section-title">Ma Bibliothèque</h1>
        <span class="text-grey ml-2 text-subtitle-1 font-weight-medium" v-if="filteredLibrary.length > 0">
          ({{ filteredLibrary.length }})
        </span>
      </div>

      <v-btn-toggle
        v-if="userLibrary.length > 0"
        v-model="currentType"
        color="#8C52FF"
        mandatory
        rounded="xl"
        variant="outlined"
        density="compact"
        class="bg-white w-100 w-md-auto d-flex"
      >
        <!--Boutons étendus pour remplir l'écran sur mobile avec flex-grow-1-->
        <v-btn value="all" class="text-none font-weight-bold flex-grow-1 px-2 px-md-6">Général</v-btn>
        <v-btn value="movie" class="text-none font-weight-bold flex-grow-1 px-2 px-md-6">Films</v-btn>
        <v-btn value="serie" class="text-none font-weight-bold flex-grow-1 px-2 px-md-6">Séries</v-btn>
      </v-btn-toggle>
    </div>

    <!-- Filtres secondaires : Statuts -->
    <div class="mb-6 px-4" v-if="userLibrary.length > 0">
      <v-chip-group
        v-model="currentStatus"
        mandatory
        selected-class="selected-chip text-white"
        column
      >
        <v-chip value="all" variant="outlined" class="font-weight-bold px-4">Tous</v-chip>
        <v-chip value="TO_WATCH" variant="outlined" class="font-weight-bold px-4">
          <v-icon start icon="mdi-clock-outline" size="small"></v-icon>À voir
        </v-chip>
        <v-chip value="WATCHING" variant="outlined" class="font-weight-bold px-4">
          <v-icon start icon="mdi-play-circle-outline" size="small"></v-icon>En cours
        </v-chip>
        <v-chip value="WATCHED" variant="outlined" class="font-weight-bold px-4">
          <v-icon start icon="mdi-check-all" size="small"></v-icon>Vus
        </v-chip>
      </v-chip-group>
    </div>

    <!-- Grille de la bibliothèque -->
    <v-row v-if="filteredLibrary.length > 0">
      <v-col
        v-for="item in filteredLibrary"
        :key="`${item.type}-${item.data.id}`"
        cols="6" sm="4" md="3" lg="2" xl="2"
      >
        <div class="card-container">
          <div class="border-wrapper">
            <v-card
              class="movie-card"
              rounded="l"
              flat
              v-tooltip="{ text: item.data.title || item.data.name, openDelay: 500, location: 'bottom' }"
              @click="navigateToItem(item)"
            >
              <v-img
                :src="item.data.posterUrl ? `https://image.tmdb.org/t/p/w500${item.data.posterUrl}` : noPoster"
                cover
                aspect-ratio="2/3"
                class="movie-img"
              ></v-img>

              <!-- Badge Supérieur : Type de média -->
              <div v-if="currentType === 'all'" class="badge-container-top pa-1">
                <v-chip size="x-small" variant="flat" :color="item.type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                  {{ item.type === 'serie' ? 'Série' : 'Film' }}
                </v-chip>
              </div>

              <!-- Badge Inférieur : Statut / Note -->
              <div class="badge-container-bottom pa-1">
                <v-chip v-if="item.status === 'WATCHED'" size="x-small" color="amber-darken-4" variant="flat" class="text-white font-weight-bold shadow-badge">
                  <v-icon start icon="mdi-star" size="12"></v-icon>
                  {{ item.rating ? `${item.rating}/10` : 'Non noté' }}
                </v-chip>
                <v-chip v-else-if="item.status === 'WATCHING'" size="x-small" color="info" variant="flat" class="text-white font-weight-bold shadow-badge">
                  En cours
                </v-chip>
                <v-chip v-else-if="item.status === 'TO_WATCH'" size="x-small" color="grey-darken-3" variant="flat" class="text-white font-weight-bold shadow-badge">
                  À voir
                </v-chip>
              </div>

            </v-card>
          </div>
        </div>
      </v-col>
    </v-row>

    <!-- État vide -->
    <v-sheet
      v-else-if="!loading"
      class="d-flex flex-column align-center justify-center py-12 bg-transparent text-center mt-8"
    >
      <v-icon icon="mdi-movie-open-off-outline" size="80" color="grey-lighten-1" class="mb-4"></v-icon>
      <h3 class="text-h6 font-weight-bold text-grey-darken-1 mb-2">Aucun résultat</h3>
      <p class="text-grey mb-6">Modifiez vos filtres ou ajoutez de nouvelles œuvres à votre bibliothèque.</p>
      
      <v-btn color="#8C52FF" variant="flat" rounded="xl" class="font-weight-bold px-6" @click="router.push('/')">
        Explorer le catalogue
      </v-btn>
    </v-sheet>
  </v-container>
</template>

<style scoped>
    .section-header {
        padding-left: 10px;
        padding-right: 10px;
    }

    .section-title {
        position: relative;
        padding-bottom: 15px;
        display: inline-block;
    }

    .section-title::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0; 
        width: 100%; 
        height: 2px;
        background-color: #ebebeb;
    }

    .selected-chip {
        background-color: #8C52FF !important;
        border-color: #8C52FF !important;
    }

    /* Styles repris de la MainView */
    .card-container {
        position: relative;
        width: 100%;
        padding-bottom: 10px;
    }

    .border-wrapper {
        border: 4px solid #ffffff;
        border-radius: 20px;
        overflow: hidden;
        width: 100%;
        z-index: 1;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    }

    .movie-card {
        cursor: pointer;
        background: transparent;
        position: relative;
    }

    .movie-img {
        transition: transform 0.3s ease;
        width: 100%;
        height: 100%;
    }

    .movie-card:hover .movie-img {
        transform: scale(1.1);
    }

    /* Badges isolés du zoom */
    .badge-container-top {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 10;
        pointer-events: none;
    }

    .badge-container-bottom {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 100%;
        display: flex;
        justify-content: flex-end;
        z-index: 10;
        pointer-events: none;
    }

    .shadow-badge {
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
</style>