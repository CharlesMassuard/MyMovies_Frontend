<script setup>
import { useAuthStore } from '../stores/auth';
import { ref, watch, computed, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRouter, useRoute } from 'vue-router';
import apiClient from '../api/client';
import noPoster from '../assets/noPosterAvailable.webp';
import ConfirmationDialog from '../components/ConfirmationDialog.vue';

const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const { t } = useI18n();

const searchQuery = ref('');
const suggestions = ref([]);
const showDropdown = ref(false);
const loadingSuggestions = ref(false);
const hasSearched = ref(false);
const activeIndex = ref(-1);
const searchWrapperRef = ref(null);
const searchInputRef = ref(null);
const mobileMenuOpen = ref(false);
let debounceTimer = null;
let searchRequestId = 0;

const dialogConfirmation = ref(false);
const scrollY = ref(0);

const handleScroll = () => {
  scrollY.value = window.scrollY || 0;
};

const handleClickOutside = (event) => {
  if (searchWrapperRef.value && !searchWrapperRef.value.contains(event.target)) {
    showDropdown.value = false;
    activeIndex.value = -1;
  }
};

const handleGlobalKeydown = (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInputRef.value?.focus();
    return;
  }
  const tag = document.activeElement?.tagName?.toLowerCase();
  if (e.key === '/' && tag !== 'input' && tag !== 'textarea' && !document.activeElement?.isContentEditable) {
    e.preventDefault();
    searchInputRef.value?.focus();
  }
};

onMounted(() => {
  window.addEventListener('scroll', handleScroll, { passive: true });
  document.addEventListener('mousedown', handleClickOutside);
  document.addEventListener('keydown', handleGlobalKeydown);
  handleScroll();
});

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll);
  document.removeEventListener('mousedown', handleClickOutside);
  document.removeEventListener('keydown', handleGlobalKeydown);
  clearTimeout(debounceTimer);
});

const hideHeader = computed(() => {
  return route.path === '/login' || route.path === '/register' || Boolean(route.meta.hideHeader);
});

const isTransparentMode = computed(() => {
  return Boolean(route.meta.transparentHeader) && scrollY.value < 40;
});

const profilItems = computed(() => [
  { key: 'profile', title: t('header.profile'), icon: 'mdi-account-outline' },
  { key: 'library', title: t('header.library'), icon: 'mdi-bookmark-multiple-outline' },
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
  const trimmed = query.trim();
  if (trimmed.length < 2) {
    suggestions.value = [];
    hasSearched.value = false;
    showDropdown.value = false;
    return;
  }

  const currentReqId = ++searchRequestId;
  loadingSuggestions.value = true;
  showDropdown.value = true;
  activeIndex.value = -1;

  try {
    const [resMovies, resSeries, resPeople] = await Promise.all([
      apiClient.get('/movies/search', { params: { query: trimmed } }),
      apiClient.get('/series/search', { params: { query: trimmed } }),
      apiClient.get('/person/search', { params: { query: trimmed } })
    ]);

    if (currentReqId !== searchRequestId) return;

    const movies = (resMovies.data.results || []).map(item => ({
      id: item.id,
      title: item.title,
      year: item.release_date ? item.release_date.split('-')[0] : null,
      poster_path: item.poster_path,
      vote_average: item.vote_average || 0,
      media_type: 'movie',
      popularity: item.popularity || 0
    }));

    const series = (resSeries.data.results || []).map(item => ({
      id: item.id,
      title: item.name,
      year: item.first_air_date ? item.first_air_date.split('-')[0] : null,
      poster_path: item.poster_path,
      vote_average: item.vote_average || 0,
      media_type: 'serie',
      popularity: item.popularity || 0
    }));

    const people = (resPeople.data.results || []).map(item => ({
      id: item.id,
      title: item.name,
      subtitle: item.known_for_department || null,
      poster_path: item.profile_path,
      vote_average: 0,
      media_type: 'person',
      popularity: item.popularity || 0
    }));

    suggestions.value = [...movies, ...series, ...people]
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, 15);

    hasSearched.value = true;
  } catch (error) {
    console.error('Erreur suggestions:', error);
    suggestions.value = [];
    hasSearched.value = true;
  } finally {
    loadingSuggestions.value = false;
  }
};

