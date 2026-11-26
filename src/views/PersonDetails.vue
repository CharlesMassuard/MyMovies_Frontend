<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import noPoster from '../assets/noPosterAvailable.webp';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const personId = computed(() => route.params.id);

const isLoading = ref(true);
const personDetails = ref({});
const castCredits = ref([]);
const crewCredits = ref([]);
const externalIds = ref({});
const showFullBio = ref(false);
const activeRoleFilter = ref('all'); // 'all' | 'directing' | 'acting' | 'crew'
const filmographyQuery = ref('');

const knownForScrollRef = ref(null);

const scrollKnownFor = (dir) => {
  const el = knownForScrollRef.value;
  if (!el) return;
  el.scrollBy({ left: dir === 'next' ? 540 : -540, behavior: 'smooth' });
};

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
    const rawCast = response.data.cast || [];
    const rawCrew = response.data.crew || [];

    // Deduplicate cast by media_type + id
    const seenCast = new Set();
    castCredits.value = rawCast
      .filter(item => {
        const k = `${item.media_type}-${item.id}`;
        if (seenCast.has(k)) return false;
        seenCast.add(k);
        return true;
      })
      .map(item => ({ ...item, creditRole: 'acting', roleLabel: item.character || '' }));

    // Merge multiple crew jobs on the same work
    const crewMap = new Map();
    rawCrew.forEach(item => {
      const k = `${item.media_type}-${item.id}`;
      if (!crewMap.has(k)) {
        crewMap.set(k, {
          ...item,
          jobs: [item.job].filter(Boolean),
          isDirector: item.job === 'Director'
        });
      } else {
        const existing = crewMap.get(k);
        if (item.job && !existing.jobs.includes(item.job)) {
          existing.jobs.push(item.job);
        }
        if (item.job === 'Director') existing.isDirector = true;
      }
    });

    crewCredits.value = Array.from(crewMap.values()).map(item => ({
      ...item,
      creditRole: item.isDirector ? 'directing' : 'crew',
      roleLabel: item.jobs.join(', ')
    }));
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

const directingCredits = computed(() => crewCredits.value.filter(c => c.isDirector));
const otherCrewCredits = computed(() => crewCredits.value.filter(c => !c.isDirector));

const allMergedCredits = computed(() => {
  const map = new Map();
  // Prioritize directing/crew if person is primarily a director
  const ordered =
    personDetails.value.known_for_department === 'Directing' || route.path.startsWith('/director/')
      ? [...crewCredits.value, ...castCredits.value]
      : [...castCredits.value, ...crewCredits.value];

  ordered.forEach(item => {
    const k = `${item.media_type}-${item.id}`;
    if (!map.has(k)) {
      map.set(k, item);
    }
  });
  return Array.from(map.values());
});

const knownForWorks = computed(() => {
  const source =
    personDetails.value.known_for_department === 'Directing' && directingCredits.value.length > 0
      ? directingCredits.value
      : allMergedCredits.value;

  return [...source]
    .filter(item => item.poster_path)
    .sort((a, b) => (b.vote_count || 0) * 0.2 + (b.popularity || 0) - ((a.vote_count || 0) * 0.2 + (a.popularity || 0)))
    .slice(0, 14);
});

const topBackdrop = computed(() => {
  const topMedia = knownForWorks.value.find(m => m.backdrop_path) || allMergedCredits.value.find(m => m.backdrop_path);
  return topMedia ? `https://image.tmdb.org/t/p/original${topMedia.backdrop_path}` : null;
});

const filteredFilmographySource = computed(() => {
  let list = allMergedCredits.value;
  if (activeRoleFilter.value === 'directing') list = directingCredits.value;
  else if (activeRoleFilter.value === 'acting') list = castCredits.value;
  else if (activeRoleFilter.value === 'crew') list = otherCrewCredits.value;

  const q = filmographyQuery.value.trim().toLowerCase();
  if (!q) return list;
  return list.filter(
    item =>
      (item.title || item.name || '').toLowerCase().includes(q) ||
      (item.roleLabel || '').toLowerCase().includes(q)
  );
});

