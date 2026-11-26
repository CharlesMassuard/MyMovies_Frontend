<script setup>
import { ref } from 'vue';

defineProps({
  backdropPath: String,
  posterPath: String,
  logoPath: String,
  title: { type: String, default: '' },
  isMovie: { type: Boolean, default: true },
  periodYears: { type: String, default: '' },
  certification: { type: String, default: null },
  voteAverage: { type: Number, default: 0 },
  statusBadge: { type: Object, default: null },
  runtimeFormatted: { type: String, default: null },
  genres: { type: String, default: '' },
  creators: { type: Array, default: () => [] },
  overview: { type: String, default: '' },
  seasonsCount: { type: Number, default: 0 },
  episodesCount: { type: Number, default: 0 },
  statusUserMedia: { type: String, required: true },
  textButtonStatus: { type: Object, required: true },
  itemsStatus: { type: Array, required: true },
  displayRating: { type: String, required: true },
  showRatingButton: { type: Boolean, default: true },
  trailerKey: { type: String, default: null }
});

defineEmits(['main-click', 'update-status', 'open-rating', 'open-trailer']);

const copied = ref(false);

const shareLink = async () => {
  try {
    if (navigator.share) {
      await navigator.share({ url: window.location.href });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      copied.value = true;
      setTimeout(() => (copied.value = false), 2200);
    }
  } catch {
    // User cancelled share dialog
  }
};
</script>

