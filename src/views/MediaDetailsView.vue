<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useMediaDetails } from '../composables/useMediaDetails';

// Modales
import ConfirmationDialog from '../components/ConfirmationDialog.vue';
import AuthDialog from '../components/AuthDialog.vue';
import DateDialog from '../components/DateDialog.vue';
import RatingDialog from '../components/RatingDialog.vue';
import TrailerDialog from '../components/TrailerDialog.vue';
import WatchHistoryDialog from '../components/WatchHistoryDialog.vue';

// Composants Media partagés
import MediaSkeletonLoader from '../components/MediaSkeletonLoader.vue';
import MediaHero from '../components/media/MediaHero.vue';
import MediaOverviewTab from '../components/media/MediaOverviewTab.vue';
import MediaSagaTab from '../components/media/MediaSagaTab.vue';
import MediaGalleryTab from '../components/media/MediaGalleryTab.vue';
import MediaDetailsTab from '../components/media/MediaDetailsTab.vue';
import CastCarousel from '../components/CastCarousel.vue';
import SimilarMediaCarousel from '../components/SimilarMediaCarousel.vue';
import EpisodeNextLast from '../components/EpisodeNextLast.vue';
import SeasonCarousel from '../components/SeasonCarousel.vue';
import SeasonEpisodesList from '../components/SeasonEpisodesList.vue';

const props = defineProps({
  mediaType: {
    type: String,
    required: true,
    validator: (v) => ['movie', 'serie'].includes(v)
  }
});

const route = useRoute();
const { t } = useI18n();

const mediaTypeRef = computed(() => props.mediaType);
const mediaId = computed(() => route.params.id);

const {
  isMovie,
  isLoading,
  details,
  credits,
  similarMedia,
  watchProviders,
  videos,
  trailerKey,
  collectionDetails,
  libraryStatusMap,
  dialogTrailer,
  dialogConfirmation,
  dialogDate,
  dialogNote,
  dialogAuth,
  dialogHistory,
  authMessage,
  historyTab,
  userRating,
  userComment,
  statusUserMedia,
  selectedSeasonInfo,
  loadingSeason,
  activeSeasonNumber,
  title,
  isReleased,
  statusBadge,
  logoPath,
  certification,
  directors,
  writers,
  creators,
  periodYears,
  releaseDateFormatted,
  runtimeFormatted,
  runtimeFullFormatted,
  allGenres,
  textButtonStatus,
  itemsStatus,
  displayRating,
  checkAuth,
  fetchStatusUserMedia,
  fetchSeasonDetails,
  handleMainButtonClick,
  updateStatus,
  confirmDelete,
  handleDateConfirm,
  saveRating,
  resetAndLoad
} = useMediaDetails(mediaTypeRef, mediaId);

const activeSection = ref('overview');
const activeTrailerKey = ref(null);
let observer = null;

const sections = computed(() => {
  const list = [{ id: 'overview', label: t('media.tabs.overview') }];
  if (!isMovie.value && details.value.seasons?.length) {
    list.push({ id: 'seasons', label: t('episodes.seasons') });
  }
  if (credits.value.cast?.length) {
    list.push({ id: 'cast', label: t('media.tabs.cast') });
  }
  if (isMovie.value && collectionDetails.value?.parts?.length > 1) {
    list.push({ id: 'saga', label: t('media.saga') });
  }
  list.push({ id: 'gallery', label: t('media.tabs.gallery') });
  list.push({ id: 'details', label: t('common.details') });
  if (similarMedia.value?.length) {
    list.push({ id: 'similar', label: t('media.tabs.similar') });
  }
  return list;
});

const scrollToSection = (sectionId) => {
  activeSection.value = sectionId;
  const el = document.getElementById(`section-${sectionId}`);
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
};

const setupScrollObserver = () => {
  if (observer) observer.disconnect();
  observer = new IntersectionObserver(
    (entries) => {
      const visible = entries.filter(e => e.isIntersecting);
      if (visible.length > 0) {
        const topMost = visible.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        activeSection.value = topMost.target.id.replace('section-', '');
      }
    },
    { rootMargin: '-140px 0px -55% 0px', threshold: 0.05 }
  );

  sections.value.forEach((sec) => {
    const el = document.getElementById(`section-${sec.id}`);
    if (el) observer.observe(el);
  });
};

const openTrailerModal = (key = null) => {
  activeTrailerKey.value = key || trailerKey.value;
  if (activeTrailerKey.value) {
    dialogTrailer.value = true;
  }
};

watch([isLoading, sections], async ([loading]) => {
  if (!loading) {
    await nextTick();
    setupScrollObserver();
  }
});

watch([mediaId, mediaTypeRef], () => {
  activeSection.value = 'overview';
});

