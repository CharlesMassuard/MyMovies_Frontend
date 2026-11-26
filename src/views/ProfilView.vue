<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '../stores/auth';
import apiClient from '../api/client';
import { getApiErrorMessage } from '../utils/apiError';
import router from '../router';
import ConfirmationDialog from '../components/ConfirmationDialog.vue';
import i18n, { languagePreference, setLanguagePreference } from '../i18n';
import { themePreference, setThemePreference } from '../plugins/vuetify';

const authStore = useAuthStore();
const { t } = useI18n();

// User Stats
const statsLoading = ref(true);
const userMovies = ref([]);
const userSeries = ref([]);

const fetchStats = async () => {
  statsLoading.value = true;
  try {
    const [mRes, sRes] = await Promise.all([
      apiClient.get('/user/movies'),
      apiClient.get('/user/series')
    ]);
    userMovies.value = mRes.data || [];
    userSeries.value = sRes.data || [];
  } catch (e) {
    console.error('Error loading stats:', e);
  } finally {
    statsLoading.value = false;
  }
};

const stats = computed(() => {
  const watchedMovies = userMovies.value.filter(i => i.status === 'WATCHED');
  const watchedSeries = userSeries.value.filter(i => i.status === 'WATCHED');
  const totalMinutes = watchedMovies.reduce((acc, i) => acc + (i.movie?.duration || 0), 0);
  const hours = Math.floor(totalMinutes / 60);

  const rated = [...userMovies.value, ...userSeries.value].filter(i => i.rating && i.rating > 0);
  const avgRating =
    rated.length > 0
      ? (rated.reduce((acc, i) => acc + i.rating, 0) / rated.length).toFixed(1).replace('.', ',')
      : '—';

  const genreCounts = {};
  [...userMovies.value, ...userSeries.value].forEach(i => {
    const types = i.movie?.types || i.serie?.types || [];
    types.forEach(tp => {
      const name = tp.name || tp;
      if (name) genreCounts[name] = (genreCounts[name] || 0) + 1;
    });
  });
  const topGenres = Object.entries(genreCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([name]) => name);

  return {
    moviesWatched: watchedMovies.length,
    seriesWatched: watchedSeries.length,
    totalLibrary: userMovies.value.length + userSeries.value.length,
    watchHours: hours,
    avgRating,
    topGenres
  };
});

onMounted(fetchStats);

const languageSelection = ref(languagePreference());
const languageOptions = computed(() => [
  { title: t('language.auto'), value: 'auto' },
  { title: t('language.french'), value: 'fr' },
  { title: t('language.english'), value: 'en' }
]);

const updateLanguage = (value) => {
  languageSelection.value = value;
  setLanguagePreference(value);
};

const themeSelection = ref(themePreference());
const themeOptions = computed(() => [
  { title: t('theme.system'), value: 'system', icon: 'mdi-laptop' },
  { title: t('theme.light'), value: 'light', icon: 'mdi-white-balance-sunny' },
  { title: t('theme.dark'), value: 'dark', icon: 'mdi-weather-night' }
]);

const updateTheme = (value) => {
  themeSelection.value = value;
  setThemePreference(value);
};

const formatDate = (dateString) => {
  if (!dateString) return '—';
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return new Date(dateString).toLocaleDateString(i18n.global.locale.value, options);
};

const userInitials = computed(() => {
  const pseudo = authStore.user?.pseudo || 'U';
  return pseudo.slice(0, 2).toUpperCase();
});

const dialogPseudo = ref(false);
const dialogEmail = ref(false);
const dialogPass = ref(false);
const dialogConfirmation = ref(false);

const tempPseudo = ref('');
const tempEmail = ref('');
const tempPass = ref('');
const tempPassConfirm = ref('');
const tempOldPass = ref('');

const newPassword = ref(null);
const newPasswordConfirm = ref(null);

const errorMessage = ref('');
const snackbar = ref(false);
const snackbarText = ref('');

const emailRules = [
  v => !!v || t('auth.emailRequired'),
  v => /.+@.+\..+/.test(v) || t('auth.emailInvalid')
];
const passwordRules = [
  v => !!v || t('auth.passwordRequired'),
  v => v.length >= 6 || t('auth.passwordLength')
];

const newPasswordFocus = () => newPassword.value?.focus();
const newPasswordConfirmFocus = () => newPasswordConfirm.value?.focus();