const groupedFilmography = computed(() => {
  const groups = {};

  filteredFilmographySource.value.forEach(media => {
    const dateStr = media.release_date || media.first_air_date;
    const year = dateStr ? dateStr.substring(0, 4) : t('common.upcomingShort');
    if (!groups[year]) groups[year] = [];
    groups[year].push(media);
  });

  return Object.keys(groups)
    .sort((a, b) => {
      if (a === t('common.upcomingShort')) return -1;
      if (b === t('common.upcomingShort')) return 1;
      return Number(b) - Number(a);
    })
    .map(year => ({
      year,
      items: groups[year].sort((a, b) => (b.popularity || 0) - (a.popularity || 0))
    }));
});

const roleFilterTabs = computed(() => {
  const list = [{ id: 'all', label: t('library.allStatus'), count: allMergedCredits.value.length }];
  if (directingCredits.value.length > 0) {
    list.push({ id: 'directing', label: t('media.direction'), count: directingCredits.value.length });
  }
  if (castCredits.value.length > 0) {
    list.push({ id: 'acting', label: t('person.acting'), count: castCredits.value.length });
  }
  if (otherCrewCredits.value.length > 0) {
    list.push({ id: 'crew', label: t('person.crew'), count: otherCrewCredits.value.length });
  }
  return list;
});

const departmentLabel = computed(() => {
  const dept = personDetails.value.known_for_department;
  if (dept === 'Directing') return t('person.director');
  if (dept === 'Acting') return t('person.actor');
  if (dept === 'Writing') return t('person.writer');
  if (dept === 'Production') return t('person.producer');
  return dept || '';
});

