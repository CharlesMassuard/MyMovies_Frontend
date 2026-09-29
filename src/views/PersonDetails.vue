<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import noPoster from '../assets/noPosterAvailable.webp';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const route = useRoute();
const router = useRouter();
const personId = computed(() => route.params.id);

const isLoading = ref(true);
const personDetails = ref({});
const personCredits = ref([]);
const externalIds = ref({});
const showFullBio = ref(false);

const fetchPersonDetails = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/person/${personId.value}`);
    personDetails.value = response.data;
  } catch (error) {
    console.error('Error fetching person details:', error);
  }
};

const fetchPersonCredits = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/person/${personId.value}/credits`);
    //On élimine les doublons potentiels renvoyés par l'API
    const uniqueCredits = response.data.cast.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);
    personCredits.value = uniqueCredits || [];
  } catch (error) {
    console.error('Error fetching person credits:', error);
  }
};

const fetchExternalIds = async () => {
  try {
    const response = await axios.get(`${API_BASE_URL}/person/${personId.value}/external_ids`);
    externalIds.value = response.data;
  } catch (error) {
    console.error('Error fetching external ids:', error);
  }
};

const knownForMovies = computed(() => {
  return [...personCredits.value]
    .filter(item => item.poster_path)
    .sort((a, b) => b.popularity - a.popularity)
    .slice(0, 15);
});

const topBackdrop = computed(() => {
  const topMedia = knownForMovies.value.find(m => m.backdrop_path);
  return topMedia ? `https://image.tmdb.org/t/p/original${topMedia.backdrop_path}` : null;
});

//Regroupement-de-la-filmographie-par-année
const groupedFilmography = computed(() => {
  const groups = {};
  
  personCredits.value.forEach(media => {
    const dateStr = media.release_date || media.first_air_date;
    const year = dateStr ? dateStr.substring(0, 4) : 'À venir';
    
    if(!groups[year]) {
      groups[year] = [];
    }
    groups[year].push(media);
  });

  //On-trie-les-années-par-ordre-décroissant,-avec-'À-venir'-en-premier
  return Object.keys(groups)
    .sort((a, b) => {
      if (a === 'À venir') return -1;
      if (b === 'À venir') return 1;
      return b - a;
    })
    .map(year => ({
      year,
      //On-trie-les-films-d-une-meme-annee-par-popularite
      items: groups[year].sort((a, b) => b.popularity - a.popularity)
    }));
});

const getGender = (id) => {
  switch(id) {
    case 1: return "Femme";
    case 2: return "Homme";
    case 3: return "Non-binaire";
    default: return "Non spécifié";
  }
};

const formatDate = (dateString) => {
  if (!dateString) return null;
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
};

const calculateAge = (birth, death) => {
  if (!birth) return null;
  const birthDate = new Date(birth);
  const endDate = death ? new Date(death) : new Date();
  let age = endDate.getFullYear() - birthDate.getFullYear();
  const m = endDate.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
};

const goToMedia = (item) => {
  const type = item.media_type === 'tv' ? 'serie' : 'movie';
  router.push(`/${type}/${item.id}`);
};

const loadData = async () => {
  isLoading.value = true;
  await Promise.all([
    fetchPersonDetails(),
    fetchPersonCredits(),
    fetchExternalIds()
  ]);
  isLoading.value = false;
};

onMounted(() => {
  loadData();
});

watch(() => personId.value, () => {
  if(!personId.value) return;
  showFullBio.value = false;
  loadData();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});
</script>