const savePseudo = async () => {
  try {
    errorMessage.value = '';
    const token = localStorage.getItem('user_token');
    const newPseudo = (tempPseudo.value || '').trim();

    if (!newPseudo) {
      errorMessage.value = t('profile.enterUsername');
      return;
    }

    await apiClient.put('/auth/update/pseudo', { newPseudo });

    const updatedUser = { ...authStore.user, pseudo: newPseudo };
    authStore.setUser(updatedUser);

    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      storedUser.pseudo = newPseudo;
      localStorage.setItem('user', JSON.stringify(storedUser));
    }

    tempPseudo.value = '';
    dialogPseudo.value = false;
  } catch (error) {
    console.error(error);
    errorMessage.value = getApiErrorMessage(error, {
      network: t('auth.networkError'),
      generic: t('profile.updateError')
    });
  }
};

const saveEmail = async () => {
  try {
    errorMessage.value = '';
    const token = localStorage.getItem('user_token');
    const newMail = (tempEmail.value || '').trim();
    const currentPassword = (tempOldPass.value || '').trim();

    if (!newMail) {
      errorMessage.value = t('profile.enterEmail');
      return;
    }

    if (!/.+@.+\..+/.test(newMail)) {
      errorMessage.value = t('auth.invalidEmail');
      return;
    }

    const response = await apiClient.put('/auth/update/mail', { newMail, currentPassword });

    const newToken = response.data.token;
    const updatedUser = { ...authStore.user, mail: newMail };
    authStore.setUser(updatedUser);

    if (newToken) {
      localStorage.setItem('user_token', newToken);
      authStore.token = newToken;
    }

    tempEmail.value = '';
    tempOldPass.value = '';
    dialogEmail.value = false;

    snackbarText.value = t('profile.emailUpdated');
    snackbar.value = true;
  } catch (error) {
    console.error(error);
    errorMessage.value = getApiErrorMessage(error, {
      network: t('auth.networkError'),
      generic: t('profile.updateError')
    });
  }
};

const savePass = async () => {
  try {
    errorMessage.value = '';

    if (!tempOldPass.value || !tempPass.value) {
      errorMessage.value = t('profile.fillAll');
      return;
    }

    if (tempPass.value !== tempPassConfirm.value) {
      errorMessage.value = t('profile.passwordsMismatch');
      return;
    }

    if (tempPass.value.length < 6) {
      errorMessage.value = t('profile.newPasswordLength');
      return;
    }

    await apiClient.put('/auth/update/password', {
      oldPassword: tempOldPass.value,
      newPassword: tempPass.value
    });

    tempPass.value = '';
    tempPassConfirm.value = '';
    tempOldPass.value = '';
    dialogPass.value = false;

    snackbarText.value = t('profile.passwordUpdated');
    snackbar.value = true;
  } catch (error) {
    console.error(error);
    errorMessage.value = getApiErrorMessage(error, {
      network: t('auth.networkError'),
      generic: t('profile.changePasswordError')
    });
  }
};

const deleteUser = () => {
  dialogConfirmation.value = true;
};

const confirmDeleteUser = async () => {
  try {
    await apiClient.delete('/auth/delete');

    authStore.logout();
    router.push('/');
  } catch (error) {
    console.error('Erreur lors de la suppression du compte :', error);
  }
};

const closeDialogs = () => {
  dialogPseudo.value = false;
  dialogEmail.value = false;
  dialogPass.value = false;
  errorMessage.value = '';
  tempPseudo.value = '';
  tempEmail.value = '';
  tempPass.value = '';
  tempPassConfirm.value = '';
  tempOldPass.value = '';
};

const changeWatchlistVisibilityOnMainPage = (value) => {
  authStore.setShowWatchlistOnMainPage(value);
};
</script>