const getGender = (id) => {
  switch (id) {
    case 1: return t('person.female');
    case 2: return t('person.male');
    case 3: return t('person.nonBinary');
    default: return t('person.unspecified');
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
  if (m < 0 || (m === 0 && endDate.getDate() < birthDate.getDate())) age--;
  return age;
};

const goToMedia = (item) => {
  const type = item.media_type === 'tv' ? 'serie' : 'movie';
  router.push(`/${type}/${item.id}`);
};

const loadData = async () => {
  isLoading.value = true;
  await Promise.all([fetchPersonDetails(), fetchPersonCredits(), fetchExternalIds()]);
  if (route.path.startsWith('/director/') && directingCredits.value.length > 0) {
    activeRoleFilter.value = 'directing';
  } else {
    activeRoleFilter.value = 'all';
  }
  isLoading.value = false;
};

onMounted(loadData);

watch(
  () => personId.value,
  () => {
    if (!personId.value) return;
    showFullBio.value = false;
    loadData();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
);
</script>

<template>
  <div class="person-page">
    <!-- Hero Backdrop -->
    <div class="hero-banner">
      <div
        v-if="topBackdrop"
        class="hero-bg"
        :style="{ backgroundImage: `url(${topBackdrop})` }"
      ></div>
      <div class="hero-overlay"></div>
    </div>

    <v-container class="content-container pb-16">
      <!-- Skeleton Loading -->
      <v-row v-if="isLoading">
        <v-col cols="12" md="3">
          <v-skeleton-loader type="image" height="390" class="rounded-xl mb-4" />
          <v-skeleton-loader type="paragraph" class="rounded-xl" />
        </v-col>
        <v-col cols="12" md="9" class="px-md-8 pt-md-6">
          <v-skeleton-loader type="chip" width="120" class="mb-4" />
          <v-skeleton-loader type="heading" width="340" class="mb-6" />
          <v-skeleton-loader type="paragraph" class="mb-10" />
          <v-row>
            <v-col v-for="n in 4" :key="n" cols="6" sm="3">
              <v-skeleton-loader type="image" height="230" class="rounded-xl" />
            </v-col>
          </v-row>
        </v-col>
      </v-row>

      <!-- Content -->
      <v-row v-else-if="personDetails.name">
        <!-- Left Sidebar -->
        <v-col cols="12" md="3" class="sidebar-col">
          <div class="profile-card rounded-xl overflow-hidden">
            <v-img
              :src="personDetails.profile_path ? `https://image.tmdb.org/t/p/w500${personDetails.profile_path}` : noPoster"
              :alt="personDetails.name"
              cover
              height="390"
              class="portrait-img"
            />

            <div class="pa-5">
              <!-- Social Links -->
              <div
                v-if="externalIds.instagram_id || externalIds.twitter_id || externalIds.imdb_id"
                class="social-links d-flex justify-center ga-3 mb-5 pb-4"
              >
                <v-btn
                  v-if="externalIds.instagram_id"
                  :href="`https://instagram.com/${externalIds.instagram_id}`"
                  target="_blank"
                  icon
                  variant="tonal"
                  size="small"
                  color="#8C52FF"
                  v-tooltip="'Instagram'"
                >
                  <v-icon>mdi-instagram</v-icon>
                </v-btn>
                <v-btn
                  v-if="externalIds.twitter_id"
                  :href="`https://twitter.com/${externalIds.twitter_id}`"
                  target="_blank"
                  icon
                  variant="tonal"
                  size="small"
                  color="#8C52FF"
                  v-tooltip="'Twitter'"
                >
                  <v-icon>mdi-twitter</v-icon>
                </v-btn>
                <v-btn
                  v-if="externalIds.imdb_id"
                  :href="`https://www.imdb.com/name/${externalIds.imdb_id}`"
                  target="_blank"
                  icon
                  variant="tonal"
                  size="small"
                  color="#8C52FF"
                  v-tooltip="'IMDb'"
                >
                  <v-icon>mdi-movie-roll</v-icon>
                </v-btn>
              </div>

              <h3 class="text-subtitle-1 font-weight-bold mb-4">{{ $t('person.personalInfo') }}</h3>

              <div class="info-list">
                <div v-if="departmentLabel" class="info-item">
                  <span class="info-label">{{ $t('person.job') }}</span>
                  <span class="info-val">{{ departmentLabel }}</span>
                </div>

                <div v-if="personDetails.gender" class="info-item">
                  <span class="info-label">{{ $t('person.gender') }}</span>
                  <span class="info-val">{{ getGender(personDetails.gender) }}</span>
                </div>

                <div v-if="personDetails.birthday" class="info-item">
                  <span class="info-label">{{ $t('person.birth') }}</span>
                  <span class="info-val">
                    {{ formatDate(personDetails.birthday) }}
                    <span v-if="!personDetails.deathday" class="opacity-65">
                      ({{ calculateAge(personDetails.birthday) }} {{ $t('common.yearsOld') }})
                    </span>
                  </span>
                </div>

                <div v-if="personDetails.deathday" class="info-item">
                  <span class="info-label">{{ $t('person.death') }}</span>
                  <span class="info-val">
                    {{ formatDate(personDetails.deathday) }}
                    <span class="opacity-65">
                      ({{ calculateAge(personDetails.birthday, personDetails.deathday) }} {{ $t('common.yearsOld') }})
                    </span>
                  </span>
                </div>

                <div v-if="personDetails.place_of_birth" class="info-item">
                  <span class="info-label">{{ $t('person.birthPlace') }}</span>
                  <span class="info-val">{{ personDetails.place_of_birth }}</span>
                </div>
              </div>
            </div>
          </div>
        </v-col>

        <!-- Right Main Content -->
        <v-col cols="12" md="9" class="px-md-8 pt-md-4">
          <!-- Name + Role Pills -->
          <div class="d-flex align-center flex-wrap ga-2 mb-3">
            <span v-if="departmentLabel" class="dept-pill">
              {{ departmentLabel }}
            </span>
            <span v-if="directingCredits.length > 0" class="stat-pill">
              <v-icon size="14" class="mr-1">mdi-movie-open-star-outline</v-icon>
              {{ directingCredits.length }} {{ $t('person.directedCount') }}
            </span>
            <span v-if="castCredits.length > 0" class="stat-pill">
              <v-icon size="14" class="mr-1">mdi-account-star-outline</v-icon>
              {{ castCredits.length }} {{ $t('person.actedCount') }}
            </span>
          </div>

          <h1 class="person-name mb-5">{{ personDetails.name }}</h1>

          <!-- Biography -->
          <div class="mb-10">
            <div v-if="personDetails.biography">
              <p class="biography-text" :class="{ 'bio-collapsed': !showFullBio }">
                {{ personDetails.biography }}
              </p>
              <v-btn
                v-if="personDetails.biography.length > 450"
                variant="tonal"
                color="#8C52FF"
                rounded="pill"
                size="small"
                class="text-none font-weight-semibold mt-3 px-4"
                @click="showFullBio = !showFullBio"
              >
                {{ showFullBio ? $t('common.readLess') : $t('common.readMore') }}
                <v-icon end size="16">{{ showFullBio ? 'mdi-chevron-up' : 'mdi-chevron-down' }}</v-icon>
              </v-btn>
            </div>
            <p v-else class="opacity-60 font-italic">{{ $t('person.noBiography') }}</p>
          </div>

          <!-- Known For Carousel -->
          <div v-if="knownForWorks.length > 0" class="mb-12">
            <div class="d-flex align-center justify-space-between mb-4">
              <h2 class="text-h5 font-weight-bold d-flex align-center ga-2">
                <v-icon color="#8C52FF" size="24">mdi-star-shooting</v-icon>
                {{ $t('media.knownFor') }}
              </h2>
              <div class="d-flex ga-2">
                <v-btn icon="mdi-chevron-left" variant="tonal" size="small" rounded="circle" @click="scrollKnownFor('prev')" />
                <v-btn icon="mdi-chevron-right" variant="tonal" size="small" rounded="circle" @click="scrollKnownFor('next')" />
              </div>
            </div>

            <div ref="knownForScrollRef" class="known-for-track">
              <div
                v-for="media in knownForWorks"
                :key="`kf-${media.media_type}-${media.id}`"
                class="known-for-card rounded-xl overflow-hidden"
                @click="goToMedia(media)"
              >
                <div class="known-for-poster">
                  <v-img
                    :src="media.poster_path ? `https://image.tmdb.org/t/p/w300${media.poster_path}` : noPoster"
                    aspect-ratio="2/3"
                    cover
                  />
                  <span v-if="media.vote_average > 0" class="kf-rating">
                    <v-icon size="11" color="#fbbf24" class="mr-1">mdi-star</v-icon>
                    {{ (Math.round(media.vote_average * 10) / 10).toFixed(1) }}
                  </span>
                </div>
                <div class="pa-3">
                  <p class="font-weight-bold text-body-2 mb-1 text-truncate" :title="media.title || media.name">
                    {{ media.title || media.name }}
                  </p>
                  <p v-if="media.roleLabel" class="text-caption opacity-70 mb-0 text-truncate" :title="media.roleLabel">
                    {{ media.roleLabel }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Filmography Section -->
          <div v-if="allMergedCredits.length > 0">
            <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4 mb-5">
              <h2 class="text-h5 font-weight-bold d-flex align-center ga-2">
                <v-icon color="#8C52FF" size="24">mdi-movie-open-outline</v-icon>
                {{ $t('media.filmography') }}
              </h2>

              <!-- Role Filter Pills -->
              <div v-if="roleFilterTabs.length > 1" class="role-filter-group">
                <button
                  v-for="tab in roleFilterTabs"
                  :key="tab.id"
                  type="button"
                  class="role-filter-btn"
                  :class="{ 'role-filter-active': activeRoleFilter === tab.id }"
                  @click="activeRoleFilter = tab.id"
                >
                  {{ tab.label }}
                  <span class="role-count">{{ tab.count }}</span>
                </button>
              </div>
            </div>

            <!-- Quick Filmography Filter -->
            <div v-if="allMergedCredits.length > 10" class="mb-6" style="max-width: 360px;">
              <v-text-field
                v-model="filmographyQuery"
                :placeholder="$t('person.filterFilmography')"
                prepend-inner-icon="mdi-magnify"
                variant="outlined"
                density="compact"
                rounded="pill"
                clearable
                hide-details
              />
            </div>

            <div class="filmography-container">
              <div v-for="group in groupedFilmography" :key="group.year" class="year-group mb-7">
                <div class="d-flex align-center mb-3">
                  <span class="year-pill mr-3">{{ group.year }}</span>
                  <div class="year-line"></div>
                </div>

                <div class="filmography-card rounded-xl overflow-hidden">
                  <div
                    v-for="(media, index) in group.items"
                    :key="`${media.media_type}-${media.id}-${index}`"
                    class="filmography-row"
                    @click="goToMedia(media)"
                  >
                    <img
                      :src="media.poster_path ? `https://image.tmdb.org/t/p/w92${media.poster_path}` : noPoster"
                      :alt="media.title || media.name"
                      class="filmo-poster"
                    />

                    <div class="filmo-info">
                      <div class="filmo-title">{{ media.title || media.name }}</div>
                      <div class="filmo-sub">
                        <span
                          class="filmo-type"
                          :class="media.media_type === 'tv' ? 'type-tv' : 'type-movie'"
                        >
                          {{ media.media_type === 'tv' ? $t('common.series') : $t('common.movie') }}
                        </span>
                        <span v-if="media.creditRole === 'acting' && media.roleLabel" class="filmo-role">
                          {{ $t('common.asCharacter') }} <strong class="role-highlight">{{ media.roleLabel }}</strong>
                        </span>
                        <span v-else-if="media.roleLabel" class="filmo-role">
                          <strong class="role-highlight">{{ media.roleLabel }}</strong>
                        </span>
                      </div>
                    </div>

                    <div class="d-flex align-center ga-3 flex-shrink-0">
                      <span v-if="media.vote_average > 0" class="filmo-rating d-none d-sm-inline-flex">
                        <v-icon size="13" color="#fbbf24" class="mr-1">mdi-star</v-icon>
                        {{ (Math.round(media.vote_average * 10) / 10).toFixed(1) }}
                      </span>
                      <v-icon size="18" class="opacity-50">mdi-chevron-right</v-icon>
                    </div>
                  </div>
                </div>
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
  background-color: var(--app-background);
  min-height: 100vh;
  position: relative;
}

.hero-banner {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 360px;
  overflow: hidden;
  z-index: 0;
}

.hero-bg {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center 20%;
  filter: blur(22px) brightness(0.45);
  transform: scale(1.12);
}

.hero-overlay {
  position: absolute;
  inset: 0;
  background: linear-gradient(to bottom, rgba(15, 16, 21, 0.35) 0%, var(--app-background) 100%);
}

.content-container {
  position: relative;
  z-index: 1;
  max-width: 1360px;
  padding-top: 104px;
}

.sidebar-col {
  position: sticky;
  top: 88px;
  align-self: flex-start;
}

.profile-card {
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.25);
}

:root[data-theme='light'] .profile-card {
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.06);
}

