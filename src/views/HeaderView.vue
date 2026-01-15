<script setup>
    import { useAuthStore } from '../stores/auth';
    import { ref, watch } from 'vue';
    import { useRouter } from 'vue-router';
    import axios from 'axios';

    const router = useRouter();
    const authStore = useAuthStore();
    const apiPath = import.meta.env.VITE_API_BASE_URL;

    const searchQuery = ref('');
    const suggestions = ref([]);
    const showDropdown = ref(false);
    const loadingSuggestions = ref(false);
    let debounceTimer = null;

    const performSearch = () => {
        if (!searchQuery.value.trim()) return;
        showDropdown.value = false;
        router.push({
            path: '/search',
            query: { search: searchQuery.value }
        });
    };

    const fetchSuggestions = async (query) => {
        if (query.length < 3) {
            suggestions.value = [];
            showDropdown.value = false;
            return;
        }

        loadingSuggestions.value = true;
        try {
            const response = await axios.get(`${apiPath}/movies/search`, {
                params: { query: query }
            });
            suggestions.value = response.data.results.slice(0, 15);
            showDropdown.value = suggestions.value.length > 0;
        } catch (error) {
            console.error('Erreur suggestions:', error);
        } finally {
            loadingSuggestions.value = false;
        }
    };

    watch(searchQuery, (newVal) => {
        clearTimeout(debounceTimer);
        if (!newVal) {
            suggestions.value = [];
            showDropdown.value = false;
            return;
        }
        debounceTimer = setTimeout(() => {
            fetchSuggestions(newVal);
        }, 300);
    });

    const selectSuggestion = (movie) => {
        searchQuery.value = movie.title;
        showDropdown.value = false;
        performSearch();
    };

    const returnMain = () => {
        router.push({ path: '/' });
    };
</script>

<template>
  <v-app-bar :elevation="0" v-if="$route.path !== '/login' && $route.path !== '/register'">
    <div class="header-section">
      <img src="../assets/LogoMyMoviesTxt.webp" alt="MyMovies Logo" class="logo" @click="returnMain" />
    </div>

    <div class="search-container">
      <v-menu v-model="showDropdown" :close-on-content-click="true" activator="parent" offset="10">
        <template v-slot:activator="{ props }">
          <v-text-field 
              v-bind="props"
              clearable 
              label="Rechercher" 
              density="compact"
              placeholder="Inception, Interstellar, Zootopie, ..."
              variant="outlined" 
              rounded="xl" 
              class="search-bar custom-append"
              hide-details
              v-model="searchQuery"
              @keydown.enter.prevent="performSearch"
              @focus="searchQuery.length >= 3 ? showDropdown = true : null"
          >
            <template v-slot:append-inner>
              <v-btn color="#8C52FF" rounded="xl" variant="flat" class="search-btn" @click="performSearch">
                <v-icon icon="mdi-magnify" color="white"></v-icon>
              </v-btn>
            </template>
          </v-text-field>
        </template>

        <v-list v-if="suggestions.length > 0" class="dropdown-list" elevation="10" rounded="lg">
          <v-list-item 
            v-for="movie in suggestions" 
            :key="movie.id" 
            @click="selectSuggestion(movie)"
            class="py-2"
          >
            <template v-slot:prepend>
              <div class="poster-container">
                <v-img 
                  :src="`https://image.tmdb.org/t/p/w92${movie.poster_path}`"
                  aspect-ratio="2/3"
                  cover
                  class="poster-img"
                ></v-img>
              </div>
            </template>
            <v-list-item-title class="font-weight-bold">{{ movie.title }}</v-list-item-title>
            <v-list-item-subtitle>{{ movie.release_date?.split('-')[0] }}</v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <div class="header-section">
      <v-btn 
        rounded="xl" 
        color="#8C52FF" 
        variant="flat"
        :icon="$vuetify.display.smAndDown"
        :to="!authStore.isAuthenticated ? '/login' : undefined"
      >
        <v-icon start>mdi-account</v-icon>
        {{ authStore.isAuthenticated ? (authStore.user?.pseudo || 'Compte') : 'Se Connecter' }}
      </v-btn>
    </div>
  </v-app-bar>
</template>

<style scoped>
    .v-toolbar {
        padding: 5px 15px !important;
        border-bottom: 1px solid #e0e0e0 !important;
    }

    .search-container {
        position: relative;
        max-width: 500px;
        flex: 2;
        margin: 0 15px;
    }

    .dropdown-list {
        max-width: 500px;
        width: 100%;
        border: 1px solid #e0e0e0;
        max-height: 400px; 
        overflow-y: auto;
    }

    .dropdown-list::-webkit-scrollbar {
        width: 6px;
    }
    .dropdown-list::-webkit-scrollbar-thumb {
        background: #4f4f4f;
        border-radius: 10px;
    }

    .poster-container {
        width: 40px;
        height: 60px;
        border-radius: 4px;
        overflow: hidden;
        margin-right: 12px;
    }

    .poster-img {
        width: 100%;
        height: 100%;
    }

    .logo {
        height: 60px;
        transition: height 0.3s ease;
        cursor: pointer;
    }

    .header-section {
        flex: 1;
        display: flex;
        align-items: center;
        min-width: fit-content;
    }

    .header-section:last-child {
        justify-content: flex-end;
    }

    .search-btn {
        height: 100% !important;
        min-width: 40px;
        border-radius: inherit;
    }

    .custom-append :deep(.v-field__append-inner) {
        padding-top: 0;
        align-items: center;
        margin-inline-start: 0;
    }

    .custom-append :deep(.v-field--variant-outlined) {
        padding-inline-end: 0;
    }
    
    .search-bar {
        max-width: 500px;
        flex: 2;
        margin: 0 15px;
        transition: all 0.3s ease;
    }

    @media (max-width: 960px) {
        .logo {
            height: 45px;
        }
        .search-bar {
            margin: 0 10px;
        }
    }

    @media (max-width: 600px) {
        .logo {
            height: 35px;
        }
        .search-bar {
            margin: 0 5px;
        }
        .v-toolbar {
            padding: 5px 8px !important;
        }
    }
</style>