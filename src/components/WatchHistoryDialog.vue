<script setup>
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import axios from 'axios';

const props = defineProps({
  modelValue: Boolean,
  mediaId: [Number, String],
  mediaType: {
    type: String,
    default: 'movie' // Peut être 'movie' ou 'serie'
  },
  defaultTab: {
    type: String,
    default: 'list' // 'list' ou 'add'
  }
});

const emit = defineEmits(['update:modelValue', 'history-updated']);
const { t, locale } = useI18n();
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

const isLoading = ref(false);
const historyList = ref([]);
const showAddForm = ref(false);

// State du formulaire
const menuDate = ref(false);
const dateObj = ref(new Date());
const newRating = ref(5);
const newComment = ref('');

const displayDate = computed(() => {
  if (!dateObj.value) return '';
  return new Intl.DateTimeFormat(locale.value, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(dateObj.value);
});

const closeDialog = () => {
  emit('update:modelValue', false);
};

const fetchHistory = async () => {
  isLoading.value = true;
  try {
    const token = localStorage.getItem('user_token');
    const endpoint = props.mediaType === 'movie' ? 'movies' : 'series';
    const response = await axios.get(`${API_BASE_URL}/user/${endpoint}/history/${props.mediaId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    historyList.value = response.data;
  } catch (error) {
    console.error("Erreur lors de la récupération de l'historique", error);
  } finally {
    isLoading.value = false;
  }
};

const submitRewatch = async () => {
  if (newRating.value < 1 || newRating.value > 10) return;
  if (newComment.value.length > 500) {
    alert(t('media.commentLength'));
    return;
  }

  // Formatage propre de la date en YYYY-MM-DD pour l'API
  const d = new Date(dateObj.value);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const formattedIsoDate = `${year}-${month}-${day}`;

  try {
    const token = localStorage.getItem('user_token');
    const endpoint = props.mediaType === 'movie' ? 'movies' : 'series';
    
    await axios.post(`${API_BASE_URL}/user/${endpoint}/rewatch/${props.mediaId}`, {
      dateViewed: formattedIsoDate,
      rating: newRating.value,
      comment: newComment.value
    }, {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    // Reset du formulaire et rafraîchissement
    showAddForm.value = false;
    newComment.value = '';
    newRating.value = 5;
    dateObj.value = new Date();
    await fetchHistory();
    emit('history-updated'); // Va forcer la vue parente à recalculer le nb de visionnages
  } catch (error) {
    console.error("Erreur lors de l'ajout", error);
  }
};

watch(() => props.modelValue, (isOpen) => {
  if (isOpen) {
    showAddForm.value = (props.defaultTab === 'add');
    dateObj.value = new Date();
    newRating.value = 5;
    newComment.value = '';
    if (props.mediaId) fetchHistory();
  }
});

const formatDate = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  return new Intl.DateTimeFormat(locale.value, { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
};
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" width="450px" scrollable>
    <!-- Utilisation de d-flex et flex-column pour gérer le contenu scrollable avec footer fixe -->
    <v-card class="rounded-xl d-flex flex-column" max-height="85vh" style="overflow: hidden;">
      
      <!-- HEADER FIXE -->
      <div class="d-flex align-center justify-center pa-4 shrink position-relative">
        <v-card-title class="pa-0 font-weight-bold">
          {{ showAddForm ? 'Ajouter un visionnage' : 'Historique de visionnage' }}
        </v-card-title>
        <v-btn
          icon="mdi-close"
          variant="text"
          density="comfortable"
          position="absolute"
          style="right: 16px; top: 50%; transform: translateY(-50%);"
          @click="closeDialog"
        ></v-btn>
      </div>

      <v-divider></v-divider>

      <!-- CORPS SCROLLABLE -->
      <v-card-text class="pa-4 flex-grow-1" style="overflow-y: auto; overflow-x: hidden;">
        
        <!-- Loader -->
        <div v-if="isLoading" class="d-flex justify-center my-6">
          <v-progress-circular indeterminate color="#8C52FF"></v-progress-circular>
        </div>

        <!-- Liste des visionnages -->
        <div v-else-if="!showAddForm">
          <div v-if="historyList.length === 0" class="text-center text-grey my-6">
            Aucun historique disponible.
          </div>
          
          <v-timeline v-else density="compact" side="end" class="mb-2" align="start" truncate-line="both">
            <v-timeline-item v-for="(item, index) in historyList" :key="index" dot-color="#8C52FF" size="x-small">
              <div class="d-flex flex-column bg-surface-variant pa-3 rounded-lg">
                <div class="d-flex justify-space-between align-center mb-2">
                    <strong class="text-body-1">{{ formatDate(item.dateViewed) }}</strong>
                    <v-chip size="small" color="#8C52FF" variant="flat" class="text-white font-weight-bold px-3 ml-3" elevation="0">
                        <v-icon start size="small" class="mr-1">mdi-star</v-icon>
                        <span style="font-size: 0.85rem;">{{ item.rating }}/10</span>
                    </v-chip>
                </div>
                <p v-if="item.comment && item.comment !== 'NO_COMMENT'" class="text-body-2 text-grey-lighten-1 mb-0 italic">
                  "{{ item.comment }}"
                </p>
                <div v-if="item.main" class="text-caption text-grey mt-2">
                  Premier visionnage
                </div>
              </div>
            </v-timeline-item>
          </v-timeline>
        </div>

        <!-- Formulaire d'ajout -->
        <div v-else class="mt-2">
          <!-- Nouveau calendrier basé sur Vuetify -->
          <v-menu
            v-model="menuDate"
            :close-on-content-click="false"
            transition="scale-transition"
            offset-y
            min-width="auto"
          >
            <template v-slot:activator="{ props }">
              <v-text-field
                v-model="displayDate"
                label="Date du visionnage"
                prepend-inner-icon="mdi-calendar"
                readonly
                v-bind="props"
                variant="outlined"
                rounded="lg"
                class="mb-6"
                hide-details
              ></v-text-field>
            </template>
            <v-date-picker
              v-model="dateObj"
              color="#8C52FF"
              :max="new Date()"
              hide-header
              @update:model-value="menuDate = false"
            ></v-date-picker>
          </v-menu>

          <v-textarea
            v-model="newComment"
            :placeholder="$t('media.defaultReview')"
            variant="outlined"
            rounded="lg"
            auto-grow
            rows="4"
            class="mb-6 comment-area"
            hide-details
          ></v-textarea>

          <div class="d-flex justify-space-between mb-2 px-1">
            <v-slide-group
              v-model="newRating"
              class="pa-0 mb-4"
              selected-class="selected-rating"
              mandatory
              center-active
            >
              <v-slide-group-item
                v-for="n in 10"
                :key="n"
                :value="n"
                v-slot="{ isSelected, toggle }"
              >
                <v-card
                  :color="isSelected ? '#8C52FF' : 'surface-variant'"
                  :class="[
                    'ma-2 d-flex align-center justify-center rating-card elevation-2',
                    isSelected ? 'text-white' : 'text-high-emphasis'
                  ]"
                  height="40"
                  width="40"
                  rounded="lg"
                  @click="toggle"
                >
                  <span class="text-h6 font-weight-bold">{{ n }}</span>
                </v-card>
              </v-slide-group-item>
            </v-slide-group>
          </div>
        </div>
      </v-card-text>

      <v-divider v-if="!isLoading"></v-divider>

      <!-- FOOTER FIXE (Les boutons seront toujours visibles, indépendamment du scroll) -->
      <div v-if="!isLoading" class="pa-4 shrink bg-background">
        <!-- Boutons si on est sur la Liste -->
        <template v-if="!showAddForm">
          <v-btn
            block
            color="#6236FF"
            variant="tonal"
            size="large"
            rounded="xl"
            class="text-none font-weight-bold"
            prepend-icon="mdi-plus"
            @click="showAddForm = true"
          >
            Ajouter un visionnage
          </v-btn>
        </template>
        
        <!-- Boutons si on est sur le Formulaire -->
        <template v-else>
          <v-btn
            block
            color="#6236FF"
            size="large"
            rounded="xl"
            class="text-none font-weight-bold text-white elevation-0 mb-3"
            @click="submitRewatch"
          >
            {{ $t('common.validate') }}
          </v-btn>
          <!-- Bouton retour (si on vient de la liste) -->
          <v-btn
            v-if="historyList.length > 0"
            block
            variant="text"
            size="large"
            rounded="xl"
            class="text-none font-weight-bold text-grey"
            @click="showAddForm = false"
          >
            {{ $t('common.cancel') }}
          </v-btn>
        </template>
      </div>
      
    </v-card>
  </v-dialog>
</template>

<style scoped>
.comment-area :deep(.v-field__outline) {
  --v-field-border-opacity: 0.1;
}

.selected-rating {
  background-color: #8C52FF !important;
  border-color: #8C52FF !important;
}

.italic {
  font-style: italic;
}
</style>