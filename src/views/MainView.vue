<script setup>
    import { ref, computed, onMounted, watch, nextTick } from 'vue';
    import { useRouter } from 'vue-router';
    import axios from 'axios';
    import noPoster from '../assets/noPosterAvailable.webp';

    const router = useRouter();
    const apiPath = import.meta.env.VITE_API_BASE_URL;

    const mediaType = ref('all');
    const loadingData = ref(true);

    const dayTrendingMovies = ref([]);
    const popularMovies = ref([]);
    const inTheaterMovies = ref([]);
    const dayTrendingSeries = ref([]);
    const popularSeries = ref([]);
    const generalRecommendations = ref([]);
    const loadingRecs = ref(false);
    
    const userLibrary = ref([]);

    const sliderTrending = ref(null);
    const sliderPopular = ref(null);
    const sliderInTheater = ref(null);
    const sliderRecommendations = ref(null);

    const scroll = (sliderRef, direction) => {
        if (!sliderRef || !sliderRef.$el) return;
        const el = sliderRef.$el.querySelector('.v-slide-group__container');
        if (!el) return;
        const scrollAmount = 600;
        el.scrollBy({ left: direction === 'next' ? scrollAmount : -scrollAmount, behavior: 'smooth' });
    };

    const date = new Date();
    const currentYear = date.getFullYear();
    const currentMonth = String(date.getMonth() + 1).padStart(2, '0');
    const currentDay = String(date.getDate()).padStart(2, '0');
    const currentDateString = `${currentYear}-${currentMonth}-${currentDay}`;

    const spotlightItems = computed(() => {
        const combined = [...dayTrendingMovies.value, ...dayTrendingSeries.value];
        return combined.sort((a, b) => b.popularity - a.popularity).slice(0, 10);
    });

    const currentTrending = computed(() => {
        if (mediaType.value === 'movie') return [...dayTrendingMovies.value].sort((a, b) => b.popularity - a.popularity);
        if (mediaType.value === 'serie') return [...dayTrendingSeries.value].sort((a, b) => b.popularity - a.popularity);
        return [...dayTrendingMovies.value, ...dayTrendingSeries.value].sort((a, b) => b.popularity - a.popularity);
    });

    const currentPopular = computed(() => {
        if (mediaType.value === 'movie') return [...popularMovies.value].sort((a, b) => b.popularity - a.popularity);
        if (mediaType.value === 'serie') return [...popularSeries.value].sort((a, b) => b.popularity - a.popularity);
        return [...popularMovies.value, ...popularSeries.value].sort((a, b) => b.popularity - a.popularity);
    });
    
    const filteredInTheaterMovies = computed(() => {
        return inTheaterMovies.value.filter(movie => movie.release_date <= currentDateString);
    });

    const filteredRecommendations = computed(() => {
        if (mediaType.value === 'all') return generalRecommendations.value;
        return generalRecommendations.value.filter(item => item.type === mediaType.value);
    });

    const fetchMovies = async () => {
        const [trendingRes, popularRes, inTheaterRes] = await Promise.all([
            axios.get(`${apiPath}/movies/trending/day`),
            axios.get(`${apiPath}/movies/trending`),
            axios.get(`${apiPath}/movies/in-theater`)
        ]);
        dayTrendingMovies.value = trendingRes.data.results.map(m => ({ ...m, media_type: 'movie' }));
        popularMovies.value = popularRes.data.results.map(m => ({ ...m, media_type: 'movie' }));
        inTheaterMovies.value = inTheaterRes.data.results.map(m => ({ ...m, media_type: 'movie' }));
    };

    const fetchSeries = async () => {
        const [trendingRes, popularRes] = await Promise.all([
            axios.get(`${apiPath}/series/trending/day`),
            axios.get(`${apiPath}/series/trending`)
        ]);
        dayTrendingSeries.value = trendingRes.data.results.map(s => ({ ...s, media_type: 'serie' }));
        popularSeries.value = popularRes.data.results.map(s => ({ ...s, media_type: 'serie' }));
    };

    const fetchGeneralRecommendations = async (forceRefresh = false) => {
        const token = localStorage.getItem('user_token');
        if (!token) return;

        if (forceRefresh) loadingRecs.value = true;

        const response = await axios.get(`${apiPath}/recommendations/general`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { forceRefresh }
        });
        generalRecommendations.value = response.data;
        
        if (forceRefresh && sliderRecommendations.value?.$el) {
            const el = sliderRecommendations.value.$el.querySelector('.v-slide-group__container');
            if (el) el.scrollTo({ left: 0, behavior: 'smooth' });
        }
        loadingRecs.value = false;
    };
    
    const fetchUserLibrary = async () => {
        const token = localStorage.getItem('user_token');
        if (!token) return;
        try {
            const [moviesRes, seriesRes] = await Promise.all([
                axios.get(`${apiPath}/user/movies`, { headers: { Authorization: `Bearer ${token}` } }),
                axios.get(`${apiPath}/user/series`, { headers: { Authorization: `Bearer ${token}` } })
            ]);
            const m = moviesRes.data.map(i => ({ id: i.movie.id, type: 'movie', status: i.status }));
            const s = seriesRes.data.map(i => ({ id: i.serie.id, type: 'serie', status: i.status }));
            userLibrary.value = [...m, ...s];
        } catch (error) {
            console.error('Erreur récupération bibliothèque:', error);
        }
    };

    const preloadSpotlightImages = () => {
        spotlightItems.value.forEach(item => {
            const img = new Image();
            const url = item.backdrop_path 
                ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` 
                : (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : noPoster);
            img.src = url;
        });
    };

    const loadAllData = async () => {
        try {
            loadingData.value = true;
            await Promise.all([fetchMovies(), fetchSeries(), fetchGeneralRecommendations(), fetchUserLibrary()]);
            preloadSpotlightImages();
        } catch (error) {
            console.error('Erreur de chargement:', error);
        } finally {
            loadingData.value = false;
        }
    };

    const refreshRecommendations = () => {
        fetchGeneralRecommendations(true);
    };
    
    const getStatusInfo = (item) => {
        const type = item.media_type || item.type;
        const libItem = userLibrary.value.find(i => i.id === item.id && i.type === type);
        
        if (!libItem) {
            return { icon: 'mdi-plus', text: 'Ajouter à ma liste', btnColor: 'white', isOutlined: true, hasStatus: false };
        }
        
        switch(libItem.status) {
            case 'TO_WATCH': 
                return { icon: 'mdi-clock-outline', text: 'À voir', btnColor: 'white', isOutlined: false, hasStatus: true };
            case 'WATCHING': 
                return { icon: 'mdi-play-circle-outline', text: 'En cours', btnColor: 'info', isOutlined: false, hasStatus: true };
            case 'WATCHED': 
                return { icon: 'mdi-check-all', text: 'Vu', btnColor: 'success', isOutlined: false, hasStatus: true };
            default: 
                return { icon: 'mdi-plus', text: 'Ajouter à ma liste', btnColor: 'white', isOutlined: true, hasStatus: false };
        }
    };
    
    const addToWatchlist = async (item, event) => {
        if (event) event.stopPropagation();
        
        const type = item.media_type || item.type;
        const existing = userLibrary.value.find(i => i.id === item.id && i.type === type);
        
        //Bloquer-si-déjà-dans-la-liste
        if (existing) return;

        const token = localStorage.getItem('user_token');
        if (!token) {
            alert("Veuillez vous connecter pour ajouter à votre liste.");
            return;
        }
        
        const route = type === 'serie' ? `/user/series/to-watch/${item.id}` : `/user/movies/to-watch/${item.id}`;
        
        try {
            await axios.post(`${apiPath}${route}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            
            userLibrary.value.push({ id: item.id, type, status: 'TO_WATCH' });
        } catch (error) {
            console.error('Erreur lors de l\'ajout :', error);
        }
    };

    watch(mediaType, async () => {
        await nextTick();
        const sliders = [sliderTrending.value, sliderPopular.value, sliderInTheater.value, sliderRecommendations.value];
        sliders.forEach(slider => {
            if (slider?.$el) {
                const el = slider.$el.querySelector('.v-slide-group__container');
                if (el) el.scrollTo({ left: 0, behavior: 'smooth' });
            }
        });
    });

    onMounted(() => {
        loadAllData();
    });
</script>

<template>
  <v-container fluid class="pa-0 pt-6">
    
    <div v-if="loadingData" class="px-8">
        <v-skeleton-loader type="image" height="350" class="mb-10 rounded-xl"></v-skeleton-loader>
        <div v-for="i in 2" :key="`skel-section-${i}`" class="mb-10">
            <v-skeleton-loader type="heading" width="250" class="mb-4"></v-skeleton-loader>
            <div class="d-flex overflow-hidden">
                <v-skeleton-loader v-for="n in 6" :key="`skel-card-${n}`" type="image" width="150" height="225" class="ma-2 rounded-xl"></v-skeleton-loader>
            </div>
        </div>
    </div>

    <div v-else>
      
      <!--Carrousel-A-La-Une-->
      <div v-if="spotlightItems.length > 0" class="px-4 px-md-8 mb-6">
          <v-carousel
            cycle
            interval="10000"
            height="350"
            hide-delimiter-background
            show-arrows="hover"
            class="spotlight-carousel rounded-xl elevation-4"
          >
            <v-carousel-item
              v-for="item in spotlightItems"
              :key="`spotlight-${item.id}`"
              @click="$router.push(`/${item.media_type}/${item.id}`)"
            >
              <v-img 
                :src="item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : (item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : noPoster)"
                cover
                height="100%"
              >
                  <div class="d-flex align-center h-100 pa-6 pa-md-10">
                      <div class="spotlight-glass-panel text-white pa-6 rounded-xl elevation-10">
                          <div class="d-flex align-center mb-3 ga-3">
                              <div class="a-la-une-tag rounded-pill px-3 py-1">
                                  À LA UNE
                              </div>
                              <v-chip size="small" color="white" variant="flat" class="font-weight-bold text-black shadow-badge">
                                <v-icon start icon="mdi-star" size="14" color="amber-darken-2"></v-icon>
                                {{ Math.round(item.vote_average * 10) / 10 }}
                              </v-chip>
                          </div>
                          
                          <h2 class="text-h4 text-md-h3 font-weight-black mb-3 text-truncate-2">
                              {{ item.title || item.name }}
                          </h2>
                          
                          <p class="text-body-2 mb-4 text-truncate-3 opacity-90 d-none d-sm-box" style="max-width: 450px;">
                              {{ item.overview || 'Aucune description disponible pour le moment.' }}
                          </p>
                          
                          <div class="d-flex ga-3 mt-4">
                              <v-btn 
                                color="white" 
                                variant="flat" 
                                rounded="lg" 
                                class="text-black font-weight-bold px-6 text-none no-focus hover-scale" 
                                :ripple="false"
                                @click.stop="$router.push(`/${item.media_type}/${item.id}`)"
                              >
                                  <v-icon start>mdi-play</v-icon> Détails
                              </v-btn>
                              <v-btn 
                                :color="getStatusInfo(item).btnColor" 
                                :variant="getStatusInfo(item).isOutlined ? 'outlined' : 'flat'" 
                                rounded="lg" 
                                class="glass-btn text-none font-weight-bold px-4 no-focus" 
                                :class="{'hover-scale': !getStatusInfo(item).hasStatus}"
                                :ripple="false"
                                @click.stop="addToWatchlist(item, $event)"
                                :style="{ cursor: getStatusInfo(item).hasStatus ? 'default' : 'pointer' }"
                              >
                                  <v-icon start :color="getStatusInfo(item).isOutlined ? 'white' : 'black'">{{ getStatusInfo(item).icon }}</v-icon>
                                  <span :class="getStatusInfo(item).isOutlined ? 'text-white' : 'text-black'">{{ getStatusInfo(item).text }}</span>
                              </v-btn>
                          </div>
                      </div>
                  </div>
              </v-img>
            </v-carousel-item>
          </v-carousel>
      </div>

      <div class="d-flex justify-end px-8 mb-6 toggle-container">
          <v-btn-toggle
              v-model="mediaType"
              color="#8C52FF"
              mandatory
              rounded="xl"
              variant="outlined"
              density="compact"
              class="bg-white filter-toggle"
          >
              <v-btn value="all" class="text-none font-weight-bold px-6">Général</v-btn>
              <v-btn value="movie" class="text-none font-weight-bold px-6">Films</v-btn>
              <v-btn value="serie" class="text-none font-weight-bold px-6">Séries</v-btn>
          </v-btn-toggle>
      </div>

      <!--Section-Recommandations-->
      <div v-if="filteredRecommendations.length > 0" class="pb-8 slider-wrapper">
        <div class="d-flex align-center justify-space-between section-header">
          <h1 class="text-h5 font-weight-bold mb-2 section-title d-flex align-center">
            <v-icon color="#8C52FF" class="mr-2" size="28">mdi-star-shooting</v-icon>
            Recommandé pour vous
            <v-btn icon="mdi-refresh" variant="text" size="small" color="#8C52FF" class="ml-2 no-focus hover-scale" :ripple="false" :loading="loadingRecs" @click="refreshRecommendations"></v-btn>
          </h1>
        </div>

        <div class="slider-container">
            <div class="nav-arrow-left" @click="scroll(sliderRecommendations, 'prev')">
                <v-icon size="x-large" color="white">mdi-chevron-left</v-icon>
            </div>
            <div class="nav-arrow-right" @click="scroll(sliderRecommendations, 'next')">
                <v-icon size="x-large" color="white">mdi-chevron-right</v-icon>
            </div>

            <v-slide-group ref="sliderRecommendations" :show-arrows="false" class="full-width-slide">
              <v-slide-group-item v-for="item in filteredRecommendations" :key="`rec-item-${item.type}-${item.id}`">
                <div class="card-container ma-4">
                  <div class="border-wrapper">
                    <v-card class="movie-card" rounded="l" width="150" flat @click="$router.push(`/${item.type}/${item.id}`)">
                      <v-img :src="item.posterPath ? `https://image.tmdb.org/t/p/w500${item.posterPath}` : noPoster" cover aspect-ratio="2/3" class="movie-img"></v-img>

                      <div v-if="mediaType === 'all'" class="badge-container pa-1">
                        <v-chip size="x-small" variant="flat" :color="item.type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                          {{ item.type === 'serie' ? 'Série' : 'Film' }}
                        </v-chip>
                      </div>

                      <div class="badge-container-bottom pa-1" v-if="item.voteAverage">
                        <v-chip size="x-small" color="black" variant="flat" class="text-white font-weight-bold shadow-badge opacity-90">
                          <v-icon start icon="mdi-star" size="12" color="amber"></v-icon>
                          {{ Math.round(item.voteAverage * 10) / 10 }}
                        </v-chip>
                      </div>

                      <div class="quick-actions-overlay d-flex flex-column align-center justify-center ga-3">
                          <v-btn 
                            icon="mdi-play" 
                            color="white" 
                            variant="flat" 
                            density="comfortable" 
                            class="elevation-4 no-focus hover-scale" 
                            :ripple="false" 
                            v-tooltip="'Détails'" 
                            @click.stop="$router.push(`/${item.type}/${item.id}`)"
                          ></v-btn>
                          <v-btn 
                            :icon="getStatusInfo(item).icon" 
                            :color="getStatusInfo(item).btnColor" 
                            :variant="getStatusInfo(item).isOutlined ? 'outlined' : 'flat'" 
                            density="comfortable" 
                            class="no-focus" 
                            :class="{
                                'quick-btn-border': getStatusInfo(item).isOutlined,
                                'hover-scale': !getStatusInfo(item).hasStatus
                            }"
                            :ripple="false"
                            v-tooltip="getStatusInfo(item).text" 
                            @click.stop="addToWatchlist(item, $event)"
                            :style="{ cursor: getStatusInfo(item).hasStatus ? 'default' : 'pointer' }"
                          ></v-btn>
                      </div>
                    </v-card>
                  </div>
                </div>
              </v-slide-group-item>
            </v-slide-group>
        </div>
      </div>

      <!--Section-Tendances-->
      <div class="pb-8 slider-wrapper">
        <div class="d-flex align-center justify-space-between section-header">
          <h1 class="text-h5 font-weight-bold mb-2 section-title">Tendances du jour</h1>
        </div>

        <div class="slider-container">
            <div class="nav-arrow-left" @click="scroll(sliderTrending, 'prev')">
                <v-icon size="x-large" color="white">mdi-chevron-left</v-icon>
            </div>
            <div class="nav-arrow-right" @click="scroll(sliderTrending, 'next')">
                <v-icon size="x-large" color="white">mdi-chevron-right</v-icon>
            </div>

            <v-slide-group ref="sliderTrending" :show-arrows="false" class="full-width-slide pt-4">
              <v-slide-group-item v-for="(item, index) in currentTrending" :key="`trend-${item.media_type}-${item.id}`">
                <div class="card-container ma-4 mt-0">
                  <div class="border-wrapper">
                    <v-card class="movie-card" rounded="l" width="150" flat @click="$router.push(`/${item.media_type}/${item.id}`)">
                      <v-img :src="item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : noPoster" cover aspect-ratio="2/3" class="movie-img"></v-img>
                      
                      <div v-if="mediaType === 'all'" class="badge-container pa-1">
                        <v-chip size="x-small" variant="flat" :color="item.media_type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                          {{ item.media_type === 'serie' ? 'Série' : 'Film' }}
                        </v-chip>
                      </div>

                      <div class="quick-actions-overlay d-flex flex-column align-center justify-center ga-3">
                          <v-btn 
                            icon="mdi-play" 
                            color="white" 
                            variant="flat" 
                            density="comfortable" 
                            class="elevation-4 no-focus hover-scale" 
                            :ripple="false" 
                            v-tooltip="'Détails'" 
                            @click.stop="$router.push(`/${item.media_type}/${item.id}`)"
                          ></v-btn>
                          <v-btn 
                            :icon="getStatusInfo(item).icon" 
                            :color="getStatusInfo(item).btnColor" 
                            :variant="getStatusInfo(item).isOutlined ? 'outlined' : 'flat'" 
                            density="comfortable" 
                            class="no-focus" 
                            :class="{
                                'quick-btn-border': getStatusInfo(item).isOutlined,
                                'hover-scale': !getStatusInfo(item).hasStatus
                            }"
                            :ripple="false"
                            v-tooltip="getStatusInfo(item).text" 
                            @click.stop="addToWatchlist(item, $event)"
                            :style="{ cursor: getStatusInfo(item).hasStatus ? 'default' : 'pointer' }"
                          ></v-btn>
                      </div>
                    </v-card>
                  </div>
                  <span v-if="index < 10" class="ranking-number">{{ index + 1 }}</span>
                </div>
              </v-slide-group-item>
            </v-slide-group>
        </div>
      </div>

      <!--Section-Populaires-->
      <div class="pb-8 slider-wrapper">
        <div class="d-flex align-center justify-space-between section-header">
          <h1 class="text-h5 font-weight-bold mb-2 section-title">Populaires</h1>
        </div>

        <div class="slider-container">
            <div class="nav-arrow-left" @click="scroll(sliderPopular, 'prev')">
                <v-icon size="x-large" color="white">mdi-chevron-left</v-icon>
            </div>
            <div class="nav-arrow-right" @click="scroll(sliderPopular, 'next')">
                <v-icon size="x-large" color="white">mdi-chevron-right</v-icon>
            </div>

            <v-slide-group ref="sliderPopular" :show-arrows="false" class="full-width-slide">
              <v-slide-group-item v-for="(item, index) in currentPopular" :key="`pop-${item.media_type}-${item.id}`">
                <div class="card-container ma-4">
                  <div class="border-wrapper">
                    <v-card class="movie-card" rounded="l" width="150" flat @click="$router.push(`/${item.media_type}/${item.id}`)">
                      <v-img :src="item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : noPoster" cover aspect-ratio="2/3" class="movie-img"></v-img>

                      <div v-if="mediaType === 'all'" class="badge-container pa-1">
                        <v-chip size="x-small" variant="flat" :color="item.media_type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                          {{ item.media_type === 'serie' ? 'Série' : 'Film' }}
                        </v-chip>
                      </div>

                      <div class="quick-actions-overlay d-flex flex-column align-center justify-center ga-3">
                          <v-btn 
                            icon="mdi-play" 
                            color="white" 
                            variant="flat" 
                            density="comfortable" 
                            class="elevation-4 no-focus hover-scale" 
                            :ripple="false" 
                            v-tooltip="'Détails'" 
                            @click.stop="$router.push(`/${item.media_type}/${item.id}`)"
                          ></v-btn>
                          <v-btn 
                            :icon="getStatusInfo(item).icon" 
                            :color="getStatusInfo(item).btnColor" 
                            :variant="getStatusInfo(item).isOutlined ? 'outlined' : 'flat'" 
                            density="comfortable" 
                            class="no-focus" 
                            :class="{
                                'quick-btn-border': getStatusInfo(item).isOutlined,
                                'hover-scale': !getStatusInfo(item).hasStatus
                            }"
                            :ripple="false"
                            v-tooltip="getStatusInfo(item).text" 
                            @click.stop="addToWatchlist(item, $event)"
                            :style="{ cursor: getStatusInfo(item).hasStatus ? 'default' : 'pointer' }"
                          ></v-btn>
                      </div>
                    </v-card>
                  </div>
                </div>
              </v-slide-group-item>
            </v-slide-group>
        </div>
      </div>

      <!--Section-En-Salles-->
      <div v-if="mediaType === 'movie' || mediaType === 'all'" class="pb-8 slider-wrapper">
        <div class="d-flex align-center justify-space-between section-header">
          <h1 class="text-h5 font-weight-bold mb-2 section-title" title="Films sortis depuis 40 jours">En Salles</h1>
        </div>

        <div class="slider-container">
            <div class="nav-arrow-left" @click="scroll(sliderInTheater, 'prev')">
                <v-icon size="x-large" color="white">mdi-chevron-left</v-icon>
            </div>
            <div class="nav-arrow-right" @click="scroll(sliderInTheater, 'next')">
                <v-icon size="x-large" color="white">mdi-chevron-right</v-icon>
            </div>

            <v-slide-group ref="sliderInTheater" :show-arrows="false" class="full-width-slide">
              <v-slide-group-item v-for="(movie, index) in filteredInTheaterMovies" :key="`in-theater-${movie.id}`">
                <div class="card-container ma-4">
                  <div class="border-wrapper">
                    <v-card class="movie-card" rounded="l" width="150" flat @click="$router.push(`/movie/${movie.id}`)">
                      <v-img :src="movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : noPoster" cover aspect-ratio="2/3" class="movie-img"></v-img>

                      <div v-if="mediaType === 'all'" class="badge-container pa-1">
                        <v-chip size="x-small" variant="flat" color="grey-darken-3" class="text-white font-weight-bold shadow-badge">Film</v-chip>
                      </div>

                      <div class="quick-actions-overlay d-flex flex-column align-center justify-center ga-3">
                          <v-btn 
                            icon="mdi-play" 
                            color="white" 
                            variant="flat" 
                            density="comfortable" 
                            class="elevation-4 no-focus hover-scale" 
                            :ripple="false" 
                            v-tooltip="'Détails'" 
                            @click.stop="$router.push(`/movie/${movie.id}`)"
                          ></v-btn>
                          <v-btn 
                            :icon="getStatusInfo(movie).icon" 
                            :color="getStatusInfo(movie).btnColor" 
                            :variant="getStatusInfo(movie).isOutlined ? 'outlined' : 'flat'" 
                            density="comfortable" 
                            class="no-focus" 
                            :class="{
                                'quick-btn-border': getStatusInfo(movie).isOutlined,
                                'hover-scale': !getStatusInfo(movie).hasStatus
                            }"
                            :ripple="false"
                            v-tooltip="getStatusInfo(movie).text" 
                            @click.stop="addToWatchlist(movie, $event)"
                            :style="{ cursor: getStatusInfo(movie).hasStatus ? 'default' : 'pointer' }"
                          ></v-btn>
                      </div>
                    </v-card>
                  </div>
                </div>
              </v-slide-group-item>
            </v-slide-group>
        </div>
      </div>
    </div>
  </v-container>
