<script setup>
    import { ref, computed, onMounted, watch } from 'vue';
    import axios from 'axios';
    import noPoster from '../assets/noPosterAvailable.webp';

    const apiPath = import.meta.env.VITE_API_BASE_URL;

    //Filtre principal
    const mediaType = ref('all');

    const dayTrendingMovies = ref([]);
    const popularMovies = ref([]);
    const inTheaterMovies = ref([]);

    const dayTrendingSeries = ref([]);
    const popularSeries = ref([]);

    const sliderTrending = ref(null);
    const sliderPopular = ref(null);
    const sliderInTheater = ref(null);

    const scroll = (sliderRef, direction) => {
        if (!sliderRef || !sliderRef.$el) return;
        const el = sliderRef.$el.querySelector('.v-slide-group__container');
        if (!el) return;
        const scrollAmount = 500;
        el.scrollBy({ left: direction === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    };

    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = String(date.getMonth() + 1).padStart(2, '0');
    const currentDay = String(date.getDate()).padStart(2, '0');
    const currentDateString = `${currentYear}-${currentMonth}-${currentDay}`;

    //Fusion et tri dynamique selon le filtre
    const currentTrending = computed(() => {
        if (mediaType.value === 'movie') return dayTrendingMovies.value;
        if (mediaType.value === 'serie') return dayTrendingSeries.value;
        return [...dayTrendingMovies.value, ...dayTrendingSeries.value].sort((a, b) => b.popularity - a.popularity);
    });

    const currentPopular = computed(() => {
        if (mediaType.value === 'movie') return popularMovies.value;
        if (mediaType.value === 'serie') return popularSeries.value;
        return [...popularMovies.value, ...popularSeries.value].sort((a, b) => b.popularity - a.popularity);
    });
    
    const filteredInTheaterMovies = computed(() => {
        return inTheaterMovies.value.filter(movie => movie.release_date <= currentDateString);
    });

    //Ajout d'un tag media_type
    const fetchMovies = async () => {
        try {
            const [trendingRes, popularRes, inTheaterRes] = await Promise.all([
                axios.get(`${apiPath}/movies/trending/day`),
                axios.get(`${apiPath}/movies/trending`),
                axios.get(`${apiPath}/movies/in-theater`)
            ]);
            dayTrendingMovies.value = trendingRes.data.results.map(m => ({ ...m, media_type: 'movie' }));
            popularMovies.value = popularRes.data.results.map(m => ({ ...m, media_type: 'movie' }));
            inTheaterMovies.value = inTheaterRes.data.results.map(m => ({ ...m, media_type: 'movie' }));
        } catch (error) {
            console.error('Error fetching movies:', error);
        }
    };

    const fetchSeries = async () => {
        try {
            const [trendingRes, popularRes] = await Promise.all([
                axios.get(`${apiPath}/series/trending/day`),
                axios.get(`${apiPath}/series/trending`)
            ]);
            dayTrendingSeries.value = trendingRes.data.results.map(s => ({ ...s, media_type: 'serie' }));
            popularSeries.value = popularRes.data.results.map(s => ({ ...s, media_type: 'serie' }));
        } catch (error) {
            console.error('Error fetching series:', error);
        }
    };

    //Remise à zéro du scroll
    watch(mediaType, () => {
        setTimeout(() => {
            const sliders = [sliderTrending.value, sliderPopular.value, sliderInTheater.value];
            sliders.forEach(slider => {
                if (slider && slider.$el) {
                    const el = slider.$el.querySelector('.v-slide-group__container');
                    if (el) el.scrollTo({ left: 0, behavior: 'smooth' });
                }
            });
        }, 100);
    });

    onMounted(() => {
        fetchMovies();
        fetchSeries();
    });
</script>

<template>
  <v-container fluid class="pa-0">
    
    <div class="d-flex justify-end pt-6 px-8 toggle-container">
      <v-btn-toggle
        v-model="mediaType"
        color="#8C52FF"
        mandatory
        rounded="xl"
        variant="outlined"
        density="compact"
        class="bg-white"
      >
        <v-btn value="all" class="text-none font-weight-bold px-6">Général</v-btn>
        <v-btn value="movie" class="text-none font-weight-bold px-6">Films</v-btn>
        <v-btn value="serie" class="text-none font-weight-bold px-6">Séries</v-btn>
      </v-btn-toggle>
    </div>

    <div class="pt-4 pb-8">
      <div class="d-flex align-center justify-space-between section-header">
        <h1 class="text-h5 font-weight-bold mb-2 section-title">Tendances du jour</h1>
        <div class="navigation-arrows">
          <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderTrending, 'prev')"></v-btn>
          <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderTrending, 'next')"></v-btn>
        </div>
      </div>

      <v-slide-group ref="sliderTrending" :show-arrows="false" class="full-width-slide">
        <v-slide-group-item v-for="(item, index) in currentTrending" :key="`trend-${item.media_type}-${item.id}`">
          <div class="card-container ma-4">
            <div class="border-wrapper relative">
              <v-card
                class="movie-card"
                rounded="l"
                width="150"
                flat
                v-tooltip="{ text: item.title || item.name, openDelay: 500, location: 'bottom' }"
                @click="$router.push(`/${item.media_type}/${item.id}`)"
              >
                <v-img
                  :src="item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : noPoster"
                  cover
                  aspect-ratio="2/3"
                  class="movie-img"
                ></v-img>
                
                <!--Badge sorti de l'image pour éviter le zoom-->
                <div v-if="mediaType === 'all'" class="badge-container pa-1">
                  <v-chip size="x-small" variant="flat" :color="item.media_type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                    {{ item.media_type === 'serie' ? 'Série' : 'Film' }}
                  </v-chip>
                </div>

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
        <v-slide-group-item v-for="(item, index) in currentPopular" :key="`pop-${item.media_type}-${item.id}`">
          <div class="card-container ma-4">
            <div class="border-wrapper">
              <v-card
                class="movie-card"
                rounded="l"
                width="150"
                flat
                v-tooltip="{ text: item.title || item.name, openDelay: 500, location: 'bottom' }"
                @click="$router.push(`/${item.media_type}/${item.id}`)"
              >
                <v-img
                  :src="item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : noPoster"
                  cover
                  aspect-ratio="2/3"
                  class="movie-img"
                ></v-img>

                <!--Badge sorti de l'image pour éviter le zoom-->
                <div v-if="mediaType === 'all'" class="badge-container pa-1">
                  <v-chip size="x-small" variant="flat" :color="item.media_type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                    {{ item.media_type === 'serie' ? 'Série' : 'Film' }}
                  </v-chip>
                </div>

              </v-card>
            </div>
            <span class="ranking-number">{{ index + 1 }}</span>
          </div>
        </v-slide-group-item>
      </v-slide-group>
    </div>

    <div v-if="mediaType === 'movie' || mediaType === 'all'" class="pb-8">
      <div class="d-flex align-center justify-space-between section-header">
        <h1 class="text-h5 font-weight-bold mb-2 section-title" title="Films sortis depuis 40 jours">En Salles</h1>
        <div class="navigation-arrows">
          <v-btn icon="mdi-chevron-left" variant="text" size="small" @click="scroll(sliderInTheater, 'prev')"></v-btn>
          <v-btn icon="mdi-chevron-right" variant="text" size="small" class="mr-n2" @click="scroll(sliderInTheater, 'next')"></v-btn>
        </div>
      </div>

      <v-slide-group ref="sliderInTheater" :show-arrows="false" class="full-width-slide">
        <v-slide-group-item v-for="(movie, index) in filteredInTheaterMovies" :key="`in-theater-${movie.id}`">
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

                <!--Badge sorti de l'image pour éviter le zoom-->
                <div v-if="mediaType === 'all'" class="badge-container pa-1">
                  <v-chip size="x-small" variant="flat" color="grey-darken-3" class="text-white font-weight-bold shadow-badge">
                    Film
                  </v-chip>
                </div>

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
    .toggle-container {
        padding-right: 30px;
    }

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
        position: relative;
    }

    .movie-img {
        transition: transform 0.3s ease;
        width: 150px;
        height: 225px;
    }

    .movie-card:hover .movie-img {
        transform: scale(1.1);
    }

    /*Positionnement fixe par dessus l'image*/
    .badge-container {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 10;
        pointer-events: none;
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

    .shadow-badge {
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }

    :deep(.v-slide-group__content) {
        padding: 0 10px;
    }

    :deep(.v-slide-group__prev),
    :deep(.v-slide-group__next) {
        display: none !important;
    }
</style>