<template>
  <section class="media-hero">
    <!-- Full-bleed Backdrop -->
    <div
      class="hero-backdrop"
      :style="
        backdropPath
          ? { backgroundImage: `url(https://image.tmdb.org/t/p/original${backdropPath})` }
          : posterPath
          ? { backgroundImage: `url(https://image.tmdb.org/t/p/original${posterPath})` }
          : {}
      "
    ></div>

    <!-- Gradients & Bottom Blur Fade -->
    <div class="hero-gradient-left"></div>
    <div class="hero-gradient-bottom"></div>
    <div class="hero-bottom-blur"></div>

    <!-- Hero Content -->
    <v-container class="hero-content-container">
      <div class="hero-inner">
        <!-- Pill Badges Row -->
        <div class="d-flex align-center flex-wrap ga-2 mb-4">
          <span class="hero-pill hero-pill-type">
            {{ isMovie ? $t('common.movie').toUpperCase() : $t('common.series').toUpperCase() }}
          </span>

          <span v-if="periodYears" class="hero-pill">
            {{ periodYears }}
          </span>

          <span v-if="certification" class="hero-pill">
            {{ certification }}
          </span>

          <span v-if="voteAverage > 0" class="hero-pill hero-pill-score">
            <v-icon size="14" color="#fbbf24" class="mr-1">mdi-star</v-icon>
            {{ (Math.round(voteAverage * 10) / 10).toFixed(1).replace('.', ',') }} {{ $t('common.tmdb') }}
          </span>

          <span v-if="statusBadge" class="hero-pill">
            <span class="status-dot" :style="{ backgroundColor: statusBadge.color }"></span>
            {{ statusBadge.text }}
          </span>
        </div>

        <!-- Logo or Title Fallback -->
        <div class="hero-title-area mb-4">
          <img
            v-if="logoPath"
            :src="`https://image.tmdb.org/t/p/w500${logoPath}`"
            :alt="title"
            class="hero-logo"
          />
          <h1 v-else class="hero-title-text">{{ title }}</h1>
        </div>

        <!-- Metadata Line -->
        <div class="hero-meta d-flex align-center flex-wrap ga-2 mb-4">
          <template v-if="isMovie">
            <span v-if="runtimeFormatted">{{ runtimeFormatted }}</span>
          </template>
          <template v-else>
            <span v-if="seasonsCount">
              {{ seasonsCount }} {{ seasonsCount > 1 ? $t('media.seasonsPlural') : $t('media.seasons') }}
            </span>
            <span v-if="seasonsCount && episodesCount" class="meta-dot">•</span>
            <span v-if="episodesCount">{{ episodesCount }} {{ $t('media.episodes') }}</span>
            <template v-if="runtimeFormatted">
              <span class="meta-dot">•</span>
              <span>{{ runtimeFormatted }}</span>
            </template>
          </template>

          <template v-if="genres">
            <span class="meta-dot">•</span>
            <span>{{ genres }}</span>
          </template>

          <template v-if="creators.length > 0">
            <span class="meta-dot">•</span>
            <span class="d-inline-flex flex-wrap ga-1">
              <template v-for="(creator, idx) in creators" :key="creator.id || creator.name">
                <router-link
                  v-if="creator.id"
                  :to="isMovie ? `/director/${creator.id}` : `/person/${creator.id}`"
                  class="creator-link"
                >
                  {{ creator.name }}
                </router-link>
                <span v-else>{{ creator.name }}</span>
                <span v-if="idx < creators.length - 1">,</span>
              </template>
            </span>
          </template>
        </div>

        <!-- Short Clamped Overview -->
        <p v-if="overview" class="hero-overview mb-6">
          {{ overview }}
        </p>

        <!-- Action Buttons -->
        <div class="d-flex align-center flex-wrap flex-md-nowrap ga-3 hero-actions-row">
          <!-- Primary Watchlist Status Button + Menu -->
          <v-menu
            :close-on-content-click="true"
            location="bottom start"
            offset="10"
            :disabled="statusUserMedia === 'UNDEFINED'"
          >
            <template v-slot:activator="{ props }">
              <v-btn
                v-bind="props"
                color="#8C52FF"
                variant="flat"
                rounded="lg"
                height="46"
                class="px-6 font-weight-bold text-none hero-primary-btn"
                @click="$emit('main-click')"
              >
                <v-icon start size="20">{{ textButtonStatus[statusUserMedia].icon }}</v-icon>
                <span>{{ textButtonStatus[statusUserMedia].text }}</span>
                <v-icon v-if="statusUserMedia !== 'UNDEFINED'" end size="18" class="ml-1">
                  mdi-chevron-down
                </v-icon>
              </v-btn>
            </template>

            <v-list class="pa-2" width="300" elevation="12" rounded="xl">
              <v-list-item
                v-for="(item, index) in itemsStatus"
                :key="index"
                rounded="lg"
                class="mb-1"
                @click="$emit('update-status', item.id)"
              >
                <template v-slot:prepend>
                  <v-icon size="small" :icon="item.icon" :color="item.color"></v-icon>
                </template>
                <v-list-item-title
                  class="text-body-2 font-weight-medium"
                  :class="item.color ? `text-${item.color}` : ''"
                >
                  {{ item.text }}
                </v-list-item-title>
              </v-list-item>
            </v-list>
          </v-menu>

          <!-- Trailer Button -->
          <v-btn
            v-if="trailerKey"
            variant="flat"
            rounded="lg"
            height="46"
            class="px-5 font-weight-semibold text-none hero-glass-btn"
            @click="$emit('open-trailer')"
          >
            <v-icon start size="20">mdi-video-outline</v-icon>
            <span>{{ $t('media.trailer') }}</span>
          </v-btn>

          <!-- Rating Button -->
          <v-btn
            v-if="showRatingButton"
            variant="flat"
            rounded="lg"
            height="46"
            class="px-5 font-weight-semibold text-none hero-glass-btn"
            @click="$emit('open-rating')"
          >
            <v-icon start size="20" color="#fbbf24">mdi-star</v-icon>
            <span>{{ displayRating }}</span>
          </v-btn>

          <!-- Share Button -->
          <v-btn
            variant="flat"
            rounded="lg"
            height="46"
            class="px-4 font-weight-semibold text-none hero-glass-btn"
            @click="shareLink"
          >
            <v-icon start size="19">{{ copied ? 'mdi-check' : 'mdi-share-variant-outline' }}</v-icon>
            <span>{{ copied ? $t('common.linkCopied') : $t('common.share') }}</span>
          </v-btn>
        </div>
      </div>
    </v-container>
  </section>
</template>

<style scoped>
.media-hero {
  position: relative;
  width: 100%;
  min-height: 76vh;
  max-height: 820px;
  display: flex;
  align-items: flex-end;
  padding-top: 96px;
  padding-bottom: 48px;
  overflow: hidden;
  background-color: #0b0c10;
}

