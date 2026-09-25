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
    const currentSort = ref('viewed_desc');

    //Options-de-tri
    const sortOptions = [
        { title: 'Date de visionnage', value: 'viewed_desc' },
        { title: 'Activité récente', value: 'recent_desc' },
        { title: 'Date d\'ajout', value: 'added_desc' },
        { title: 'Note (Décroissant)', value: 'rating_desc' },
        { title: 'Note (Croissant)', value: 'rating_asc' },
        { title: 'Alphabétique (A-Z)', value: 'alpha_asc' }
    ];

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

          userLibrary.value = [...movies, ...series];

      } catch (error) {
          console.error('Erreur lors de la récupération de la bibliothèque:', error);
      } finally {
          loading.value = false;
      }
    };

    //Fonction-pour-récupérer-un-timestamp-propre
    const getTimestamp = (item, sortMode) => {
        let ts = null; //On-initialise-à-null-pour-détecter-l'absence-de-date
        
        if (sortMode === 'recent_desc') {
            const added = item.dateAdded ? new Date(item.dateAdded).getTime() : null;
            const viewed = item.dateViewed ? new Date(item.dateViewed).getTime() : null;
            if (added && viewed) ts = Math.max(added, viewed);
            else if (added) ts = added;
            else if (viewed) ts = viewed;
        } else if (sortMode === 'added_desc') {
            if (item.dateAdded) ts = new Date(item.dateAdded).getTime();
        } else if (sortMode === 'viewed_desc') {
            if (item.dateViewed) ts = new Date(item.dateViewed).getTime();
        }
        
        //Si-aucune-date-n'est-trouvée-(ex:-"A-voir"-trié-par-visionnage)
        if (ts === null || isNaN(ts)) { 
            return Infinity; //Tout-en-haut
        }
        
        //Si-la-date-est-très-ancienne-(inférieure-à-1-an-après-1970)
        if (ts < 31536000000) { 
            return 0; //Tout-en-bas
        }
        
        return ts;
    };

    //Filtrage-et-tri
    const filteredLibrary = computed(() => {
        let result = [...userLibrary.value];
        
        if (currentType.value !== 'all') {
            result = result.filter(item => item.type === currentType.value);
        }
        
        if (currentStatus.value !== 'all') {
            result = result.filter(item => item.status === currentStatus.value);
        }
        
        result.sort((a, b) => {
            switch (currentSort.value) {
                case 'recent_desc':
                case 'added_desc':
                case 'viewed_desc': {
                    const tA = getTimestamp(a, currentSort.value);
                    const tB = getTimestamp(b, currentSort.value);
                    return tB - tA;
                }
                case 'rating_desc':
                    return (b.rating || 0) - (a.rating || 0);
                case 'rating_asc':
                    return (a.rating || 0) - (b.rating || 0);
                case 'alpha_asc': {
                    const titleA = a.data.title || a.data.name || '';
                    const titleB = b.data.title || b.data.name || '';
                    return titleA.localeCompare(titleB);
                }
                default:
                    return 0;
            }
        });

        return result;
    });

    const isDateSort = computed(() => {
        return currentSort.value.includes('recent') || 
               currentSort.value.includes('added') || 
               currentSort.value.includes('viewed');
    });

    //Groupement
    const groupedLibrary = computed(() => {
        if (!isDateSort.value) {
            return [{ title: null, items: filteredLibrary.value }];
        }

        const groups = [];
        
        const formatMonthYear = (timestamp) => {
            if (timestamp === Infinity) return null; //Sera-placé-dans-la-section-sans-titre-en-haut
            if (timestamp === 0) return 'Il y a longtemps'; //Sera-placé-dans-la-section-en-bas
            const date = new Date(timestamp);
            const month = date.toLocaleString('fr-FR', { month: 'long' });
            const year = date.getFullYear();
            return month.charAt(0).toUpperCase() + month.slice(1) + ' ' + year;
        };

        filteredLibrary.value.forEach(item => {
            const timestamp = getTimestamp(item, currentSort.value);
            const groupTitle = formatMonthYear(timestamp);

            let group = groups.find(g => g.title === groupTitle);
            if (!group) {
                group = { title: groupTitle, items: [] };
                groups.push(group);
            }
            group.items.push(item);
        });

        return groups;
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
        <v-btn value="all" class="text-none font-weight-bold flex-grow-1 px-2 px-md-6">Général</v-btn>
        <v-btn value="movie" class="text-none font-weight-bold flex-grow-1 px-2 px-md-6">Films</v-btn>
        <v-btn value="serie" class="text-none font-weight-bold flex-grow-1 px-2 px-md-6">Séries</v-btn>
      </v-btn-toggle>
    </div>

    <!--Filtres-secondaires-et-menu-de-tri-->
    <div class="d-flex flex-column flex-sm-row justify-space-between align-start align-sm-center mb-10 px-4 ga-4" v-if="userLibrary.length > 0">
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

      <v-select
        v-model="currentSort"
        :items="sortOptions"
        item-title="title"
        item-value="value"
        variant="outlined"
        density="compact"
        hide-details
        prepend-inner-icon="mdi-sort"
        class="sort-select"
        style="max-width: 250px; width: 100%;"
      ></v-select>
    </div>

    <!--Affichage-des-cartes-->
    <div v-if="filteredLibrary.length > 0">
      <div v-for="(group, index) in groupedLibrary" :key="index" class="mb-10">
        
        <!--Titre-de-la-section-affiché-uniquement-si-il-existe-->
        <h2 v-if="group.title" class="text-h6 font-weight-bold mb-4 text-grey-darken-2 d-flex align-center ga-2">
          <v-icon size="small" color="#8C52FF">mdi-bookmark-outline</v-icon>
          {{ group.title }}
          <span class="text-body-2 text-grey ml-2 font-weight-regular">({{ group.items.length }})</span>
        </h2>
        
        <v-row>
          <v-col
            v-for="item in group.items"
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
                    class="movie-img"
                  ></v-img>

                  <!--Badge-Supérieur-->
                  <div v-if="currentType === 'all'" class="badge-container-top">
                    <v-chip size="x-small" variant="flat" :color="item.type === 'serie' ? '#8C52FF' : 'grey-darken-3'" class="text-white font-weight-bold shadow-badge">
                      {{ item.type === 'serie' ? 'Série' : 'Film' }}
                    </v-chip>
                  </div>

                  <!--Badge-Inférieur-->
                  <div class="badge-container-bottom">
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
      </div>
    </div>

    <!--État-vide-->
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
        aspect-ratio: 2 / 3;
        z-index: 1;
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.4);
    }

    .movie-card {
        cursor: pointer;
        background: transparent;
        position: relative;
        width: 100%;
        height: 100%;
    }

    .movie-img {
        transition: transform 0.3s ease;
        width: 100%;
        height: 100%;
    }

    .movie-card:hover .movie-img {
        transform: scale(1.1);
    }

    .badge-container-top {
        position: absolute;
        top: 12px;
        right: 12px;
        z-index: 10;
        pointer-events: none;
    }

    .badge-container-bottom {
        position: absolute;
        bottom: 12px; 
        right: 12px;
        z-index: 10;
        pointer-events: none;
    }

    .shadow-badge {
        box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    }
    
    .sort-select {
        background-color: white;
        border-radius: 8px;
    }
</style>