.portrait-img {
  background: rgba(255, 255, 255, 0.04);
}

.social-links {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .social-links {
  border-bottom-color: rgba(0, 0, 0, 0.08);
}

.info-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.info-label {
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.55;
}

.info-val {
  font-size: 0.9rem;
  font-weight: 600;
}

.dept-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 700;
  background: rgba(140, 82, 255, 0.18);
  border: 1px solid rgba(140, 82, 255, 0.35);
  color: #c4a7ff;
}

:root[data-theme='light'] .dept-pill {
  color: #6b21a8;
}

.stat-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 600;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:root[data-theme='light'] .stat-pill {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

.person-name {
  font-size: clamp(2rem, 4vw, 3.1rem);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1.1;
}

.biography-text {
  font-size: 0.98rem;
  line-height: 1.75;
  opacity: 0.88;
  white-space: pre-line;
}

.bio-collapsed {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* Known For Horizontal Track */
.known-for-track {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 10px;
  scrollbar-width: none;
}

.known-for-track::-webkit-scrollbar {
  display: none;
}

.known-for-card {
  width: 155px;
  flex-shrink: 0;
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease;
}

:root[data-theme='light'] .known-for-card {
  border-color: rgba(0, 0, 0, 0.08);
}

.known-for-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.3);
}