<template>
  <div class="person-page">
    
    <!--Bannière-->
    <div class="hero-banner">
      <div 
        v-if="topBackdrop"
        class="hero-bg" 
        :style="{ backgroundImage: `url(${topBackdrop})` }"
      ></div>
      <div class="hero-overlay"></div>
    </div>

    <v-container class="content-container pb-16">
      <v-row v-if="isLoading">
        <v-col cols="12" md="3" class="mt-n16">
          <v-skeleton-loader type="image" height="400" class="rounded-xl elevation-10 mb-4"></v-skeleton-loader>
        </v-col>
        <v-col cols="12" md="9" class="pt-8">
          <v-skeleton-loader type="heading" width="300" class="mb-6"></v-skeleton-loader>
          <v-skeleton-loader type="paragraph" class="mb-8"></v-skeleton-loader>
        </v-col>
      </v-row>

      <v-row v-else-if="personDetails.name">
        <!--Colonne-gauche:-Profil-->
        <v-col cols="12" md="3" class="sidebar-col">
          <v-card class="profile-card rounded-xl elevation-6">
            <v-img
              :src="personDetails.profile_path ? `https://image.tmdb.org/t/p/w500${personDetails.profile_path}` : noPoster"
              :alt="personDetails.name"
              cover
              class="bg-grey-lighten-2"
              height="400"
            ></v-img>

            <v-card-text class="pa-6">
              <div class="social-links d-flex justify-center ga-4 mb-6 pb-4 border-b" v-if="externalIds.instagram_id || externalIds.twitter_id || externalIds.imdb_id">
                <v-btn v-if="externalIds.instagram_id" :href="`https://instagram.com/${externalIds.instagram_id}`" target="_blank" icon variant="tonal" size="small" color="#8C52FF" v-tooltip="`Instagram`">
                  <v-icon>mdi-instagram</v-icon>
                </v-btn>
                <v-btn v-if="externalIds.twitter_id" :href="`https://twitter.com/${externalIds.twitter_id}`" target="_blank" icon variant="tonal" size="small" color="#8C52FF" v-tooltip="`Twitter`">
                  <v-icon>mdi-twitter</v-icon>
                </v-btn>
                <v-btn v-if="externalIds.imdb_id" :href="`https://www.imdb.com/name/${externalIds.imdb_id}`" target="_blank" icon variant="tonal" size="small" color="#8C52FF" v-tooltip="`IMDB`">
                  <v-icon>mdi-movie-roll</v-icon>
                </v-btn>
              </div>

              <h3 class="text-h6 font-weight-bold mb-4">Infos personnelles</h3>
              
              <div class="info-item mb-4" v-if="personDetails.known_for_department">
                <div class="text-caption font-weight-bold text-uppercase text-grey-darken-1">Métier</div>
                <div class="text-body-1 font-weight-medium">{{ personDetails.known_for_department }}</div>
              </div>

              <div class="info-item mb-4" v-if="personDetails.gender">
                <div class="text-caption font-weight-bold text-uppercase text-grey-darken-1">Sexe</div>
                <div class="text-body-1 font-weight-medium">{{ getGender(personDetails.gender) }}</div>
              </div>

              <div class="info-item mb-4" v-if="personDetails.birthday">
                <div class="text-caption font-weight-bold text-uppercase text-grey-darken-1">Naissance</div>
                <div class="text-body-1 font-weight-medium">
                  {{ formatDate(personDetails.birthday) }}
                  <span v-if="!personDetails.deathday" class="text-grey-darken-1 text-body-2"><br>({{ calculateAge(personDetails.birthday) }} ans)</span>
                </div>
              </div>

              <div class="info-item mb-4" v-if="personDetails.deathday">
                <div class="text-caption font-weight-bold text-uppercase text-grey-darken-1">Décès</div>
                <div class="text-body-1 font-weight-medium">
                  {{ formatDate(personDetails.deathday) }}
                  <span class="text-grey-darken-1 text-body-2"><br>(à {{ calculateAge(personDetails.birthday, personDetails.deathday) }} ans)</span>
                </div>
              </div>

              <div class="info-item" v-if="personDetails.place_of_birth">
                <div class="text-caption font-weight-bold text-uppercase text-grey-darken-1">Lieu de naissance</div>
                <div class="text-body-1 font-weight-medium">{{ personDetails.place_of_birth }}</div>
              </div>
            </v-card-text>
          </v-card>
        </v-col>

        <!--Colonne-droite:-Bio-et-Oeuvres-->
        <v-col cols="12" md="9" class="px-md-8 pt-md-8">
          <h1 class="text-h2 font-weight-black mb-6 tracking-tight">{{ personDetails.name }}</h1>
          
          <!--Biographie-->
          <div class="mb-12">
            <div v-if="personDetails.biography" class="biography-container">
              <p class="biography-text" :class="{ 'bio-collapsed': !showFullBio }">
                {{ personDetails.biography }}
              </p>
              <v-btn 
                v-if="personDetails.biography.length > 500"
                variant="text" 
                color="#8C52FF" 
                class="text-none font-weight-bold px-0 mt-2" 
                @click="showFullBio = !showFullBio"
                :ripple="false"
              >
                {{ showFullBio ? 'Moins' : 'Lire la suite' }}
                <v-icon end>{{ showFullBio ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </v-btn>
            </div>
            <p v-else class="text-grey-darken-1 italic">Aucune biographie n'est disponible pour le moment.</p>
          </div>

          <!--Connu-pour-->
          <div v-if="knownForMovies.length > 0" class="mb-12">
            <h3 class="text-h5 font-weight-bold mb-4 d-flex align-center ga-2">
              <v-icon color="#8C52FF">mdi-star-shooting</v-icon> Connu(e) pour
            </h3>
            <v-row class="flex-nowrap overflow-x-auto pb-4 hide-scrollbar">
              <v-col v-for="media in knownForMovies" :key="media.id" cols="5" sm="4" md="3" lg="3" class="flex-shrink-0">
                <v-card 
                  class="rounded-lg overflow-hidden elevation-2 h-100 media-card"
                  @click="goToMedia(media)"
                >
                  <v-img 
                    :src="media.poster_path ? `https://image.tmdb.org/t/p/w300${media.poster_path}` : noPoster" 
                    aspect-ratio="2/3" 
                    cover
                    class="bg-grey-lighten-2"
                  ></v-img>
                  <v-card-text class="pa-3">
                    <p class="font-weight-bold mb-1 text-truncate text-body-2">{{ media.title || media.name }}</p>
                    <p class="text-caption text-grey-darken-1 text-truncate" v-if="media.character">{{ media.character }}</p>
                  </v-card-text>
                </v-card>
              </v-col>
            </v-row>
          </div>

          <!--Filmographie-Timeline-->
          <div v-if="groupedFilmography.length > 0">
            <h3 class="text-h5 font-weight-bold mb-6 d-flex align-center ga-2">
              <v-icon color="#8C52FF">mdi-movie-open-outline</v-icon> Filmographie
            </h3>
            
            <div class="filmography-container">
              <div v-for="group in groupedFilmography" :key="group.year" class="year-group mb-8">
                <!--En-tête-de-l'année-->
                <div class="d-flex align-center mb-4">
                  <h4 class="text-h6 font-weight-black mr-4 text-no-wrap flex-shrink-0">{{ group.year }}</h4>
                  <v-divider></v-divider>
                </div>
                
                <!--Liste-des-films-de-l'année-->
                <v-card class="elevation-1 rounded-lg overflow-hidden border-card">
                  <v-list class="pa-0 bg-transparent">
                    <template v-for="(media, index) in group.items" :key="`${media.id}-${index}`">
                      <v-list-item 
                        class="filmography-item py-3 px-4"
                        @click="goToMedia(media)"
                      >
                        <template v-slot:prepend>
                          <v-avatar rounded="lg" size="50" class="mr-4 elevation-1 bg-grey-lighten-3">
                            <v-img :src="media.poster_path ? `https://image.tmdb.org/t/p/w92${media.poster_path}` : noPoster" cover></v-img>
                          </v-avatar>
                        </template>
                        
                        <v-list-item-title class="font-weight-bold text-body-1 mb-1 text-wrap">
                          {{ media.title || media.name }}
                        </v-list-item-title>
                        
                        <v-list-item-subtitle class="text-body-2 text-grey-darken-2 d-flex align-center flex-wrap ga-2">
                          <v-chip size="x-small" :color="media.media_type === 'tv' ? '#8C52FF' : 'grey-darken-3'" variant="flat" class="text-white font-weight-bold">
                            {{ media.media_type === 'tv' ? 'Série' : 'Film' }}
                          </v-chip>
                          <span v-if="media.character" class="opacity-90">
                            en tant que <strong class="text-black">{{ media.character }}</strong>
                          </span>
                        </v-list-item-subtitle>
                        
                        <template v-slot:append>
                           <v-icon color="grey-lighten-1" size="small">mdi-chevron-right</v-icon>
                        </template>
                      </v-list-item>
                      <v-divider v-if="index < group.items.length - 1" class="border-opacity-15"></v-divider>
                    </template>
                  </v-list>
                </v-card>
              </div>
            </div>

          </div>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.person-page {
  background-color: #fcfcfc;
  min-height: 100vh;
  position: relative;
}

.hero-banner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 300px;
  overflow: hidden;
  z-index: 0;
}

.hero-bg {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center 20%;
  filter: blur(20px) brightness(0.6);
  transform: scale(1.1);
}

.hero-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(to bottom, rgba(252,252,252,0) 0%, rgba(252,252,252,1) 100%);
}

