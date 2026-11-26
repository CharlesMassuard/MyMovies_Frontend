<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  videos: { type: Array, default: () => [] },
  images: { type: Object, default: () => ({}) }
});

defineEmits(['play-video']);

const lightboxOpen = ref(false);
const lightboxImage = ref('');
const showAll = ref(false);

const allPosters = computed(() => props.images?.posters || []);
const allBackdrops = computed(() => props.images?.backdrops || []);
const allYoutubeVideos = computed(() =>
  (props.videos || []).filter(v => v.site === 'YouTube')
);

const displayedPosters = computed(() =>
  showAll.value ? allPosters.value.slice(0, 18) : allPosters.value.slice(0, 6)
);
const displayedBackdrops = computed(() =>
  showAll.value ? allBackdrops.value.slice(0, 12) : allBackdrops.value.slice(0, 3)
);
const displayedVideos = computed(() =>
  showAll.value ? allYoutubeVideos.value.slice(0, 12) : allYoutubeVideos.value.slice(0, 3)
);

const hasMore = computed(
  () => allPosters.value.length > 6 || allBackdrops.value.length > 3 || allYoutubeVideos.value.length > 3
);

const openImage = (path) => {
  lightboxImage.value = `https://image.tmdb.org/t/p/original${path}`;
  lightboxOpen.value = true;
};
</script>

<template>
  <div class="gallery-tab">
    <div class="d-flex align-center justify-space-between mb-6">
      <h2 class="text-h5 font-weight-bold d-flex align-center ga-2">
        <v-icon color="#8C52FF" size="24">mdi-image-multiple-outline</v-icon>
        {{ $t('media.tabs.gallery') }}
      </h2>
      <v-btn
        v-if="hasMore"
        variant="tonal"
        color="#8C52FF"
        rounded="pill"
        size="small"
        class="text-none font-weight-semibold px-4"
        :append-icon="showAll ? 'mdi-chevron-up' : 'mdi-chevron-down'"
        @click="showAll = !showAll"
      >
        {{ showAll ? $t('media.showLess') : $t('media.showMore') }}
      </v-btn>
    </div>

    <!-- 1. Posters Row -->
    <div v-if="displayedPosters.length > 0" class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-3 opacity-80">{{ $t('media.posters') }}</h3>
      <v-row>
        <v-col v-for="(img, idx) in displayedPosters" :key="`ps-${idx}`" cols="6" sm="4" md="3" lg="2">
          <v-card
            class="image-card rounded-xl overflow-hidden"
            elevation="2"
            @click="openImage(img.file_path)"
          >
            <v-img
              :src="`https://image.tmdb.org/t/p/w500${img.file_path}`"
              aspect-ratio="2/3"
              cover
            />
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 2. Backdrops Row -->
    <div v-if="displayedBackdrops.length > 0" class="mb-8">
      <h3 class="text-subtitle-1 font-weight-bold mb-3 opacity-80">{{ $t('media.backdrops') }}</h3>
      <v-row>
        <v-col v-for="(img, idx) in displayedBackdrops" :key="`bd-${idx}`" cols="12" sm="6" md="4">
          <v-card
            class="image-card rounded-xl overflow-hidden"
            elevation="2"
            @click="openImage(img.file_path)"
          >
            <v-img
              :src="`https://image.tmdb.org/t/p/w780${img.file_path}`"
              aspect-ratio="16/9"
              cover
            />
          </v-card>
        </v-col>
      </v-row>
    </div>

    <!-- 3. Videos Row -->
    <div v-if="displayedVideos.length > 0" class="mb-4">
      <h3 class="text-subtitle-1 font-weight-bold mb-3 opacity-80">{{ $t('media.videos') }}</h3>
      <v-row>
        <v-col v-for="video in displayedVideos" :key="video.id" cols="12" sm="6" md="4">
          <v-card
            class="video-card rounded-xl overflow-hidden"
            elevation="2"
            @click="$emit('play-video', video.key)"
          >
            <div class="video-thumb-wrapper">
              <v-img
                :src="`https://img.youtube.com/vi/${video.key}/hqdefault.jpg`"
                aspect-ratio="16/9"
                cover
              />
              <div class="play-overlay">
                <div class="play-circle">
                  <v-icon size="30" color="white">mdi-play</v-icon>
                </div>
              </div>
            </div>
            <v-card-text class="pa-3">
              <p class="font-weight-bold text-body-2 mb-1 text-truncate" :title="video.name">
                {{ video.name }}
              </p>
              <span class="text-caption opacity-70">{{ video.type }}</span>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <div
      v-if="displayedVideos.length === 0 && displayedBackdrops.length === 0 && displayedPosters.length === 0"
      class="text-center py-8 opacity-60"
    >
      {{ $t('common.noData') }}
    </div>

    <!-- Bottom toggle when expanded -->
    <div v-if="showAll && hasMore" class="d-flex justify-center mt-6">
      <v-btn
        variant="tonal"
        color="#8C52FF"
        rounded="pill"
        size="small"
        class="text-none font-weight-semibold px-6"
        append-icon="mdi-chevron-up"
        @click="showAll = false"
      >
        {{ $t('media.showLess') }}
      </v-btn>
    </div>

    <!-- Image Lightbox Dialog -->
    <v-dialog v-model="lightboxOpen" max-width="1100">
      <v-card class="bg-black rounded-xl overflow-hidden">
        <v-btn
          icon="mdi-close"
          variant="flat"
          color="rgba(0,0,0,0.6)"
          class="lightbox-close text-white"
          @click="lightboxOpen = false"
        />
        <v-img :src="lightboxImage" max-height="85vh" contain />
      </v-card>
    </v-dialog>
  </div>
</template>

<style scoped>
.video-card,
.image-card {
  cursor: pointer;
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

:root[data-theme='light'] .video-card,
:root[data-theme='light'] .image-card {
  border-color: rgba(0, 0, 0, 0.08);
}

.video-card:hover,
.image-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.28) !important;
}

.video-thumb-wrapper {
  position: relative;
}

.play-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.25);
  transition: background 0.2s ease;
}

.video-card:hover .play-overlay {
  background: rgba(0, 0, 0, 0.45);
}

.play-circle {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: rgba(140, 82, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.lightbox-close {
  position: absolute;
  top: 12px;
  right: 12px;
  z-index: 10;
}
</style>
