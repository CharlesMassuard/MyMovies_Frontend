<script setup>
    import { useAuthStore } from '../stores/auth';
    import { ref, watch, computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { useRouter } from 'vue-router';
    import axios from 'axios';
    import noPoster from '../assets/noPosterAvailable.webp';
    import ConfirmationDialog from '../components/ConfirmationDialog.vue';

    const router = useRouter();
    const authStore = useAuthStore();
    const { t } = useI18n();
    const apiPath = import.meta.env.VITE_API_BASE_URL;

    const searchQuery = ref('');
    const suggestions = ref([]);
    const showDropdown = ref(false);
    const loadingSuggestions = ref(false);
    let debounceTimer = null;

    const isSelecting = ref(false);
    const dialogConfirmation = ref(false);

    const profilItems = computed(() => [
        { key: 'profile', title: t('header.profile'), icon: 'mdi-account' },
        { key: 'library', title: t('header.library'), icon: 'mdi-library-shelves' },
        { key: 'logout', title: t('header.logout'), icon: 'mdi-logout' }
    ]);

    const handleProfilClick = (item) => {
        if (item.key === 'logout') {
            dialogConfirmation.value = true;
        } else if (item.key === 'profile') {
            router.push('/profil');
        } else if (item.key === 'library') {
            router.push('/library');
        }
    };

    const confirmLogout = () => {
        authStore.logout();
        dialogConfirmation.value = false;
        globalThis.location.reload();
    };

    const fetchSuggestions = async (query) => {
        if (query.length < 3) {
            suggestions.value = [];
            showDropdown.value = false;
            return;
        }

        loadingSuggestions.value = true;
        try {
            const [resMovies, resSeries] = await Promise.all([
                axios.get(`${apiPath}/movies/search`, { params: { query } }),
                axios.get(`${apiPath}/series/search`, { params: { query } })
            ]);

            //normalisation des films
            const movies = (resMovies.data.results || []).map(item => ({
                id: item.id,
                title: item.title,
                year: item.release_date ? item.release_date.split('-')[0] : 'N/A',
                poster_path: item.poster_path,
                media_type: 'movie',
                popularity: item.popularity || 0
            }));

            //normalisation des séries
            const series = (resSeries.data.results || []).map(item => ({
                id: item.id,
                title: item.name,
                year: item.first_air_date ? item.first_air_date.split('-')[0] : 'N/A',
                poster_path: item.poster_path,
                media_type: 'serie',
                popularity: item.popularity || 0
            }));

            //fusion, tri par popularité et limitation à 15 résultats
            suggestions.value = [...movies, ...series]
                .sort((a, b) => b.popularity - a.popularity)
                .slice(0, 15);

            showDropdown.value = suggestions.value.length > 0;
        } catch (error) {
            console.error('Erreur suggestions:', error);
        } finally {
            loadingSuggestions.value = false;
        }
    };

    watch(searchQuery, (newVal) => {
        if (isSelecting.value) return;
        
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

    const selectSuggestion = (item) => {
        isSelecting.value = true;
        searchQuery.value = item.title;
        showDropdown.value = false;
        
        if (item.media_type === 'serie') {
            router.push({ path: `/serie/${item.id}` });
        } else {
            router.push({ path: `/movie/${item.id}` });
        }
        
        setTimeout(() => {
            isSelecting.value = false;
        }, 500);
    };

    const returnMain = () => {
        router.push({ path: '/' });
    };
</script>

<template>
  <v-app-bar :elevation="0" v-if="$route.path !== '/login' && $route.path !== '/register' && !$route.meta.hideHeader">
    <div class="header-section">
      <img src="../assets/logoMyMoviesTxt.webp" alt="MyMovies" class="logo" @click="returnMain" />
    </div>

    <div class="search-container">
      <v-menu v-model="showDropdown" :close-on-content-click="true" activator="parent" offset="10">
        <template v-slot:activator="{ props }">
          <v-text-field 
              v-bind="props"
              clearable 
              :label="$t('header.search')"
              density="compact"
              :placeholder="$t('header.searchPlaceholder')"
              variant="outlined" 
              rounded="xl" 
              class="search-bar custom-append"
              hide-details
              v-model="searchQuery"
              @focus="searchQuery.length >= 3 ? showDropdown = true : null"
          >
            <template v-slot:append-inner>
              <v-btn color="#8C52FF" rounded="xl" variant="flat" class="search-btn">
                <v-icon icon="mdi-magnify" color="white"></v-icon>
              </v-btn>
            </template>
          </v-text-field>
        </template>

        <v-list v-if="suggestions.length > 0" class="dropdown-list" elevation="10" rounded="lg">
          <v-list-item 
            v-for="item in suggestions" 
            :key="`${item.media_type}-${item.id}`" 
            @click="selectSuggestion(item)"
            class="py-2"
          >
            <template v-slot:prepend>
              <div class="poster-container">
                <v-img 
                  :src="item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : noPoster"
                  aspect-ratio="2/3"
                  cover
                  class="poster-img"
                ></v-img>
              </div>
            </template>
            <v-list-item-title class="font-weight-bold">{{ item.title }}</v-list-item-title>
            <v-list-item-subtitle class="d-flex align-center gap-1 mt-1">
              <v-chip 
                size="x-small" 
                variant="flat"
                :color="item.media_type === 'serie' ? '#8C52FE' : '#4287f5'" 
                class="text-white mr-2"
              >
                {{ item.media_type === 'serie' ? $t('header.typeSeries') : $t('header.typeMovie') }}
              </v-chip>
              <span>{{ item.year }}</span>
            </v-list-item-subtitle>
          </v-list-item>
        </v-list>
      </v-menu>
    </div>

    <div class="header-section">
      <v-menu 
        v-if="authStore.isAuthenticated"
        open-on-hover 
        :close-on-content-click="true" 
        location="bottom end"
        offset="10"
      >
        <template v-slot:activator="{ props }">
            <v-btn 
                rounded="xl" 
                color="#8C52FF" 
                variant="flat"
                v-bind="props"
                :icon="$vuetify.display.smAndDown"
            >
                <v-icon :start="!$vuetify.display.smAndDown">mdi-account-circle</v-icon>
                <span v-if="!$vuetify.display.smAndDown">{{ authStore.user?.pseudo }}</span>
            </v-btn>
        </template>

        <v-list class="profil-dropdown pa-2" width="220" elevation="12" rounded="lg">
            <v-list-item
                v-for="(item, index) in profilItems"
                :key="index"
                @click="handleProfilClick(item)"
                rounded="md"
                class="mb-1"
                :base-color="item.key === 'logout' ? 'error' : ''"
            >
                <template v-slot:prepend>
                    <v-icon :icon="item.icon" size="small"></v-icon>
                </template>
                <v-list-item-title class="text-body-2 font-weight-medium">
                    {{ item.title }}
                </v-list-item-title>
            </v-list-item>
        </v-list>
      </v-menu>

      <v-btn 
        v-else
        @click="router.push({path: '/login', query: { redirect: $route.fullPath } })"
        rounded="xl" 
        color="#8C52FF" 
        variant="flat"
        class="px-6"
      >
        {{ $t('header.login') }}
      </v-btn>
    </div>
  </v-app-bar>

  <ConfirmationDialog
    v-model="dialogConfirmation"
    :title="$t('header.logout')"
    :message="$t('header.logoutQuestion')"
    :confirm-text="$t('header.logout')"
    :cancel-text="$t('common.cancel')"
    @confirm="confirmLogout"
  ></ConfirmationDialog>
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

    .profil-dropdown {
        border: 1px solid #f0f0f0;
        background: white !important;
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
