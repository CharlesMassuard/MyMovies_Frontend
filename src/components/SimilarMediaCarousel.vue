<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import noPoster from '../assets/noPosterAvailable.webp';

const props = defineProps({
  mediaList: { type: Array, default: () => [] },
  mediaType: { type: String, required: true },
  libraryStatusMap: { type: Object, default: () => ({}) }
});

const getStatusBadge = (id) => {
  const s = props.libraryStatusMap?.[`${props.mediaType}-${id}`];
  if (s === 'WATCHED') return { label: 'common.watched', color: '#22c55e', icon: 'mdi-check' };
  if (s === 'WATCHING') return { label: 'common.watching', color: '#3b82f6', icon: 'mdi-play' };
  if (s === 'TO_WATCH') return { label: 'common.watch', color: '#8C52FF', icon: 'mdi-clock-outline' };
  return null;
};

const router = useRouter();
const scrollContainer = ref(null);

const goToMedia = (id, type) => router.push(`/${type}/${id}`);

const scrollTrack = (dir) => {
  const el = scrollContainer.value;
  if (!el) return;
  el.scrollBy({ left: dir === 'next' ? 560 : -560, behavior: 'smooth' });
};
</script>

<template>
  <div v-if="mediaList?.length" class="similar-section">
    <div class="d-flex align-center justify-space-between mb-5">
      <h2 class="text-h5 font-weight-bold d-flex align-center ga-2">
        <v-icon color="#8C52FF" size="24">mdi-auto-fix</v-icon>
        {{ $t('media.similar') }}
      </h2>
      <div class="d-flex ga-2">
        <v-btn icon="mdi-chevron-left" variant="tonal" size="small" rounded="circle" @click="scrollTrack('prev')" />
        <v-btn icon="mdi-chevron-right" variant="tonal" size="small" rounded="circle" @click="scrollTrack('next')" />
      </div>
    </div>

    <div ref="scrollContainer" class="similar-track">
      <div
        v-for="similar in mediaList"
        :key="similar.id"
        class="similar-card rounded-xl overflow-hidden"
        @click="goToMedia(similar.id, mediaType)"
      >
        <div class="poster-wrap">
          <v-img
            :src="similar.poster_path ? `https://image.tmdb.org/t/p/w342${similar.poster_path}` : noPoster"
            aspect-ratio="2/3"
            cover
            class="poster-img"
          />
          <span
            v-if="getStatusBadge(similar.id)"
            class="lib-status-pill"
            :style="{ backgroundColor: getStatusBadge(similar.id).color }"
          >
            <v-icon size="11" class="mr-1">{{ getStatusBadge(similar.id).icon }}</v-icon>
            {{ $t(getStatusBadge(similar.id).label) }}
          </span>
          <span v-if="similar.vote_average > 0" class="rating-badge">
            <v-icon size="11" color="#fbbf24" class="mr-1">mdi-star</v-icon>
            {{ (Math.round(similar.vote_average * 10) / 10).toFixed(1) }}
          </span>
        </div>
        <div class="pa-3">
          <p class="font-weight-bold text-body-2 mb-1 text-truncate" :title="similar.title || similar.name">
            {{ similar.title || similar.name }}
          </p>
          <p class="text-caption opacity-65 mb-0">
            {{ (similar.release_date || similar.first_air_date || '').split('-')[0] || '—' }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.similar-track {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 10px;
  scrollbar-width: none;
}

.similar-track::-webkit-scrollbar {
  display: none;
}

.similar-card {
  width: 162px;
  flex-shrink: 0;
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

:root[data-theme='light'] .similar-card {
  border-color: rgba(0, 0, 0, 0.08);
}

.similar-card:hover {
  transform: translateY(-4px);
  border-color: rgba(140, 82, 255, 0.45);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.32);
}

.poster-wrap {
  position: relative;
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}

.poster-img {
  transition: transform 0.3s ease;
}

.similar-card:hover .poster-img {
  transform: scale(1.04);
}

.rating-badge {
  position: absolute;
  bottom: 8px;
  left: 8px;
  display: inline-flex;
  align-items: center;
  padding: 2px 8px;
  border-radius: 999px;
  font-size: 0.72rem;
  font-weight: 700;
  background: rgba(15, 16, 21, 0.85);
  backdrop-filter: blur(6px);
  color: #ffffff;
}

.lib-status-pill {
  position: absolute;
  top: 8px;
  right: 8px;
  display: inline-flex;
  align-items: center;
  padding: 2px 7px;
  border-radius: 999px;
  font-size: 0.66rem;
  font-weight: 700;
  color: #ffffff;
}
</style>