watch(searchQuery, (newVal) => {
  clearTimeout(debounceTimer);
  const trimmed = (newVal || '').trim();
  if (trimmed.length < 2) {
    suggestions.value = [];
    hasSearched.value = false;
    showDropdown.value = false;
    activeIndex.value = -1;
    return;
  }
  debounceTimer = setTimeout(() => {
    fetchSuggestions(trimmed);
  }, 280);
});

const selectSuggestion = (item) => {
  if (!item) return;
  showDropdown.value = false;
  activeIndex.value = -1;
  searchQuery.value = '';
  searchInputRef.value?.blur();

  if (item.media_type === 'serie') {
    router.push({ path: `/serie/${item.id}` });
  } else if (item.media_type === 'person') {
    router.push({ path: `/person/${item.id}` });
  } else {
    router.push({ path: `/movie/${item.id}` });
  }
};

const clearSearch = () => {
  searchQuery.value = '';
  suggestions.value = [];
  hasSearched.value = false;
  showDropdown.value = false;
  activeIndex.value = -1;
  searchInputRef.value?.focus();
};

const handleSearchFocus = () => {
  if (searchQuery.value.trim().length >= 2 && (suggestions.value.length > 0 || hasSearched.value)) {
    showDropdown.value = true;
  }
};

const submitFullSearch = () => {
  const q = searchQuery.value.trim();
  if (!q) return;
  clearTimeout(debounceTimer);
  searchRequestId++;
  showDropdown.value = false;
  loadingSuggestions.value = false;
  activeIndex.value = -1;
  searchInputRef.value?.blur();
  router.push({ path: '/search', query: { q } });
};

watch(
  () => route.fullPath,
  () => {
    clearTimeout(debounceTimer);
    searchRequestId++;
    showDropdown.value = false;
    activeIndex.value = -1;
  }
);

const handleSearchKeydown = (e) => {
  if (e.key === 'Escape') {
    showDropdown.value = false;
    activeIndex.value = -1;
    searchInputRef.value?.blur();
  } else if (e.key === 'ArrowDown' && showDropdown.value) {
    e.preventDefault();
    if (suggestions.value.length > 0) {
      activeIndex.value = (activeIndex.value + 1) % suggestions.value.length;
    }
  } else if (e.key === 'ArrowUp' && showDropdown.value) {
    e.preventDefault();
    if (suggestions.value.length > 0) {
      activeIndex.value = activeIndex.value <= 0 ? suggestions.value.length - 1 : activeIndex.value - 1;
    }
  } else if (e.key === 'Enter') {
    e.preventDefault();
    if (showDropdown.value && activeIndex.value >= 0 && suggestions.value[activeIndex.value]) {
      selectSuggestion(suggestions.value[activeIndex.value]);
    } else {
      submitFullSearch();
    }
  }
};

const returnMain = () => {
  router.push({ path: '/' });
};
</script>

