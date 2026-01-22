<script setup>
    import { ref, computed, onMounted, watch } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import axios  from 'axios';
    import noPoster from '../assets/noPosterAvailable.webp';

    const router = useRouter();

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const userMovies = ref([]);

    const fetchUserMovies = async () => {
        try {
            const token = localStorage.getItem('user_token');
            if (!token) return;

            const response = await axios.get(`${API_BASE_URL}/user/movies`, {
              headers: { Authorization: `Bearer ${token}` }
            });
            userMovies.value = response.data.reverse();
        } catch (error) {
            console.error('Error fetching user library:', error);
        }
    };

    onMounted(() => {
        fetchUserMovies();
    });
</script>

<template>
  <v-container class="py-8">
    <div class="d-flex align-baseline mb-6">
      <h2 class="text-h5 font-weight-bold">Mes memories</h2>
      <span class="text-grey ml-2 text-h6">213</span>
    </div>

    <v-row>
      <v-col
        v-for="(userMovie, index) in userMovies"
        :key="index"
        cols="6"
        sm="4"
        md="3"
        lg="2"
        xl="2"
      >
        <v-card class="rounded-lg overflow-hidden" elevation="0" @click="$router.push(`/movie/${userMovie.movie.id}`)">
          <v-img
            :src="userMovie.movie.posterUrl ? `https://image.tmdb.org/t/p/w500${userMovie.movie.posterUrl}` : noPoster"
            aspect-ratio="2/3"
            cover
            class="align-start"
          >
            <div class="ma-2">
              <v-chip v-if="userMovie.status === 'WATCHED'" size="small" class="px-2 rating-chip">
                <v-icon
                  start
                  icon="mdi-star"
                  size="14"
                  color="white"
                  class="mr-1"
                ></v-icon>
                <span class="font-weight-bold">{{ userMovie.rating }}</span>
              </v-chip>
              <v-chip v-if="userMovie.status === 'WATCHING'" size="small" class="px-2 rating-chip">
                <v-icon
                  start
                  icon="mdi-play-circle-outline"
                  size="14"
                  color="white"
                  class="mr-1"
                ></v-icon>
                <span class="font-weight-bold">En cours</span>
              </v-chip>
              <v-chip v-if="userMovie.status === 'TO_WATCH'" size="small" class="px-2 rating-chip">
                <v-icon
                  start
                  icon="mdi-clock-outline"
                  size="14"
                  color="white"
                  class="mr-1"
                ></v-icon>
                <span class="font-weight-bold">A voir</span>
              </v-chip>
            </div>
          </v-img>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.v-card {
  transition: transform 0.2s ease-in-out;
  cursor: pointer;
}

.v-card:hover {
  transform: scale(1.03);
}

.rating-chip {
  background: rgba(0, 0, 0, 0.6) !important;
  color: white !important;
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
</style>