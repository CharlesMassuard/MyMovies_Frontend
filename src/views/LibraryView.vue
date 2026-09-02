<script setup>
    import { ref, computed, onMounted } from 'vue';
    import { useRouter } from 'vue-router';
    import axios from 'axios';
    import noPoster from '../assets/noPosterAvailable.webp';

    const router = useRouter();
    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const userLibrary = ref([]);
    const loading = ref(true);
    const currentFilter = ref('all');

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

            userLibrary.value = [...movies, ...series].reverse();

        } catch (error) {
            console.error('Erreur lors de la récupération de la bibliothèque:', error);
        } finally {
            loading.value = false;
        }
    };

    const filteredLibrary = computed(() => {
        if (currentFilter.value === 'movies') {
            return userLibrary.value.filter(item => item.type === 'movie');
        }
        if (currentFilter.value === 'series') {
            return userLibrary.value.filter(item => item.type === 'serie');
        }
        return userLibrary.value;
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
    <div class="d-flex align-center justify-space-between flex-wrap ga-4 mb-6">
      <div class="d-flex align-baseline">
        <h2 class="text-h5 font-weight-bold">Ma Bibliothèque</h2>
        <span class="text-grey ml-2 text-h6" v-if="filteredLibrary.length > 0">
          ({{ filteredLibrary.length }})
        </span>
      </div>

      <v-btn-toggle
        v-if="userLibrary.length > 0"
        v-model="currentFilter"
        color="#8C52FF"
        mandatory
        rounded="xl"
        variant="outlined"
        density="compact"
      >
        <v-btn value="all" class="text-none font-weight-bold px-4">Tous</v-btn>
        <v-btn value="movies" class="text-none font-weight-bold px-4">Films</v-btn>
        <v-btn value="series" class="text-none font-weight-bold px-4">Séries</v-btn>
      </v-btn-toggle>
    </div>

    <!-- Grille de la bibliothèque sans animation complexe -->
    <v-row v-if="filteredLibrary.length > 0" class="w-100 ma-0">
      <v-col
        v-for="(item, index) in filteredLibrary"
        :key="`${item.type}-${item.data.id}`"
        cols="6"
        sm="4"
        md="3"
        lg="2"
        xl="2"
        class="px-2 py-3"
      >
        <v-card 
          class="rounded-lg overflow-hidden library-card h-100" 
          elevation="2" 
          @click="navigateToItem(item)" 
          v-tooltip="{ text: item.data.title || item.data.name, openDelay: 500, location: 'bottom' }"
        >
          <v-img
            :src="item.data.posterUrl ? `https://image.tmdb.org/t/p/w500${item.data.posterUrl}` : noPoster"
            aspect-ratio="2/3"
            cover
            class="align-start"
          >
            <!-- Padding augmenté (pa-3 au lieu de pa-2) pour décoller les badges des bords -->
            <div class="d-flex flex-row justify-space-between h-100 pa-3 ga-2">
              <!-- Type du média (Haut Droit) -->
              <div class="d-flex justify-end">
                <v-chip size="small" variant="flat" :color="item.type === 'serie' ? '#8C52FF' : '#4287f5'" class="text-white font-weight-bold shadow-badge">
                  {{ item.type === 'serie' ? 'Série' : 'Film' }}
                </v-chip>
              </div>

              <!-- Statut et Note (Bas Droit) -->
              <div class="d-flex justify-end mt-auto">
                <v-chip v-if="item.status === 'WATCHED'" size="small" class="px-3 rating-chip font-weight-bold">
                  <v-icon start icon="mdi-star" size="14" color="amber" class="mr-1"></v-icon>
                  {{ item.rating }}
                </v-chip>
                <v-chip v-if="item.status === 'WATCHING'" size="small" class="px-3 rating-chip font-weight-bold">
                  <v-icon start icon="mdi-play-circle-outline" size="14" color="white" class="mr-1"></v-icon>
                  En cours
                </v-chip>
                <v-chip v-if="item.status === 'TO_WATCH'" size="small" class="px-3 rating-chip font-weight-bold">
                  <v-icon start icon="mdi-clock-outline" size="14" color="white" class="mr-1"></v-icon>
                  À voir
                </v-chip>
              </div>
            </div>
          </v-img>
        </v-card>
      </v-col>
    </v-row>

    <!-- État vide -->
    <v-sheet
      v-else-if="!loading"
      class="d-flex flex-column align-center justify-center py-12 bg-transparent text-center"
      rounded="lg"
    >
      <v-icon
        icon="mdi-movie-open-off-outline"
        size="100"
        color="grey-lighten-1"
        class="mb-4"
      ></v-icon>
      <h3 class="text-h5 font-weight-medium text-grey-darken-1">Aucun résultat trouvé</h3>
      <p class="text-grey mb-6">Ajoutez des films ou des séries pour les retrouver ici.</p>
      
      <v-btn color="#8C52FF" variant="flat" rounded="xl" @click="router.push('/')">
        Découvrir des nouveautés
      </v-btn>
    </v-sheet>
  </v-container>
</template>

<style scoped>
.library-card {
  transition: transform 0.2s ease-in-out;
  cursor: pointer;
}

.library-card:hover {
  transform: scale(1.03);
}

.rating-chip {
  background: rgba(0, 0, 0, 0.75) !important;
  color: white !important;
  backdrop-filter: blur(6px);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.shadow-badge {
  box-shadow: 0 2px 8px rgba(0,0,0,0.4);
}
</style>