<template>
  <header
    v-if="!hideHeader"
    class="modern-header"
    :class="{
      'header-transparent': isTransparentMode,
      'header-scrolled': !isTransparentMode
    }"
  >
    <div class="header-inner">
      <!-- Left: Mobile Menu + Logo + Nav -->
      <div class="header-left">
        <v-menu v-model="mobileMenuOpen" location="bottom start" offset="10">
          <template v-slot:activator="{ props }">
            <v-btn
              v-bind="props"
              icon="mdi-menu"
              variant="text"
              size="small"
              class="d-lg-none mobile-menu-btn"
            />
          </template>
          <v-list class="pa-2 mobile-nav-list" min-width="230" elevation="12" rounded="xl">
            <v-list-item to="/" rounded="lg" class="mb-1">
              <template v-slot:prepend>
                <v-icon size="20" class="mr-3">mdi-home-variant-outline</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">{{ $t('footer.home') }}</v-list-item-title>
            </v-list-item>
            <v-list-item to="/explore" rounded="lg" class="mb-1">
              <template v-slot:prepend>
                <v-icon size="20" class="mr-3">mdi-compass-outline</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">{{ $t('header.explore') }}</v-list-item-title>
            </v-list-item>
            <v-list-item v-if="authStore.isAuthenticated" to="/library" rounded="lg">
              <template v-slot:prepend>
                <v-icon size="20" class="mr-3">mdi-bookmark-multiple-outline</v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium">{{ $t('header.library') }}</v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>

        <img
          src="../assets/logoMyMoviesTxt.webp"
          alt="MyMovies"
          class="logo"
          @click="returnMain"
        />

        <nav class="nav-links d-none d-lg-flex">
          <router-link to="/" class="nav-link" active-class="nav-link-active" exact>
            <v-icon size="17" class="mr-1">mdi-home-variant-outline</v-icon>
            <span>{{ $t('footer.home') }}</span>
          </router-link>
          <router-link to="/explore" class="nav-link" active-class="nav-link-active">
            <v-icon size="17" class="mr-1">mdi-compass-outline</v-icon>
            <span>{{ $t('header.explore') }}</span>
          </router-link>
          <router-link
            v-if="authStore.isAuthenticated"
            to="/library"
            class="nav-link"
            active-class="nav-link-active"
          >
            <v-icon size="17" class="mr-1">mdi-bookmark-multiple-outline</v-icon>
            <span>{{ $t('header.library') }}</span>
          </router-link>
        </nav>
      </div>

      <!-- Right Group: Search + User / Login -->
      <div class="header-right-group">
        <div ref="searchWrapperRef" class="search-container">
          <div class="search-pill" :class="{ 'search-pill-active': showDropdown }">
            <v-icon size="18" class="search-icon">mdi-magnify</v-icon>
            <input
              ref="searchInputRef"
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="$t('header.searchPlaceholder')"
              autocomplete="off"
              @focus="handleSearchFocus"
              @keydown="handleSearchKeydown"
            />
            <v-progress-circular
              v-if="loadingSuggestions"
              indeterminate
              size="16"
              width="2"
              color="#8C52FF"
              class="mr-1"
            />
            <button
              v-else-if="searchQuery"
              type="button"
              class="clear-btn"
              @click="clearSearch"
              aria-label="Clear search"
            >
              <v-icon size="14">mdi-close</v-icon>
            </button>
          </div>

          <!-- Custom Search Results Dropdown -->
          <transition name="dropdown-fade">
            <div v-if="showDropdown" class="search-dropdown">
              <div v-if="loadingSuggestions && suggestions.length === 0" class="dropdown-state">
                <v-progress-circular indeterminate size="22" width="2" color="#8C52FF" class="mr-3" />
                <span class="text-body-2 opacity-75">{{ $t('common.loading') }}</span>
              </div>

              <div v-else-if="hasSearched && suggestions.length === 0" class="dropdown-state">
                <v-icon size="22" class="mr-2 opacity-60">mdi-movie-search-outline</v-icon>
                <span class="text-body-2 opacity-75">{{ $t('common.noResults') }}</span>
              </div>

              <div v-else class="dropdown-results">
                <button
                  v-for="(item, idx) in suggestions"
                  :key="`${item.media_type}-${item.id}`"
                  type="button"
                  class="suggestion-row"
                  :class="{ 'suggestion-row-active': idx === activeIndex }"
                  @mouseenter="activeIndex = idx"
                  @click="selectSuggestion(item)"
                >
                  <img
                    :src="item.poster_path ? `https://image.tmdb.org/t/p/w92${item.poster_path}` : noPoster"
                    :alt="item.title"
                    class="suggestion-poster"
                    :class="{ 'suggestion-avatar': item.media_type === 'person' }"
                  />
                  <div class="suggestion-info">
                    <div class="suggestion-title">{{ item.title }}</div>
                    <div class="suggestion-meta">
                      <span
                        class="type-pill"
                        :class="
                          item.media_type === 'serie'
                            ? 'type-serie'
                            : item.media_type === 'person'
                            ? 'type-person'
                            : 'type-movie'
                        "
                      >
                        {{
                          item.media_type === 'serie'
                            ? $t('header.typeSeries')
                            : item.media_type === 'person'
                            ? $t('header.typePerson')
                            : $t('header.typeMovie')
                        }}
                      </span>
                      <span v-if="item.year" class="meta-text">{{ item.year }}</span>
                      <span v-else-if="item.subtitle" class="meta-text">{{ item.subtitle }}</span>
                      <span v-if="item.vote_average > 0" class="meta-rating">
                        <v-icon size="12" color="#fbbf24" class="mr-1">mdi-star</v-icon>
                        {{ (Math.round(item.vote_average * 10) / 10).toFixed(1) }}
                      </span>
                    </div>
                  </div>
                  <v-icon size="16" class="suggestion-arrow">mdi-chevron-right</v-icon>
                </button>
              </div>
            </div>
          </transition>
        </div>

        <!-- User / Login -->
        <div class="header-right">
          <v-menu
            v-if="authStore.isAuthenticated"
            :close-on-content-click="true"
            location="bottom end"
            offset="10"
          >
            <template v-slot:activator="{ props }">
              <button type="button" class="user-pill" v-bind="props">
                <div class="user-avatar">
                  <v-icon size="17" color="white">mdi-account</v-icon>
                </div>
                <span class="user-name d-none d-md-inline">{{ authStore.user?.pseudo }}</span>
                <v-icon size="16" class="d-none d-md-inline opacity-70">mdi-chevron-down</v-icon>
              </button>
            </template>

            <v-list class="profil-dropdown pa-2" width="220" elevation="12" rounded="xl">
              <v-list-item
                v-for="(item, index) in profilItems"
                :key="index"
                @click="handleProfilClick(item)"
                rounded="lg"
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
            @click="router.push({ path: '/login', query: { redirect: $route.fullPath } })"
            rounded="pill"
            color="#8C52FF"
            variant="flat"
            class="px-3 px-sm-5 font-weight-bold text-none login-btn"
            height="38"
          >
            <v-icon :start="!$vuetify.display.xs" size="18">mdi-login</v-icon>
            <span class="d-none d-sm-inline">{{ $t('header.login') }}</span>
          </v-btn>
        </div>
      </div>
    </div>
  </header>

  <ConfirmationDialog
    v-model="dialogConfirmation"
    :title="$t('header.logout')"
    :message="$t('header.logoutQuestion')"
    :confirm-text="$t('header.logout')"
    :cancel-text="$t('common.cancel')"
    @confirm="confirmLogout"
  />