.content-container {
  position: relative;
  z-index: 1;
  padding-top: 100px;
}

.sidebar-col {
  margin-top: -100px;
  position: sticky;
  top: 80px;
  align-self: flex-start;
}

.profile-card {
  background: white;
  border: 1px solid rgba(0,0,0,0.05);
}

.tracking-tight {
  letter-spacing: -1px;
}

.biography-text {
  font-size: 1.05rem;
  line-height: 1.8;
  color: #444;
  white-space: pre-line;
  transition: all 0.3s ease;
}

.bio-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
  position: relative;
}

.bio-collapsed::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 40px;
  background: linear-gradient(to bottom, rgba(252,252,252,0), rgba(252,252,252,1));
}

.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #dbdbdb transparent;
}
.hide-scrollbar::-webkit-scrollbar {
  height: 8px;
}
.hide-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}
.hide-scrollbar::-webkit-scrollbar-thumb {
  background-color: #dbdbdb;
  border-radius: 10px;
}

.media-card {
  cursor: pointer;
  transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.25s;
  background: white;
}
.media-card:hover {
  transform: translateY(-6px);
  box-shadow: 0 12px 24px rgba(0,0,0,0.12) !important;
}

.border-card {
  border: 1px solid rgba(0,0,0,0.05);
  background: white;
}

.filmography-item {
  transition: background-color 0.2s ease;
  cursor: pointer;
}
.filmography-item:hover {
  background-color: rgba(140, 82, 255, 0.04);
}
.filmography-item:hover .v-icon {
  color: #8C52FF !important;
  transform: translateX(4px);
  transition: transform 0.2s ease, color 0.2s ease;
}

@media (max-width: 960px) {
  .sidebar-col {
    margin-top: 0;
    position: relative;
    top: 0;
  }
  .content-container {
    padding-top: 20px;
  }
}
</style>