.hero-backdrop {
  position: absolute;
  inset: 0;
  background-size: cover;
  background-position: center 20%;
  transform: scale(1.02);
  z-index: 0;
}

.hero-gradient-left {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    rgba(15, 16, 21, 0.96) 0%,
    rgba(15, 16, 21, 0.8) 38%,
    rgba(15, 16, 21, 0.35) 70%,
    rgba(15, 16, 21, 0.12) 100%
  );
  z-index: 1;
}

.hero-gradient-bottom {
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to top,
    var(--app-background) 0%,
    rgba(15, 16, 21, 0.72) 24%,
    transparent 55%
  );
  z-index: 2;
}

:root[data-theme='light'] .hero-gradient-bottom {
  background: linear-gradient(
    to top,
    var(--app-background) 0%,
    rgba(15, 16, 21, 0.55) 24%,
    transparent 55%
  );
}

.hero-bottom-blur {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: 110px;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  mask-image: linear-gradient(to top, black 0%, transparent 100%);
  -webkit-mask-image: linear-gradient(to top, black 0%, transparent 100%);
  z-index: 2;
  pointer-events: none;
}

.hero-content-container {
  position: relative;
  z-index: 3;
  max-width: 1360px;
}

.hero-inner {
  max-width: 840px;
  color: #ffffff;
}

.hero-pill {
  display: inline-flex;
  align-items: center;
  padding: 5px 12px;
  border-radius: 999px;
  font-size: 0.78rem;
  font-weight: 600;
  letter-spacing: 0.02em;
  background: rgba(255, 255, 255, 0.12);
  border: 1px solid rgba(255, 255, 255, 0.14);
  backdrop-filter: blur(10px);
  color: #f3f4f6;
}

.hero-pill-type {
  background: rgba(255, 255, 255, 0.16);
  letter-spacing: 0.06em;
}

.hero-pill-score {
  background: rgba(251, 191, 36, 0.16);
  border-color: rgba(251, 191, 36, 0.3);
  color: #fde68a;
}

.status-dot {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  margin-right: 7px;
  display: inline-block;
}

.hero-logo {
  max-height: 115px;
  max-width: min(440px, 85vw);
  width: auto;
  object-fit: contain;
  display: block;
  filter: drop-shadow(0 6px 24px rgba(0, 0, 0, 0.55));
}

.hero-title-text {
  font-size: clamp(2rem, 4.2vw, 3.25rem);
  font-weight: 800;
  line-height: 1.1;
  letter-spacing: -0.02em;
  text-shadow: 0 4px 20px rgba(0, 0, 0, 0.6);
}

.hero-meta {
  font-size: 0.95rem;
  color: rgba(255, 255, 255, 0.84);
  font-weight: 500;
}

.meta-dot {
  opacity: 0.5;
}

.creator-link {
  color: #ffffff;
  text-decoration: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.35);
  transition: color 0.18s ease, border-color 0.18s ease;
}

.creator-link:hover {
  color: #c4a7ff;
  border-bottom-color: #c4a7ff;
}

.hero-overview {
  max-width: 660px;
  font-size: 0.98rem;
  line-height: 1.6;
  color: rgba(255, 255, 255, 0.88);
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-shadow: 0 1px 4px rgba(0, 0, 0, 0.45);
}

.hero-actions-row > * {
  flex-shrink: 0;
}

.hero-primary-btn {
  box-shadow: 0 8px 24px rgba(140, 82, 255, 0.35);
}

.hero-glass-btn {
  background: rgba(255, 255, 255, 0.14) !important;
  border: 1px solid rgba(255, 255, 255, 0.18) !important;
  backdrop-filter: blur(12px);
  color: #ffffff !important;
}

.hero-glass-btn:hover {
  background: rgba(255, 255, 255, 0.22) !important;
}

@media (max-width: 768px) {
  .media-hero {
    min-height: 68vh;
    padding-bottom: 32px;
  }
  .hero-gradient-left {
    background: linear-gradient(
      to top,
      rgba(15, 16, 21, 0.96) 0%,
      rgba(15, 16, 21, 0.72) 55%,
      rgba(15, 16, 21, 0.25) 100%
    );
  }
  .hero-logo {
    max-height: 85px;
  }
}
</style>