</template>

<style scoped>
    .filter-toggle {
        box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
    }
    
    /*Désactivation-des-bordures/carrés-gris-natifs-de-Vuetify*/
    .no-focus::after,
    .no-focus:focus-visible::after,
    .no-focus:focus::after {
        opacity: 0 !important;
        display: none !important;
    }
    .no-focus .v-btn__overlay,
    .no-focus .v-btn__underlay {
        opacity: 0 !important;
        background: transparent !important;
        display: none !important;
    }
    .no-focus {
        transition: transform 0.2s ease;
    }
    
    /*Classe-spécifique-pour-le-zoom-au-survol-(seulement-quand-activé)*/
    .hover-scale:hover {
        transform: scale(1.08);
    }

    .spotlight-carousel {
        cursor: pointer;
        transition: box-shadow 0.3s ease;
    }
    .spotlight-carousel:hover {
        box-shadow: 0 12px 28px rgba(0,0,0,0.3) !important;
    }
    .spotlight-carousel :deep(.v-img__img) {
        transition: transform 1s cubic-bezier(0.25, 1, 0.5, 1);
    }
    .spotlight-carousel:hover :deep(.v-img__img) {
        transform: scale(1.02);
    }

    .spotlight-glass-panel {
        background: rgba(0, 0, 0, 0.45);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        border: 1px solid rgba(255, 255, 255, 0.1);
        max-width: 550px;
    }

    .glass-btn {
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(5px);
        border: 1px solid rgba(255,255,255,0.4) !important;
    }
    
    .a-la-une-tag {
        background: linear-gradient(135deg, #8C52FF 0%, #FF528C 100%);
        color: white;
        font-size: 0.75rem;
        font-weight: 900;
        letter-spacing: 1px;
        box-shadow: 0 4px 15px rgba(140, 82, 255, 0.4);
    }

    .text-truncate-2 {
        display: -webkit-box;
        -webkit-line-clamp: 2;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }
    .text-truncate-3 {
        display: -webkit-box;
        -webkit-line-clamp: 3;
        -webkit-box-orient: vertical;
        overflow: hidden;
    }

    .slider-wrapper {
        position: relative;
    }
    .slider-container {
        position: relative;
    }

    .nav-arrow-left, .nav-arrow-right {
        position: absolute;
        top: 0;
        bottom: 30px;
        width: 60px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        z-index: 20;
        opacity: 0;
        transition: opacity 0.3s ease, background 0.3s ease;
    }
    .nav-arrow-left {
        left: 0;
        background: linear-gradient(to right, rgba(255,255,255,0.9) 0%, transparent 100%);
    }
    .nav-arrow-right {
        right: 0;
        background: linear-gradient(to left, rgba(255,255,255,0.9) 0%, transparent 100%);
    }

    .slider-container:hover .nav-arrow-left, 
    .slider-container:hover .nav-arrow-right {
        opacity: 1;
    }

    .nav-arrow-left .v-icon, .nav-arrow-right .v-icon {
        color: rgba(0,0,0,0.7) !important;
        background: rgba(255,255,255,0.5);
        border-radius: 50%;
        padding: 5px;
    }

    .full-width-slide {
        margin-left: 30px;
        width: 95.5vw;
    }

    .section-header {
        width: 95.5vw;
        margin-left: 30px;
    }

    .section-title {
        position: relative;
        padding-bottom: 15px;
        display: inline-flex;
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
    }

    .v-slide-group-item:first-child .card-container {
        margin-left: 20px !important;
    }

    /*Ajout-de-transform-et-backface-visibility-pour-corriger-le-trait-gris-lié-au-blur*/
    .border-wrapper {
        border: 4px solid #ffffff;
        border-radius: 20px;
        overflow: hidden;
        width: fit-content;
        z-index: 1;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
        position: relative;
        transform: translateZ(0);
    }

    .movie-card {
        cursor: pointer;
        background: #000;
        position: relative;
    }

    .movie-img {
        transition: transform 0.3s ease, filter 0.3s ease;
        width: 150px;
        height: 225px;
        backface-visibility: hidden;
        transform-style: preserve-3d;
    }

    .quick-actions-overlay {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.6);
        opacity: 0;
        transition: opacity 0.3s ease;
        z-index: 15;
    }
    
    .quick-btn-border {
        border: 2px solid white !important;
    }

    .movie-card:hover .movie-img {
        transform: scale(1.1) translateZ(0);
        filter: blur(2px);
    }
    
    .movie-card:hover .quick-actions-overlay {
        opacity: 1;
    }

    .badge-container {
        position: absolute;
        top: 0;
        right: 0;
        z-index: 10;
        pointer-events: none;
    }

    .badge-container-bottom {
        position: absolute;
        bottom: 0;
        right: 0;
        z-index: 10;
        pointer-events: none;
    }

    .ranking-number {
        position: absolute;
        bottom: 15px;
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