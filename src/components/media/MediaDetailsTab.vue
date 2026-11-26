<script setup>
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import StreamingProviders from '../StreamingProviders.vue';

const props = defineProps({
  isMovie: { type: Boolean, default: true },
  details: { type: Object, required: true },
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

const originalTitle = computed(() => props.details.original_title || props.details.original_name || '');

const spokenLanguages = computed(() => {
  if (!Array.isArray(props.details.spoken_languages)) return '';
  return props.details.spoken_languages.map(l => l.name || l.english_name).filter(Boolean).join(', ');
});

const productionCountries = computed(() => {
  if (!Array.isArray(props.details.production_countries)) return '';
  return props.details.production_countries.map(c => c.name).filter(Boolean).join(', ');
});

const infoItems = computed(() => {
  const items = [];
  if (originalTitle.value) items.push({ label: t('media.originalTitle'), value: originalTitle.value });
  if (props.statusBadge) items.push({ label: t('media.statusLabel'), value: props.statusBadge.text });
  if (spokenLanguages.value) items.push({ label: t('media.spokenLanguages'), value: spokenLanguages.value });
  if (productionCountries.value) items.push({ label: t('media.productionCountries'), value: productionCountries.value });
  if (props.isMovie && props.details.budget > 0) items.push({ label: t('common.budget'), value: formatCurrency(props.details.budget) });
  if (props.isMovie && props.details.revenue > 0) items.push({ label: t('common.revenue'), value: formatCurrency(props.details.revenue) });
  return items;
});
</script>

<template>
  <v-row>
    <v-col cols="12" md="6">
      <h3 class="text-h5 font-weight-bold mb-4">{{ $t('media.productionInfo') }}</h3>
      <div class="details-table">
        <div v-for="(item, idx) in infoItems" :key="idx" class="detail-row">
          <span class="detail-label">{{ item.label }}</span>
          <span class="detail-value">{{ item.value }}</span>
        </div>
      </div>

      <div v-if="details.homepage" class="mt-6">
        <v-btn
          :href="details.homepage"
          target="_blank"
          variant="outlined"
          color="#8C52FF"
          rounded="lg"
          prepend-icon="mdi-open-in-new"
          class="text-none font-weight-semibold"
        >
          {{ $t('common.officialWebsite') }}
        </v-btn>
      </div>
    </v-col>

    <v-col cols="12" md="6" class="mt-6 mt-md-0">
      <div v-if="details.production_companies?.length" class="mb-8">
        <h3 class="text-h5 font-weight-bold mb-4">{{ $t('media.productionCompanies') }}</h3>
        <div class="d-flex flex-wrap ga-3">
          <div
            v-for="company in details.production_companies"
            :key="company.id"
            class="company-chip d-flex align-center ga-2 px-3 py-2 rounded-lg"
          >
            <img
              v-if="company.logo_path"
              :src="`https://image.tmdb.org/t/p/w92${company.logo_path}`"
              :alt="company.name"
              class="company-logo"
            />
            <span class="text-body-2 font-weight-medium">{{ company.name }}</span>
          </div>
        </div>
      </div>

      <div v-if="watchProviders.length > 0">
        <h3 class="text-h5 font-weight-bold mb-2">{{ $t('common.streaming') }}</h3>
        <StreamingProviders :providers="watchProviders" />
      </div>
    </v-col>
  </v-row>
</template>

<style scoped>
.details-table {
  display: flex;
  flex-direction: column;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 24px;
  padding: 13px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .detail-row {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.detail-row:last-child {
  border-bottom: none;
}

.detail-label {
  font-size: 0.88rem;
  opacity: 0.6;
  flex-shrink: 0;
}

.detail-value {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: right;
}

.company-chip {
  background: rgba(255, 255, 255, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:root[data-theme='light'] .company-chip {
  background: rgba(0, 0, 0, 0.04);
  border: 1px solid rgba(0, 0, 0, 0.08);
}

.company-logo {
  height: 20px;
  max-width: 60px;
  object-fit: contain;
  background: white;
  padding: 2px 4px;
  border-radius: 4px;
}
</style>
