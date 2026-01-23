<script setup>
    import { ref, computed, onMounted } from 'vue';
    import axios from 'axios';
    import noPoster from '../assets/noPosterAvailable.webp';

    const apiPath = import.meta.env.VITE_API_BASE_URL;

    const dayTrendingMovies = ref([]);
    const popularMovies = ref([]);
    const inTheaterMovies = ref([]);

    const sliderTrending = ref(null);
    const sliderPopular = ref(null);
    const sliderInTheater = ref(null);

    const scroll = (ref, direction) => {
        const el = ref.$el.querySelector('.v-slide-group__container');
        const scrollAmount = 500;
        el.scrollBy({ left: direction === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    };

    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = String(date.getMonth() + 1).padStart(2, '0');
    const currentDay = String(date.getDate()).padStart(2, '0');
    const currentDateString = `${currentYear}-${currentMonth}-${currentDay}`;

    const filteredInTheaterMovies = computed(() => {
        return inTheaterMovies.value.filter(movie => movie.release_date <= currentDateString);
    });

    const fetchDayTrending = async () => {
        try {
            const response = await axios.get(`${apiPath}/movies/trending/day`);
            dayTrendingMovies.value = response.data.results;
        } catch (error) {
            console.error('Error fetching day trending movies:', error);
        }
    };

    const fetchPopularMovies = async () => {
        try {
            const response = await axios.get(`${apiPath}/movies/trending`);
            popularMovies.value = response.data.results;
        } catch (error) {
            console.error('Error fetching trending movies:', error);
        }
    };

    const fetchInTheaterMovies = async () => {
        try {
            const response = await axios.get(`${apiPath}/movies/in-theater`);
            inTheaterMovies.value = response.data.results;
        } catch (error) {
            console.error('Error fetching in-theater movies:', error);
        }
    };

    onMounted(() => {
        fetchDayTrending();
        fetchPopularMovies();
        fetchInTheaterMovies();
    });
</script>

<template>
  <v-container fluid class="pa-0">
    <div class="py-8">
      <div class="d-flex align-center justify-space-between section-header">
        <h1 class="text-h5 font-weight-bold mb-2 section-title">Tendances du jour</h1>
        <div class="navigation-arrows">
          <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderTrending, 'prev')"></v-btn>
          <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderTrending, 'next')"></v-btn>
        </div>
      </div>

      <v-slide-group ref="sliderTrending" :show-arrows="false" class="full-width-slide">
        <v-slide-group-item v-for="(movie, index) in dayTrendingMovies" :key="movie.id">
          <div class="card-container ma-4">
            <div class="border-wrapper">
              <v-card
                class="movie-card"
                rounded="l"
                width="150"
                flat
                v-tooltip="{ text: movie.title, openDelay: 500, location: 'bottom' }"
                @click="$router.push(`/movie/${movie.id}`)"
              >
                <v-img
                  :src="movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : noPoster"
                  cover
                  aspect-ratio="2/3"
                  class="movie-img"
                ></v-img>
              </v-card>
            </div>
            <span class="ranking-number">{{ index + 1 }}</span>
          </div>
        </v-slide-group-item>
      </v-slide-group>
    </div>

    <div class="pb-8">
      <div class="d-flex align-center justify-space-between section-header">
        <h1 class="text-h5 font-weight-bold mb-2 section-title">Populaires</h1>
        <div class="navigation-arrows">
          <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderPopular, 'prev')"></v-btn>
          <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderPopular, 'next')"></v-btn>
        </div>
      </div>

      <v-slide-group ref="sliderPopular" :show-arrows="false" class="full-width-slide">
        <v-slide-group-item v-for="(movie, index) in popularMovies" :key="movie.id">
          <div class="card-container ma-4">
            <div class="border-wrapper">
              <v-card
                class="movie-card"
                rounded="l"
                width="150"
                flat
                v-tooltip="{ text: movie.title, openDelay: 500, location: 'bottom' }"
                @click="$router.push(`/movie/${movie.id}`)"
              >
                <v-img
                  :src="movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : noPoster"
                  cover
                  aspect-ratio="2/3"
                  class="movie-img"
                ></v-img>
              </v-card>
            </div>
            <span class="ranking-number">{{ index + 1 }}</span>
          </div>
        </v-slide-group-item>
      </v-slide-group>
    </div>

    <div>
      <div class="d-flex align-center justify-space-between section-header">
        <h1 class="text-h5 font-weight-bold mb-2 section-title" title="Films sortis depuis 40 jours">En Salles</h1>
        <div class="navigation-arrows">
          <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderInTheater, 'prev')"></v-btn>
          <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderInTheater, 'next')"></v-btn>
        </div>
      </div>

      <v-slide-group ref="sliderInTheater" :show-arrows="false" class="full-width-slide">
        <v-slide-group-item v-for="(movie, index) in filteredInTheaterMovies" :key="movie.id">
          <div class="card-container ma-4">
            <div class="border-wrapper">
              <v-card
                class="movie-card"
                rounded="l"
                width="150"
                flat
                v-tooltip="{ text: movie.title, openDelay: 500, location: 'bottom' }"
                @click="$router.push(`/movie/${movie.id}`)"
              >
                <v-img
                  :src="movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : noPoster"
                  cover
                  aspect-ratio="2/3"
                  class="movie-img"
                ></v-img>
              </v-card>
            </div>
            <span class="ranking-number">{{ index + 1 }}</span>
          </div>
        </v-slide-group-item>
      </v-slide-group>
    </div>
  </v-container>
</template>

<style scoped>
    .full-width-slide {
        margin-left: 30px;
        width: 95.5vw;
    }

    .section-header {
        width: 95.5vw;
        margin-left: 30px;
    }

    .navigation-arrows {
        display: flex;
        gap: 4px;
        margin-bottom: 10px;
    }

    .section-title {
        position: relative;
        padding-bottom: 15px;
        display: inline-block;
        margin-left: 0 !important;
    }

    .section-title::after {
        content: "";
        position: absolute;
        bottom: 0;
        left: 0; 
        width: 95.5vw; 
        height: 2px;
        background-color: #ebebeb;
    }

    .card-container {
        position: relative;
        padding-bottom: 10px;
    }

    .border-wrapper {
        border: 4px solid #ffffff;
        border-radius: 20px;
        overflow: hidden;
        width: fit-content;
        z-index: 1;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    }

    .movie-card {
        cursor: pointer;
        background: transparent;
    }
    .movie-img {
        transition: transform 0.3s ease;
        width: 150px;
        height: 225px;
    }

    .movie-card:hover .movie-img {
        transform: scale(1.1);
    }

    .ranking-number {
        position: absolute;
        bottom: -10px;
        left: -25px;
        font-size: 6rem;
        font-weight: 900;
        line-height: 1;
        z-index: 2;
        color: #e1e1e1;
        text-shadow: 2px 2px 10px rgba(0,0,0,0.3);
        -webkit-text-stroke: 4px #ffffff;
        user-select: none;
        pointer-events: none;
    }

    :deep(.v-slide-group__content) {
        padding: 0 10px;
    }

    :deep(.v-slide-group__prev),
    :deep(.v-slide-group__next) {
        display: none !important;
    }
</style>