onMounted(resetAndLoad);

onUnmounted(() => {
  if (observer) observer.disconnect();
});
</script>

<template>
  <div class="media-page">
    <MediaSkeletonLoader v-if="isLoading" />

    <div v-else-if="title">
      <!-- Hero Banner -->
      <MediaHero
        :backdropPath="details.backdrop_path"
        :posterPath="details.poster_path"
        :logoPath="logoPath"
        :title="title"
        :isMovie="isMovie"
        :periodYears="periodYears"
        :certification="certification"
        :voteAverage="details.vote_average"
        :statusBadge="statusBadge"
        :runtimeFormatted="runtimeFormatted"
        :genres="allGenres"
        :creators="creators"
        :overview="details.overview"
        :seasonsCount="details.number_of_seasons"
        :episodesCount="details.number_of_episodes"
        :statusUserMedia="statusUserMedia"
        :textButtonStatus="textButtonStatus"
        :itemsStatus="itemsStatus"
        :displayRating="displayRating"
        :showRatingButton="isReleased"
        :trailerKey="trailerKey"
        @main-click="handleMainButtonClick"
        @update-status="updateStatus"
        @open-rating="
          checkAuth(isMovie ? $t('media.authRateMovie') : $t('media.authRateSeries'))
            ? (dialogNote = true)
            : null
        "
        @open-trailer="openTrailerModal()"
      />

      <!-- Sticky Anchor Navigation Bar -->
      <div class="tabs-bar-wrapper">
        <v-container class="tabs-container py-0">
          <div class="tabs-list" role="navigation">
            <button
              v-for="sec in sections"
              :key="sec.id"
              type="button"
              class="tab-btn"
              :class="{ 'tab-btn-active': activeSection === sec.id }"
              @click="scrollToSection(sec.id)"
            >
              {{ sec.label }}
            </button>
          </div>
        </v-container>
      </div>

      <!-- Sequential Sections -->
      <v-container class="sections-container py-8">
        <!-- Aperçu -->
        <section id="section-overview" class="media-section">
          <MediaOverviewTab
            :isMovie="isMovie"
            :details="details"
            :directors="directors"
            :writers="writers"
            :creators="creators"
            :runtimeFullFormatted="runtimeFullFormatted"
            :releaseDateFormatted="releaseDateFormatted"
            :periodYears="periodYears"
            :certification="certification"
            :statusBadge="statusBadge"
            :watchProviders="watchProviders"
          />

          <!-- User Personal Rating / Review Card (if rated or commented) -->
          <div v-if="userRating > 0 || userComment" class="user-review-card rounded-xl pa-5 mt-8">
            <div class="d-flex align-center justify-space-between flex-wrap ga-3 mb-2">
              <div class="d-flex align-center ga-3">
                <span class="review-title">{{ $t('media.yourRating') }}</span>
                <span v-if="userRating > 0" class="review-score-pill">
                  <v-icon size="15" color="#fbbf24" class="mr-1">mdi-star</v-icon>
                  {{ userRating }} / 10
                </span>
              </div>
              <v-btn
                variant="text"
                size="small"
                color="#8C52FF"
                class="text-none font-weight-semibold"
                prepend-icon="mdi-pencil-outline"
                @click="dialogNote = true"
              >
                {{ $t('profile.editBtn') }}
              </v-btn>
            </div>
            <p v-if="userComment" class="text-body-2 opacity-85 mb-0 review-comment">
              « {{ userComment }} »
            </p>
          </div>

          <div v-if="!isMovie" class="mt-8">
            <EpisodeNextLast
              :lastEpisode="details.last_episode_to_air"
              :nextEpisode="details.next_episode_to_air"
            />
          </div>
        </section>

        <!-- Saisons (Séries) -->
        <section
          v-if="!isMovie && details.seasons?.length"
          id="section-seasons"
          class="media-section"
        >
          <v-divider class="section-divider mb-10" />
          <SeasonCarousel
            :seasons="details.seasons"
            :totalSeasons="details.number_of_seasons"
            :activeSeasonNumber="activeSeasonNumber"
            @select-season="fetchSeasonDetails"
          />
          <SeasonEpisodesList
            :seasonInfo="selectedSeasonInfo"
            :loading="loadingSeason"
            :serieId="mediaId"
            @close="selectedSeasonInfo = null; activeSeasonNumber = null"
          />
        </section>

        <!-- Distribution (Têtes d'affiche & Équipe) -->
        <section
          v-if="credits.cast?.length"
          id="section-cast"
          class="media-section"
        >
          <v-divider class="section-divider mb-10" />
          <CastCarousel :cast="credits.cast" :crew="credits.crew" />
        </section>

        <!-- Saga (après Têtes d'affiche) -->
        <section
          v-if="isMovie && collectionDetails?.parts?.length > 1"
          id="section-saga"
          class="media-section"
        >
          <v-divider class="section-divider mb-10" />
          <MediaSagaTab
            :collection="collectionDetails"
            :currentMovieId="mediaId"
            :libraryStatusMap="libraryStatusMap"
          />
        </section>

        <!-- Vidéos et images -->
        <section id="section-gallery" class="media-section">
          <v-divider class="section-divider mb-10" />
          <MediaGalleryTab
            :videos="videos"
            :images="details.images"
            @play-video="openTrailerModal"
          />
        </section>

        <!-- Détails -->
        <section id="section-details" class="media-section">
          <v-divider class="section-divider mb-10" />
          <MediaDetailsTab
            :isMovie="isMovie"
            :details="details"
            :statusBadge="statusBadge"
            :watchProviders="watchProviders"
          />
        </section>

        <!-- Similaires -->
        <section
          v-if="similarMedia?.length"
          id="section-similar"
          class="media-section"
        >
          <v-divider class="section-divider mb-10" />
          <SimilarMediaCarousel
            :mediaList="similarMedia"
            :mediaType="mediaType"
            :libraryStatusMap="libraryStatusMap"
          />
        </section>
      </v-container>
    </div>
  </div>

  <!-- Shared Dialogs -->
  <ConfirmationDialog
    v-model="dialogConfirmation"
    :title="isMovie ? $t('media.deleteMovie') : $t('media.deleteSeries')"
    :message="isMovie ? $t('media.deleteQuestionMovie') : $t('media.deleteQuestionSeries')"
    :confirm-text="$t('common.delete')"
    :cancel-text="$t('common.cancel')"
    @confirm="confirmDelete"
  />
  <DateDialog
    v-model="dialogDate"
    :title="(isMovie ? $t('media.watchedOn') : $t('media.finishedOn')) + ' ?'"
    @confirm="handleDateConfirm"
  />
  <RatingDialog
    v-model="dialogNote"
    :title="isMovie ? $t('media.rateMovie') : $t('media.rateSeries')"
    :placeholder="isMovie ? $t('media.reviewMovie') : $t('media.reviewSeries')"
    :initial-rating="userRating"
    :initial-comment="userComment"
    @save="saveRating"
  />
  <AuthDialog v-model="dialogAuth" :message="authMessage" />
  <TrailerDialog v-model="dialogTrailer" :videoKey="activeTrailerKey" />
  <WatchHistoryDialog
    v-model="dialogHistory"
    :mediaId="mediaId"
    :mediaType="mediaType"
    :defaultTab="historyTab"
    @history-updated="fetchStatusUserMedia"
  />
</template>

<style scoped>
.media-page {
  background: var(--app-background);
  min-height: 100vh;
}

.tabs-bar-wrapper {
  position: sticky;
  top: 68px;
  z-index: 900;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: rgba(15, 16, 21, 0.84);
  backdrop-filter: blur(14px);
  -webkit-backdrop-filter: blur(14px);
}

:root[data-theme='light'] .tabs-bar-wrapper {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  background: rgba(255, 255, 255, 0.88);
}

.tabs-container,
.sections-container {
  max-width: 1360px;
}

.tabs-list {
  display: flex;
  align-items: center;
  gap: 28px;
  overflow-x: auto;
  scrollbar-width: none;
}

.tabs-list::-webkit-scrollbar {
  display: none;
}

.tab-btn {
  position: relative;
  background: transparent;
  border: none;
  padding: 15px 2px;
  font-size: 0.92rem;
  font-weight: 500;
  color: inherit;
  opacity: 0.62;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.2s ease, color 0.2s ease;
}

.tab-btn:hover {
  opacity: 0.92;
}

.tab-btn-active {
  opacity: 1;
  font-weight: 600;
}

.tab-btn-active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 2px;
  background: #8C52FF;
  border-radius: 2px 2px 0 0;
}

.media-section {
  scroll-margin-top: 138px;
  margin-bottom: 48px;
}

.section-divider {
  opacity: 0.08;
}

.user-review-card {
  background: rgba(140, 82, 255, 0.08);
  border: 1px solid rgba(140, 82, 255, 0.25);
}

.review-title {
  font-size: 0.95rem;
  font-weight: 700;
}

.review-score-pill {
  display: inline-flex;
  align-items: center;
  padding: 3px 10px;
  border-radius: 999px;
  font-size: 0.8rem;
  font-weight: 700;
  background: rgba(251, 191, 36, 0.16);
  color: #fbbf24;
}

.review-comment {
  font-style: italic;
  line-height: 1.6;
}
</style>
