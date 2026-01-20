<script setup>
  import { ref, computed, onMounted, watch } from 'vue';
  import { useRoute } from 'vue-router';
  import axios  from 'axios';
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const route = useRoute();
  const movieId = computed(() => route.params.id);
  const movieDetails = ref({});
  const movieCredits = ref({});
  
  const fetchDetailsMovies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/movies/${movieId.value}`);
      movieDetails.value = response.data;

      const creditsResponse = await axios.get(`${API_BASE_URL}/movies/${movieId.value}/credits`);
      movieCredits.value = creditsResponse.data;
      console.log(movieCredits.value);

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

  onMounted(() => {
    fetchDetailsMovies();
  });

  watch(() => movieId.value, () => {
    movieDetails.value = {};
    movieCredits.value = {};
    fetchDetailsMovies();
  });

  const releaseYear = computed(() => movieDetails.value.release_date ? movieDetails.value.release_date.slice(0, 4) : '');
  const primaryGenre = computed(() => {
    const genres = movieDetails.value.genres;
    return Array.isArray(genres) && genres.length ? genres[0].name : '';
  });

</script>

<template>
  <v-container fluid class="pt-15">
    <v-row justify="center" no-gutters>
      <v-col cols="12" md="11" class="d-flex flex-column flex-md-row">
        
        <div class="details">
          <div class="movie-main-details" v-if="movieDetails.title">
            <h1 class="text-h4 font-weight-bold mb-2 section-title">{{ movieDetails.title }}</h1>
            <p>{{ releaseYear }}   •   {{ primaryGenre }}   •   {{ movieDetails.runtimeFormatted }}</p>
            <div class="buttons-rate">
              <v-btn 
                rounded="xl" 
                color="#8C52FF" 
                variant="flat"
                :icon="$vuetify.display.smAndDown"
              >
                <v-icon :start="!$vuetify.display.smAndDown">mdi-plus</v-icon>
                <span>Ajouter à ma liste de lecture</span>
              </v-btn>
              <v-btn 
                rounded="xl" 
                color="black" 
                variant="outlined"
                :icon="$vuetify.display.smAndDown"
              >
                <v-icon :start="!$vuetify.display.smAndDown">mdi-star</v-icon>
                <span>Noter</span>
              </v-btn>
            </div>
          </div>

          <div v-if="movieDetails.overview" class="more-infos">
            <h6>Synopsis</h6>
            <p>{{ movieDetails.overview }}</p>
          </div>

          <div class="more-infos">
            <h6>Plus d'informations</h6>
            <p><strong>Réalisateur :</strong> {{ movieDetails.director || 'N/A' }}</p>
            <p><strong>Acteurs principaux :</strong> {{ movieDetails.main_actors ? movieDetails.main_actors.join(', ') : 'N/A' }}</p>
          </div>
        </div>

        <div class="img-section">
          <img 
            v-if="movieDetails.poster_path" 
            :src="`https://image.tmdb.org/t/p/w500${movieDetails.poster_path}`" 
            :alt="movieDetails.title" 
            class="movie-img"
          >
          <img 
            v-if="movieDetails.backdrop_path" 
            :src="`https://image.tmdb.org/t/p/w500${movieDetails.backdrop_path}`" 
            :alt="movieDetails.title" 
            class="movie-img"
          >
        </div>

      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
  .details {
    flex: 1;
  }

  .img-section {
    margin-left: 50px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 20px;
    width: 350px;
  }

  .movie-img {
    border-radius: 15px;
    max-width: 100%;
    height: auto;
  }

  .more-infos {
    margin-top: 20px;
    padding: 20px;
    line-height: 1.6;
    text-align: justify;
    border: 1px solid #e4e4e4;
    border-radius: 15px;
    display: flex;
    flex-direction: column;
    gap: 15px;
  }

  .more-infos h6 {
    font-weight: bold;
    color: #aaaaaa;
  }

  .movie-main-details p {
    color: gray;
    font-weight: bold;
  }

  .buttons-rate {
    margin-top: 15px;
    display: flex;
    gap: 15px;
    width: fit-content;
  }

  @media (max-width: 960px) {
    .img-section {
      margin-left: 0;
      margin-top: 30px;
      width: 100%;
    }
  }
</style>