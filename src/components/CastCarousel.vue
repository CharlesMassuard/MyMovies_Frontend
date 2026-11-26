<script setup>
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import noPoster from '../assets/noPosterAvailable.webp';

const props = defineProps({
  cast: { type: Array, default: () => [] },
  crew: { type: Array, default: () => [] }
});

const router = useRouter();
const scrollContainer = ref(null);
const activeMode = ref('cast'); // 'cast' | 'crew'

const keyCrew = computed(() => {
  if (!Array.isArray(props.crew)) return [];
  const priorityJobs = ['Director', 'Screenplay', 'Writer', 'Story', 'Producer', 'Executive Producer', 'Original Music Composer', 'Director of Photography'];
  const map = new Map();
  props.crew.forEach(member => {
    if (!priorityJobs.includes(member.job)) return;
    if (!map.has(member.id)) {
      map.set(member.id, { ...member, jobs: [member.job] });
    } else if (!map.get(member.id).jobs.includes(member.job)) {
      map.get(member.id).jobs.push(member.job);
    }
  });
  return Array.from(map.values())
    .sort((a, b) => priorityJobs.indexOf(a.jobs[0]) - priorityJobs.indexOf(b.jobs[0]))
    .slice(0, 18);
});

const displayedPeople = computed(() => {
  if (activeMode.value === 'crew' && keyCrew.value.length > 0) {
    return keyCrew.value.map(m => ({
      id: m.id,
      name: m.name,
      profile_path: m.profile_path,
      role: m.jobs.join(', '),
      isDirector: m.jobs.includes('Director')
    }));
  }
  return (props.cast || []).slice(0, 24).map(a => ({
    id: a.id,
    name: a.name,
    profile_path: a.profile_path,
    role: a.roles?.[0]?.character || a.character || '',
    isDirector: false
  }));
});

const goToPerson = (person) => {
  router.push(person.isDirector ? `/director/${person.id}` : `/person/${person.id}`);
};

const scrollTrack = (dir) => {
  const el = scrollContainer.value;
  if (!el) return;
  el.scrollBy({ left: dir === 'next' ? 560 : -560, behavior: 'smooth' });
};
</script>

<template>
  <div v-if="cast?.length || keyCrew.length" class="cast-section">
    <div class="d-flex flex-wrap align-center justify-space-between ga-4 mb-5">
      <div class="d-flex align-center flex-wrap ga-4">
        <h2 class="text-h5 font-weight-bold d-flex align-center ga-2">
          <v-icon color="#8C52FF" size="24">mdi-account-group-outline</v-icon>
          {{ $t('media.cast') }}
        </h2>

        <div v-if="keyCrew.length > 0" class="mode-toggle">
          <button
            type="button"
            class="mode-btn"
            :class="{ 'mode-btn-active': activeMode === 'cast' }"
            @click="activeMode = 'cast'"
          >
            {{ $t('person.acting') }}
          </button>
          <button
            type="button"
            class="mode-btn"
            :class="{ 'mode-btn-active': activeMode === 'crew' }"
            @click="activeMode = 'crew'"
          >
            {{ $t('person.crew') }}
          </button>
        </div>
      </div>

      <div class="d-flex ga-2">
        <v-btn icon="mdi-chevron-left" variant="tonal" size="small" rounded="circle" @click="scrollTrack('prev')" />
        <v-btn icon="mdi-chevron-right" variant="tonal" size="small" rounded="circle" @click="scrollTrack('next')" />
      </div>
    </div>

    <div ref="scrollContainer" class="cast-track">
      <div
        v-for="person in displayedPeople"
        :key="`${activeMode}-${person.id}`"
        class="person-card rounded-xl overflow-hidden"
        @click="goToPerson(person)"
      >
        <div class="portrait-wrap">
          <v-img
            :src="person.profile_path ? `https://image.tmdb.org/t/p/w300${person.profile_path}` : noPoster"
            :alt="person.name"
            height="215"
            cover
            class="portrait-img"
          />
        </div>
        <div class="pa-3">
          <p class="font-weight-bold text-body-2 mb-1 text-truncate" :title="person.name">
            {{ person.name }}
          </p>
          <p v-if="person.role" class="text-caption opacity-65 mb-0 text-truncate" :title="person.role">
            {{ person.role }}
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.mode-toggle {
  display: inline-flex;
  padding: 3px;
  border-radius: 999px;
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .mode-toggle {
  border-color: rgba(0, 0, 0, 0.08);
}

.mode-btn {
  padding: 4px 13px;
  border-radius: 999px;
  border: none;
  background: transparent;
  color: inherit;
  font-size: 0.78rem;
  font-weight: 600;
  opacity: 0.65;
  cursor: pointer;
  transition: all 0.18s ease;
}

.mode-btn-active {
  background: #8C52FF;
  color: #ffffff;
  opacity: 1;
}

.cast-track {
  display: flex;
  gap: 14px;
  overflow-x: auto;
  padding-bottom: 10px;
  scrollbar-width: none;
}

.cast-track::-webkit-scrollbar {
  display: none;
}

.person-card {
  width: 158px;
  flex-shrink: 0;
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
  cursor: pointer;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
}

:root[data-theme='light'] .person-card {
  border-color: rgba(0, 0, 0, 0.08);
}

.person-card:hover {
  transform: translateY(-4px);
  border-color: rgba(140, 82, 255, 0.45);
  box-shadow: 0 12px 26px rgba(0, 0, 0, 0.32);
}

.portrait-wrap {
  overflow: hidden;
  background: rgba(255, 255, 255, 0.04);
}

.portrait-img {
  transition: transform 0.3s ease;
}

.person-card:hover .portrait-img {
  transform: scale(1.04);
}
</style>