<template>
  <v-container class="profil-container py-8 py-md-12">
    <!-- Hero Identity Card -->
    <div class="profile-hero-card rounded-xl pa-6 pa-md-8 mb-8">
      <div class="profile-hero-glow"></div>
      <div class="profile-hero-content d-flex flex-column flex-md-row align-start align-md-center justify-space-between ga-6">
        <div class="d-flex align-center ga-5">
          <div class="avatar-circle">
            <span>{{ userInitials }}</span>
          </div>
          <div>
            <h1 class="text-h4 font-weight-bold mb-1">{{ authStore.user?.pseudo }}</h1>
            <p class="text-body-2 opacity-75 mb-3">{{ authStore.user?.mail }}</p>
            <div class="d-flex flex-wrap ga-2">
              <span class="info-pill">
                <v-icon size="14" class="mr-1">mdi-calendar-account</v-icon>
                {{ $t('profile.memberSince') }} {{ formatDate(authStore.user?.registrationDate) }}
              </span>
              <span class="info-pill">
                <v-icon size="14" class="mr-1">mdi-clock-check-outline</v-icon>
                {{ $t('profile.lastLogin') }} {{ formatDate(authStore.user?.lastLoginDate) }}
              </span>
            </div>
          </div>
        </div>

        <v-btn
          color="#8C52FF"
          variant="flat"
          rounded="pill"
          prepend-icon="mdi-bookmark-multiple-outline"
          class="text-none font-weight-semibold px-6"
          @click="router.push('/library')"
        >
          {{ $t('header.library') }}
        </v-btn>
      </div>
    </div>

    <!-- Personal Stats Row -->
    <v-row class="mb-6" dense>
      <v-col cols="6" sm="3">
        <div class="stat-tile rounded-xl pa-4">
          <v-icon color="#8C52FF" size="22" class="mb-2">mdi-movie-check-outline</v-icon>
          <div class="stat-num">{{ statsLoading ? '—' : stats.moviesWatched }}</div>
          <div class="stat-lbl">{{ $t('profile.statsMoviesWatched') }}</div>
        </div>
      </v-col>
      <v-col cols="6" sm="3">
        <div class="stat-tile rounded-xl pa-4">
          <v-icon color="#8C52FF" size="22" class="mb-2">mdi-television-classic</v-icon>
          <div class="stat-num">{{ statsLoading ? '—' : stats.seriesWatched }}</div>
          <div class="stat-lbl">{{ $t('profile.statsSeriesWatched') }}</div>
        </div>
      </v-col>
      <v-col cols="6" sm="3">
        <div class="stat-tile rounded-xl pa-4">
          <v-icon color="#8C52FF" size="22" class="mb-2">mdi-clock-outline</v-icon>
          <div class="stat-num">{{ statsLoading ? '—' : `${stats.watchHours} h` }}</div>
          <div class="stat-lbl">{{ $t('profile.statsWatchTime') }}</div>
        </div>
      </v-col>
      <v-col cols="6" sm="3">
        <div class="stat-tile rounded-xl pa-4">
          <v-icon color="#fbbf24" size="22" class="mb-2">mdi-star</v-icon>
          <div class="stat-num">{{ statsLoading ? '—' : stats.avgRating }}</div>
          <div class="stat-lbl">{{ $t('profile.statsAvgRating') }}</div>
        </div>
      </v-col>
    </v-row>

    <!-- Bento Grid -->
    <v-row>
      <!-- Left Column: Account & Security -->
      <v-col cols="12" md="6">
        <v-card class="bento-card rounded-xl pa-6 h-100" elevation="0">
          <div class="d-flex align-center ga-3 mb-6">
            <div class="section-icon">
              <v-icon size="20" color="#8C52FF">mdi-shield-account-outline</v-icon>
            </div>
            <h2 class="text-h6 font-weight-bold">{{ $t('profile.accountSecurity') }}</h2>
          </div>

          <div class="account-rows">
            <div class="account-row">
              <div>
                <div class="row-label">{{ $t('auth.username') }}</div>
                <div class="row-value">{{ authStore.user?.pseudo }}</div>
              </div>
              <v-btn
                variant="tonal"
                color="#8C52FF"
                rounded="pill"
                size="small"
                class="text-none font-weight-semibold"
                @click="dialogPseudo = true"
              >
                {{ $t('profile.editBtn') }}
              </v-btn>
            </div>

            <div class="account-row">
              <div>
                <div class="row-label">{{ $t('auth.email') }}</div>
                <div class="row-value">{{ authStore.user?.mail }}</div>
              </div>
              <v-btn
                variant="tonal"
                color="#8C52FF"
                rounded="pill"
                size="small"
                class="text-none font-weight-semibold"
                @click="dialogEmail = true"
              >
                {{ $t('profile.editBtn') }}
              </v-btn>
            </div>

            <div class="account-row">
              <div>
                <div class="row-label">{{ $t('auth.password') }}</div>
                <div class="row-value">••••••••••••</div>
              </div>
              <v-btn
                variant="tonal"
                color="#8C52FF"
                rounded="pill"
                size="small"
                class="text-none font-weight-semibold"
                @click="dialogPass = true"
              >
                {{ $t('profile.editBtn') }}
              </v-btn>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Right Column: Preferences & Danger Zone -->
      <v-col cols="12" md="6" class="d-flex flex-column ga-6">
        <v-card class="bento-card rounded-xl pa-6" elevation="0">
          <div class="d-flex align-center ga-3 mb-6">
            <div class="section-icon">
              <v-icon size="20" color="#8C52FF">mdi-tune-variant</v-icon>
            </div>
            <h2 class="text-h6 font-weight-bold">{{ $t('profile.settings') }}</h2>
          </div>

          <!-- Language -->
          <div class="mb-5">
            <v-select
              v-model="languageSelection"
              :items="languageOptions"
              item-title="title"
              item-value="value"
              :label="$t('language.label')"
              :hint="$t('profile.languageHelp')"
              persistent-hint
              variant="outlined"
              density="comfortable"
              rounded="lg"
              @update:model-value="updateLanguage"
            />
          </div>

          <!-- Theme Selector Pills -->
          <div class="mb-5">
            <div class="text-caption font-weight-medium opacity-75 mb-2">{{ $t('theme.label') }}</div>
            <div class="theme-grid">
              <button
                v-for="opt in themeOptions"
                :key="opt.value"
                type="button"
                class="theme-option"
                :class="{ 'theme-option-active': themeSelection === opt.value }"
                @click="updateTheme(opt.value)"
              >
                <v-icon size="18" class="mb-1">{{ opt.icon }}</v-icon>
                <span class="text-caption font-weight-semibold">{{ opt.title }}</span>
              </button>
            </div>
            <div class="text-caption opacity-60 mt-2">{{ $t('profile.themeHelp') }}</div>
          </div>

          <v-divider class="my-4 opacity-10" />

          <!-- Watchlist Visibility Switch -->
          <div class="d-flex align-center justify-space-between ga-4">
            <span class="text-body-2 font-weight-medium">{{ $t('profile.showMyWatchlist') }}</span>
            <v-switch
              v-model="authStore.showWatchlistOnMainPage"
              color="#8C52FF"
              hide-details
              inset
              @update:model-value="changeWatchlistVisibilityOnMainPage"
            />
          </div>
        </v-card>

        <!-- Danger Zone -->
        <v-card class="bento-card danger-card rounded-xl pa-6" elevation="0">
          <div class="d-flex flex-column flex-sm-row align-start align-sm-center justify-space-between ga-4">
            <div>
              <h3 class="text-subtitle-1 font-weight-bold text-error mb-1">
                {{ $t('profile.dangerZone') }}
              </h3>
              <p class="text-caption opacity-75 mb-0">
                {{ $t('media.deleteAccountQuestion') }}
              </p>
            </div>
            <v-btn
              color="error"
              variant="tonal"
              rounded="pill"
              prepend-icon="mdi-delete-outline"
              class="text-none font-weight-semibold flex-shrink-0"
              @click="deleteUser()"
            >
              {{ $t('profile.deleteAccount') }}
            </v-btn>
          </div>
        </v-card>
      </v-col>
    </v-row>

    <!-- Edit Username Dialog -->
    <v-dialog v-model="dialogPseudo" max-width="420">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-4">{{ $t('profile.editUsername') }}</h3>
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-text-field
          v-model="tempPseudo"
          :label="$t('profile.newUsername')"
          variant="outlined"
          rounded="lg"
          type="text"
        />
        <v-card-actions class="px-0 pt-2">
          <v-spacer />
          <v-btn variant="text" rounded="pill" @click="closeDialogs">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="#8C52FF" variant="flat" rounded="pill" class="px-5" @click="savePseudo">
            {{ $t('common.validate') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Email Dialog -->
    <v-dialog v-model="dialogEmail" max-width="420">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-4">{{ $t('profile.editEmail') }}</h3>
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-text-field
          v-model="tempEmail"
          :label="$t('profile.newEmail')"
          variant="outlined"
          rounded="lg"
          type="email"
          :rules="emailRules"
          class="mb-2"
        />
        <v-text-field
          v-model="tempOldPass"
          :label="$t('auth.password')"
          type="password"
          variant="outlined"
          rounded="lg"
          @keydown.enter.prevent="saveEmail"
        />
        <v-card-actions class="px-0 pt-2">
          <v-spacer />
          <v-btn variant="text" rounded="pill" @click="closeDialogs">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="#8C52FF" variant="flat" rounded="pill" class="px-5" @click="saveEmail">
            {{ $t('common.validate') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- Edit Password Dialog -->
    <v-dialog v-model="dialogPass" max-width="420">
      <v-card class="pa-6 rounded-xl">
        <h3 class="text-h6 font-weight-bold mb-4">{{ $t('profile.editPassword') }}</h3>
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>
        <v-text-field
          v-model="tempOldPass"
          :label="$t('profile.oldPassword')"
          type="password"
          variant="outlined"
          rounded="lg"
          class="mb-2"
          @keydown.enter.prevent="newPasswordFocus"
        />
        <v-text-field
          v-model="tempPass"
          :label="$t('profile.newPassword')"
          type="password"
          variant="outlined"
          rounded="lg"
          ref="newPassword"
          class="mb-2"
          @keydown.enter.prevent="newPasswordConfirmFocus"
          :rules="passwordRules"
        />
        <v-text-field
          v-model="tempPassConfirm"
          :label="$t('profile.confirmPassword')"
          type="password"
          variant="outlined"
          rounded="lg"
          ref="newPasswordConfirm"
          @keydown.enter.prevent="savePass"
        />
        <v-card-actions class="px-0 pt-2">
          <v-spacer />
          <v-btn variant="text" rounded="pill" @click="closeDialogs">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="#8C52FF" variant="flat" rounded="pill" class="px-5" @click="savePass">
            {{ $t('common.validate') }}
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>

  <v-snackbar v-model="snackbar" timeout="3000" color="success" variant="flat" rounded="pill">
    {{ snackbarText }}
  </v-snackbar>

  <ConfirmationDialog
    v-model="dialogConfirmation"
    :title="$t('media.deleteAccount')"
    :message="$t('media.deleteAccountQuestion')"
    :confirm-text="$t('common.delete')"
    :cancel-text="$t('common.cancel')"
    @confirm="confirmDeleteUser"
  />
</template>

<style scoped>
.profil-container {
  max-width: 1120px;
}

.profile-hero-card {
  position: relative;
  overflow: hidden;
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .profile-hero-card {
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.05);
}

.profile-hero-glow {
  position: absolute;
  top: -80px;
  right: -60px;
  width: 320px;
  height: 320px;
  background: radial-gradient(circle, rgba(140, 82, 255, 0.25) 0%, transparent 70%);
  pointer-events: none;
}

.profile-hero-content {
  position: relative;
  z-index: 1;
}

.avatar-circle {
  width: 76px;
  height: 76px;
  border-radius: 50%;
  background: linear-gradient(135deg, #8C52FF, #5e2ced);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 800;
  color: #ffffff;
  flex-shrink: 0;
  box-shadow: 0 8px 24px rgba(140, 82, 255, 0.35);
}

.info-pill {
  display: inline-flex;
  align-items: center;
  padding: 4px 11px;
  border-radius: 999px;
  font-size: 0.76rem;
  font-weight: 500;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

:root[data-theme='light'] .info-pill {
  background: rgba(0, 0, 0, 0.04);
  border-color: rgba(0, 0, 0, 0.08);
}

.bento-card,
.stat-tile {
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .bento-card,
:root[data-theme='light'] .stat-tile {
  border-color: rgba(0, 0, 0, 0.08);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04) !important;
}

.stat-num {
  font-size: 1.65rem;
  font-weight: 800;
  line-height: 1.15;
}

.stat-lbl {
  font-size: 0.78rem;
  opacity: 0.65;
  margin-top: 2px;
}

.danger-card {
  border-color: rgba(239, 68, 68, 0.25);
}

.section-icon {
  width: 38px;
  height: 38px;
  border-radius: 10px;
  background: rgba(140, 82, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
}

.account-rows {
  display: flex;
  flex-direction: column;
}

.account-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);
}

:root[data-theme='light'] .account-row {
  border-bottom-color: rgba(0, 0, 0, 0.07);
}

.account-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.row-label {
  font-size: 0.78rem;
  opacity: 0.6;
  margin-bottom: 2px;
}

.row-value {
  font-size: 0.95rem;
  font-weight: 600;
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.theme-option {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 12px 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.1);
  color: inherit;
  cursor: pointer;
  transition: all 0.2s ease;
}

:root[data-theme='light'] .theme-option {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.1);
}

.theme-option:hover {
  border-color: rgba(140, 82, 255, 0.5);
}

.theme-option-active {
  background: rgba(140, 82, 255, 0.15) !important;
  border-color: #8C52FF !important;
  color: #b794ff;
}

:root[data-theme='light'] .theme-option-active {
  color: #6b21a8;
}
</style>
