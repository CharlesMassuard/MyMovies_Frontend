<script setup>
    import { ref, onMounted } from 'vue';

    const apiPath = import.meta.env.VITE_API_BASE_URL;

    const trendingMovies = ref([]);
    const inTheaterMovies = ref([]);

    const fetchTrendingMovies = async () => {
        try {
            const response = await fetch(`${apiPath}/movies/trending`);
            const data = await response.json();
            trendingMovies.value = data.results;
            console.log("Trending Movies:", trendingMovies.value);
        } catch (error) {
            console.error('Error fetching trending movies:', error);
        }
    };

    const fetchInTheaterMovies = async () => {
        try {
            const response = await fetch(`${apiPath}/movies/in-theater`);
            const data = await response.json();
            inTheaterMovies.value = data.results;
        } catch (error) {
            console.error('Error fetching in-theater movies:', error);
        }
    };

    onMounted(() => {
        fetchTrendingMovies();
        fetchInTheaterMovies();
    });
</script>

<template>
  <v-container fluid class="pa-0">
    <div class="py-8">
      
      <h2 class="text-h5 font-weight-bold mb-4 px-4">Les Tendances</h2>

      <v-slide-group :show-arrows="false" class="full-width-slide">
        <v-slide-group-item v-for="movie in trendingMovies" :key="movie.id">
          <v-card
            class="ma-2 movie-card"
            rounded="xl"
            width="200"
            v-tooltip="{ text: movie.title, openDelay: 500, location: 'bottom' }"
          >
            <v-img
              :src="`https://image.tmdb.org/t/p/w500${movie.poster_path}`"
              cover
              aspect-ratio="2/3"
            ></v-img>
          </v-card>
        </v-slide-group-item>
      </v-slide-group>

    </div>
  </v-container>
</template>

<style scoped>
    .full-width-slide {
        width: 100vw;
    }

    .movie-card {
        transition: transform 0.2s;
        cursor: pointer;
    }

    .movie-card:hover {
        transform: scale(1.05);
    }

    :deep(.v-slide-group__content) {
        padding: 0 10px;
    }

    :deep(.v-slide-group__prev),
    :deep(.v-slide-group__next) {
        display: none !important;
    }
</style>