</template>

<style scoped>
.modern-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  height: 68px;
  z-index: 1005;
  transition: background 0.3s ease, backdrop-filter 0.3s ease, box-shadow 0.3s ease;
}

.header-transparent {
  background: linear-gradient(to bottom, rgba(10, 11, 16, 0.85) 0%, rgba(10, 11, 16, 0.4) 65%, transparent 100%);
  color: #ffffff;
}

.header-scrolled {
  background: rgba(15, 16, 21, 0.8);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.25);
  color: #f5f5f7;
}

:root[data-theme='light'] .header-scrolled {
  background: rgba(255, 255, 255, 0.86);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06);
  color: #1f2937;
}

.header-inner {
  max-width: 1440px;
  margin: 0 auto;
  height: 100%;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-shrink: 0;
}

.header-right-group {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  justify-content: flex-end;
  min-width: 0;
}

.mobile-menu-btn {
  color: inherit !important;
}

.logo {
  height: 42px;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.logo:hover {
  transform: scale(1.03);
}

.nav-links {
  display: flex;
  align-items: center;
  gap: 4px;
}

.nav-link {
  display: inline-flex;
  align-items: center;
  padding: 6px 13px;
  border-radius: 999px;
  font-size: 0.86rem;
  font-weight: 500;
  color: inherit;
  opacity: 0.78;
  transition: opacity 0.2s ease, background 0.2s ease;
  text-decoration: none;
  white-space: nowrap;
}

.nav-link:hover {
  opacity: 1;
  background: rgba(255, 255, 255, 0.1);
}

:root[data-theme='light'] .header-scrolled .nav-link:hover {
  background: rgba(0, 0, 0, 0.06);
}

.nav-link-active {
  opacity: 1;
  background: rgba(140, 82, 255, 0.2);
  color: #c4a7ff;
  font-weight: 600;
}

:root[data-theme='light'] .header-scrolled .nav-link-active {
  background: rgba(140, 82, 255, 0.12);
  color: #6b21a8;
}

/* Search Container - Positioned Right Next to Profile */
.search-container {
  position: relative;
  width: 300px;
  max-width: 100%;
  transition: width 0.25s ease;
}

.search-container:focus-within {
  width: 360px;
}

.search-pill {
  display: flex;
  align-items: center;
  height: 40px;
  padding: 0 14px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  transition: background 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
}

.search-pill:focus-within,
.search-pill-active {
  background: rgba(255, 255, 255, 0.16);
  border-color: rgba(140, 82, 255, 0.75);
  box-shadow: 0 0 0 3px rgba(140, 82, 255, 0.2);
}

:root[data-theme='light'] .header-scrolled .search-pill {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
}

:root[data-theme='light'] .header-scrolled .search-pill:focus-within,
:root[data-theme='light'] .header-scrolled .search-pill-active {
  background: rgba(0, 0, 0, 0.07);
  border-color: rgba(140, 82, 255, 0.6);
}

.search-icon {
  opacity: 0.7;
  margin-right: 10px;
  flex-shrink: 0;
}

.search-input {
  flex: 1;
  min-width: 0;
  background: transparent;
  border: none;
  outline: none;
  color: inherit;
  font-size: 0.875rem;
}

.search-input::placeholder {
  color: inherit;
  opacity: 0.55;
}

.clear-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.18);
  border: none;
  border-radius: 50%;
  width: 22px;
  height: 22px;
  color: inherit;
  cursor: pointer;
  opacity: 0.85;
  flex-shrink: 0;
}