.known-for-poster {
  position: relative;
}

.kf-rating {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.7rem;
  font-weight: 700;
  background: rgba(15, 16, 21, 0.84);
  color: #ffffff;
}

/* Role Filter Pills */
.role-filter-group {
  display: inline-flex;
  flex-wrap: wrap;
  gap: 6px;
}

.role-filter-btn {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: var(--app-surface);
  color: inherit;
  font-size: 0.8rem;
  font-weight: 600;
  opacity: 0.75;
  cursor: pointer;
  transition: all 0.2s ease;
}

:root[data-theme='light'] .role-filter-btn {
  border-color: rgba(0, 0, 0, 0.1);
}

.role-filter-btn:hover {
  opacity: 1;
}

.role-filter-active {
  background: #8C52FF;
  border-color: #8C52FF;
  color: #ffffff;
  opacity: 1;
}

.role-count {
  font-size: 0.7rem;
  padding: 1px 6px;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.15);
}

/* Filmography Timeline */
.year-pill {
  font-size: 0.85rem;
  font-weight: 800;
  padding: 3px 12px;
  border-radius: 999px;
  background: rgba(140, 82, 255, 0.16);
  color: #c4a7ff;
}

:root[data-theme='light'] .year-pill {
  color: #6b21a8;
}

.year-line {
  flex: 1;
  height: 1px;
  background: rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .year-line {
  background: rgba(0, 0, 0, 0.08);
}

.filmography-card {
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .filmography-card {
  border-color: rgba(0, 0, 0, 0.08);
}

.filmography-row {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
  cursor: pointer;
  transition: background 0.15s ease;
}

:root[data-theme='light'] .filmography-row {
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

.filmography-row:last-child {
  border-bottom: none;
}

.filmography-row:hover {
  background: rgba(140, 82, 255, 0.09);
}

.filmo-poster {
  width: 42px;
  height: 62px;
  object-fit: cover;
  border-radius: 7px;
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.06);
}

.filmo-info {
  flex: 1;
  min-width: 0;
}

.filmo-title {
  font-size: 0.95rem;
  font-weight: 700;
  margin-bottom: 4px;
}

.filmo-sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
  font-size: 0.82rem;
}

.filmo-type {
  font-size: 0.68rem;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  color: #ffffff;
  text-transform: uppercase;
}

.type-movie {
  background: #3b82f6;
}

.type-tv {
  background: #8C52FF;
}

.filmo-role {
  color: inherit;
  opacity: 0.78;
}

.role-highlight {
  color: inherit;
  opacity: 1;
  font-weight: 600;
}

.filmo-rating {
  display: inline-flex;
  align-items: center;
  font-size: 0.82rem;
  font-weight: 600;
  opacity: 0.85;
}

@media (max-width: 960px) {
  .sidebar-col {
    position: static;
  }
}
</style>
