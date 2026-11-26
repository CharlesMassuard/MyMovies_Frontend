<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import StreamingProviders from '../StreamingProviders.vue';

const props = defineProps({
  isMovie: { type: Boolean, default: true },
  details: { type: Object, required: true },
  directors: { type: Array, default: () => [] },
  writers: { type: Array, default: () => [] },
  creators: { type: Array, default: () => [] },
  runtimeFullFormatted: { type: String, default: '' },
  releaseDateFormatted: { type: String, default: null },
  periodYears: { type: String, default: '' },
  certification: { type: String, default: null },
  statusBadge: { type: Object, default: null },
  watchProviders: { type: Array, default: () => [] }
});

const { locale, t } = useI18n();

const formatCurrency = (value) => {
  if (!value || value === 0) return null;
  return new Intl.NumberFormat(locale.value, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
};

const tmdbScoreText = computed(() => {
  if (!props.details.vote_average) return null;
  const score = (Math.round(props.details.vote_average * 10) / 10).toFixed(1).replace('.', ',');
  const votes = props.details.vote_count
    ? ` · ${new Intl.NumberFormat(locale.value).format(props.details.vote_count)} ${t('media.votes')}`
    : '';
  return `${score} / 10${votes}`;
});

const metadataRows = computed(() => {
  const rows = [];

  if (props.isMovie) {
    if (props.directors.length > 0) {
      rows.push({
        label: t('media.direction'),
        people: props.directors.map(d => ({ id: d.id, name: d.name, to: `/director/${d.id}` }))
      });
    }
    if (props.writers.length > 0) {
      rows.push({
        label: t('media.screenplay'),
        people: props.writers.map(w => ({ id: w.id, name: w.name, to: `/person/${w.id}` }))
      });
    }
    if (props.runtimeFullFormatted) {
      rows.push({ label: t('media.duration'), value: props.runtimeFullFormatted });
    }
    if (props.releaseDateFormatted) {
      rows.push({ label: t('media.releaseDate'), value: props.releaseDateFormatted });
    }
  } else {
    if (props.creators.length > 0) {
      rows.push({
        label: t('media.creation'),
        people: props.creators.map(c => ({ id: c.id, name: c.name, to: `/person/${c.id}` }))
      });
    }
    if (props.periodYears) {
      rows.push({ label: t('media.broadcast'), value: props.periodYears });
    }
    if (props.details.number_of_seasons) {
      const seasonsLabel =
        props.details.number_of_seasons > 1 ? t('media.seasonsPlural') : t('media.seasons');
      rows.push({
        label: t('episodes.seasons'),
        value: `${props.details.number_of_seasons} ${seasonsLabel} · ${props.details.number_of_episodes || 0} ${t('media.episodes')}`
      });
    }
    if (props.runtimeFullFormatted && props.runtimeFullFormatted !== t('common.durationUnknown')) {
      rows.push({ label: t('media.episodeDuration'), value: props.runtimeFullFormatted });
    }
    if (props.statusBadge) {
      rows.push({ label: t('media.statusLabel'), value: props.statusBadge.text });
    }
  }

  if (props.certification) {
    rows.push({ label: t('media.classification'), value: props.certification });
  }
  if (tmdbScoreText.value) {
    rows.push({ label: t('media.tmdbRating'), value: tmdbScoreText.value });
  }
  if (props.isMovie && props.details.budget > 0) {
    rows.push({ label: t('common.budget'), value: formatCurrency(props.details.budget) });
  }
  if (props.isMovie && props.details.revenue > 0) {
    rows.push({ label: t('common.revenue'), value: formatCurrency(props.details.revenue) });
  }

  return rows;
});
</script>

<template>
  <v-row class="overview-grid" align="start">
    <!-- Left Column: Synopsis & Streaming -->
    <v-col cols="12" md="7" class="pr-md-10">
      <h2 class="text-h5 font-weight-bold mb-4">{{ $t('common.synopsis') }}</h2>

      <p v-if="details.tagline" class="tagline-text mb-4">
        {{ details.tagline }}
      </p>

      <p class="synopsis-body">
        {{ details.overview || $t('common.noDescription') }}
      </p>

      <p class="tmdb-attribution mt-5">
        {{ $t('media.tmdbAttribution') }}
      </p>

      <!-- Streaming Providers (Movies) or Networks (Series) -->
      <div v-if="watchProviders.length > 0" class="mt-6">
        <StreamingProviders :providers="watchProviders" />
      </div>

      <div v-if="!isMovie && details.networks?.length" class="d-flex align-center flex-wrap ga-3 mt-5">
        <span class="text-caption opacity-70">{{ $t('media.showOn') }}</span>
        <div
          v-for="net in details.networks"
          :key="net.id"
          class="network-badge pa-1 px-2 bg-white rounded-lg elevation-1"
        >
          <img
            v-if="net.logo_path"
            :src="`https://image.tmdb.org/t/p/w92${net.logo_path}`"
            :alt="net.name"
            :title="net.name"
            style="height: 20px; max-width: 100px; object-fit: contain; display: block;"
          />
          <span v-else class="text-caption text-black font-weight-bold">{{ net.name }}</span>
        </div>
      </div>
    </v-col>

    <!-- Right Column: Metadata Key-Value Table -->
    <v-col cols="12" md="5" class="mt-6 mt-md-0">
      <div class="meta-table">
        <div
          v-for="(row, idx) in metadataRows"
          :key="idx"
          class="meta-row"
        >
          <span class="meta-label">{{ row.label }}</span>
          <span v-if="row.people" class="meta-value">
            <template v-for="(p, pIdx) in row.people" :key="p.id || p.name">
              <router-link v-if="p.id" :to="p.to" class="person-meta-link">
                {{ p.name }}
              </router-link>
              <span v-else>{{ p.name }}</span>
              <span v-if="pIdx < row.people.length - 1">, </span>
            </template>
          </span>
          <span v-else class="meta-value">{{ row.value }}</span>
        </div>
      </div>
    </v-col>
  </v-row>
</template>

<style scoped>
.tagline-text {
  font-style: italic;
  font-size: 1.05rem;
  opacity: 0.78;
}

.synopsis-body {
  font-size: 0.98rem;
  line-height: 1.75;
  opacity: 0.92;
  text-align: left;
}

.tmdb-attribution {
  font-size: 0.8rem;
  opacity: 0.55;
}

.meta-table {
  display: flex;
  flex-direction: column;
}

.meta-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 24px;
  padding: 13px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .meta-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.meta-row:last-child {
  border-bottom: none;
}

.meta-label {
  font-size: 0.88rem;
  opacity: 0.6;
  flex-shrink: 0;
}

.meta-value {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: right;
}

.person-meta-link {
  color: inherit;
  text-decoration: none;
  border-bottom: 1px dashed rgba(140, 82, 255, 0.55);
  transition: color 0.18s ease, border-color 0.18s ease;
}

.person-meta-link:hover {
  color: #a97dff;
  border-bottom-color: #a97dff;
}

.network-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