.clear-btn:hover {
  opacity: 1;
}

/* Custom Dropdown */
.search-dropdown {
  position: absolute;
  top: calc(100% + 10px);
  left: 0;
  right: 0;
  background: rgba(20, 22, 30, 0.96);
  backdrop-filter: blur(22px);
  -webkit-backdrop-filter: blur(22px);
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.55);
  overflow: hidden;
  z-index: 1100;
  color: #f5f5f7;
}

:root[data-theme='light'] .search-dropdown {
  background: rgba(255, 255, 255, 0.97);
  border-color: rgba(0, 0, 0, 0.1);
  box-shadow: 0 16px 40px rgba(0, 0, 0, 0.14);
  color: #1f2937;
}

.dropdown-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px 16px;
}

.dropdown-results {
  max-height: 420px;
  overflow-y: auto;
  padding: 6px;
}

.dropdown-results::-webkit-scrollbar {
  width: 6px;
}

.dropdown-results::-webkit-scrollbar-thumb {
  background: rgba(150, 150, 160, 0.4);
  border-radius: 999px;
}

.suggestion-row {
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 8px 10px;
  border: none;
  background: transparent;
  border-radius: 12px;
  cursor: pointer;
  text-align: left;
  color: inherit;
  transition: background 0.15s ease;
}

.suggestion-row:hover,
.suggestion-row-active {
  background: rgba(140, 82, 255, 0.16);
}

.suggestion-poster {
  width: 40px;
  height: 58px;
  object-fit: cover;
  border-radius: 7px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.06);
}

.suggestion-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  object-position: center 20%;
}

.suggestion-info {
  flex: 1;
  min-width: 0;
}

.suggestion-title {
  font-size: 0.9rem;
  font-weight: 600;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.suggestion-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 4px;
}

.type-pill {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: 999px;
  color: #ffffff;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.type-movie {
  background: #3b82f6;
}

.type-serie {
  background: #8C52FF;
}

.type-person {
  background: #10b981;
}

.meta-text {
  font-size: 0.76rem;
  opacity: 0.65;
}

.meta-rating {
  display: inline-flex;
  align-items: center;
  font-size: 0.76rem;
  font-weight: 600;
  opacity: 0.85;
}

.suggestion-arrow {
  opacity: 0.4;
  flex-shrink: 0;
}

.suggestion-row-active .suggestion-arrow {
  opacity: 0.9;
}

.dropdown-fade-enter-active,
.dropdown-fade-leave-active {
  transition: opacity 0.16s ease, transform 0.16s ease;
}

.dropdown-fade-enter-from,
.dropdown-fade-leave-to {
  opacity: 0;
  transform: translateY(-6px);
}

.header-right {
  display: flex;
  align-items: center;
  justify-self: end;
}

.user-pill {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 4px 12px 4px 4px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
  color: inherit;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: background 0.2s ease;
}

.user-pill:hover {
  background: rgba(255, 255, 255, 0.18);
}

:root[data-theme='light'] .header-scrolled .user-pill {
  background: rgba(0, 0, 0, 0.05);
  border-color: rgba(0, 0, 0, 0.1);
}

.user-avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8C52FF, #5e2ced);
  display: flex;
  align-items: center;
  justify-content: center;
}

.profil-dropdown {
  border: 1px solid rgba(255, 255, 255, 0.1);
}

@media (max-width: 767px) {
  .header-inner {
    padding: 0 10px;
    gap: 8px;
  }
  .header-left {
    gap: 4px;
  }
  .logo {
    height: 28px;
  }
  .header-right-group {
    gap: 8px;
  }
  .search-container,
  .search-container:focus-within {
    flex: 1;
    width: auto;
    min-width: 0;
  }
  .search-pill {
    height: 36px;
    padding: 0 10px;
  }
  .search-dropdown {
    position: fixed;
    top: 66px;
    left: 10px;
    right: 10px;
  }
  .user-pill {
    padding: 3px;
  }
}
</style>
