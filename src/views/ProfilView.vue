<script setup>
    import { ref, computed } from 'vue'
    import { useI18n } from 'vue-i18n';
    import { useAuthStore } from '../stores/auth';
    import axios  from 'axios';
    import router from '../router';
    import ConfirmationDialog from '../components/ConfirmationDialog.vue';
    import i18n, { languagePreference, setLanguagePreference } from '../i18n';

    const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

    const authStore = useAuthStore();
    const { t } = useI18n();
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

    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateString).toLocaleDateString(i18n.global.locale.value, options);
    };

    const tab = ref('profile')
    const dialogPseudo = ref(false)
    const dialogEmail = ref(false)
    const dialogPass = ref(false)

    const dialogConfirmation = ref(false)

    const tempPseudo = ref('')
    const tempEmail = ref('')
    const tempPass = ref('')
    const tempPassConfirm = ref('')
    const tempOldPass = ref('')

    const newPassword = ref(null)
    const newPasswordConfirm = ref(null)

    const errorMessage = ref('')

    const snackbar = ref(false)
    const snackbarText = ref('')

    const emailRules = [
        v => !!v || t('auth.emailRequired'),
        v => /.+@.+\..+/.test(v) || t('auth.emailInvalid')
    ];
    const passwordRules = [
        v => !!v || t('auth.passwordRequired'),
        v => v.length >= 6 || t('auth.passwordLength')
    ];

    const newPasswordFocus = () => {
      newPassword.value?.focus()
    }

    const newPasswordConfirmFocus = () => {
      newPasswordConfirm.value?.focus()
    }

    const savePseudo = async () => {
      try {
        errorMessage.value = '';
        const token = localStorage.getItem('user_token');
        const newPseudo = (tempPseudo.value || '').trim();
        
        if (!newPseudo) {
          errorMessage.value = t('profile.enterUsername');
          return;
        }

        await axios.put(`${API_BASE_URL}/auth/update/pseudo`, { newPseudo }, {
          headers: { Authorization: `Bearer ${token}` }
        });

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
        errorMessage.value = error.response?.data?.message || t('profile.updateError');
      }
    }

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

        const emailPattern = /.+@.+\..+/;
        if (!emailPattern.test(newMail)) {
          errorMessage.value = t('auth.invalidEmail');
          return;
        }

        const response = await axios.put(`${API_BASE_URL}/auth/update/mail`, { newMail, currentPassword }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const newToken = response.data.token;

        const updatedUser = { ...authStore.user, mail: newMail };
        
        authStore.setUser(updatedUser);
        
        if (newToken) {
          localStorage.setItem('user_token', newToken);
          authStore.token = newToken;
        }

        tempEmail.value = '';
        dialogEmail.value = false;
        
        snackbarText.value = t('profile.emailUpdated');
        snackbar.value = true;
      } catch (error) {
        console.error(error);
        errorMessage.value = error.response?.data?.message || t('profile.updateError');
      }
    }

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

        if(tempPass.value.length < 6) {
          errorMessage.value = t('profile.newPasswordLength');
          return;
        }

        const token = localStorage.getItem('user_token');
        await axios.put(`${API_BASE_URL}/auth/update/password`, {
          oldPassword: tempOldPass.value,
          newPassword: tempPass.value
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        tempPass.value = ''
        tempPassConfirm.value = ''
        tempOldPass.value = ''
        dialogPass.value = false;
        
        snackbarText.value = t('profile.passwordUpdated');
        snackbar.value = true;
      } catch (error) {
        console.error(error);
        if (error.response && error.response.status === 400) {
          errorMessage.value = error.response?.data?.message || t('profile.currentPasswordError');
        } else {
          errorMessage.value = error.response?.data?.message || t('profile.changePasswordError');
        }
      }
    }

    const deleteUser = () => {
      dialogConfirmation.value = true;
    }

    const confirmDeleteUser = async () => {
      try {
        const token = localStorage.getItem('user_token');
        await axios.delete(`${API_BASE_URL}/auth/delete`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        authStore.logout();
        router.push("/");
      } catch (error) {
        console.error("Erreur lors de la suppression du compte :", error);
      }
    }

    const closeDialogs = () => {
        dialogPseudo.value = false;
        dialogEmail.value = false;
        dialogPass.value = false;
        errorMessage.value = '';
        tempEmail.value = '';
        tempPass.value = '';
        tempPassConfirm.value = '';
        tempOldPass.value = '';
    }
</script>

<template>
  <v-container class="py-10">
    <v-row justify="center">
      <v-col cols="12" sm="8" md="6">
        <v-card class="rounded-lg shadow-lg">
          
          <v-tabs v-model="tab" grow color="#8C52FF">
            <v-tab value="profile">{{ $t('profile.profile') }}</v-tab>
            <v-tab value="settings">{{ $t('profile.settings') }}</v-tab>
          </v-tabs>

          <v-window v-model="tab" class="pa-6">
            
            <v-window-item value="profile">
              <div class="text-center mb-6">
                <h2 class="text-h5 font-weight-bold">{{ authStore.user?.pseudo }}</h2>
                <p class="text-body-3 text-medium-emphasis">{{ authStore.user?.mail }}</p>
                <p class="text-body-2 text-medium-emphasis">
                  {{ $t('profile.memberSince') }} {{ formatDate(authStore.user?.registrationDate) }} -
                  {{ $t('profile.lastLogin') }} {{ formatDate(authStore.user?.lastLoginDate) }}
                </p>
              </div>

              <v-divider class="mb-6"></v-divider>

              <v-row dense>
                <v-col cols="12">
                  <v-btn
                    block
                    variant="outlined"
                    prepend-icon="mdi-account-edit"
                    @click="dialogPseudo = true"
                    class="mb-3"
                  >
                    {{ $t('profile.changeUsername') }}
                  </v-btn>
                  <v-btn
                    block
                    variant="outlined"
                    prepend-icon="mdi-email-edit"
                    @click="dialogEmail = true"
                    class="mb-3"
                  >
                    {{ $t('profile.changeEmail') }}
                  </v-btn>
                </v-col>
                <v-col cols="12">
                  <v-btn
                    block
                    variant="outlined"
                    prepend-icon="mdi-lock-reset"
                    @click="dialogPass = true"
                  >
                    {{ $t('profile.changePassword') }}
                  </v-btn>
                </v-col>
              </v-row>
            </v-window-item>

            <v-window-item value="settings">
              <v-select
                v-model="languageSelection"
                :items="languageOptions"
                item-title="title"
                item-value="value"
                :label="$t('language.label')"
                :hint="$t('profile.languageHelp')"
                persistent-hint
                variant="outlined"
                class="mt-6"
                @update:model-value="updateLanguage"
              ></v-select>
              <v-btn color="error" variant="text" class="px-0 mt-4" @click="deleteUser()">
                {{ $t('profile.deleteAccount') }}
              </v-btn>
            </v-window-item>
          </v-window>
        </v-card>
      </v-col>
    </v-row>

    <v-dialog v-model="dialogPseudo" max-width="400">
      <v-card :title="$t('profile.editUsername')" class="pa-4">
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-text-field
          v-model="tempPseudo"
          :label="$t('profile.newUsername')"
          variant="underlined"
          type="text"
        ></v-text-field>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialogs">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="#8C52FF" @click="savePseudo">{{ $t('common.validate') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogEmail" max-width="400">
      <v-card :title="$t('profile.editEmail')" class="pa-4">
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-text-field
          v-model="tempEmail"
          :label="$t('profile.newEmail')"
          variant="underlined"
          type="email"
          :rules="emailRules"
        ></v-text-field>
        <v-text-field
          v-model="tempOldPass"
          :label="$t('auth.password')"
          type="password"
          variant="underlined"
          @keydown.enter.prevent="newPasswordFocus"
        ></v-text-field>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialogs">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="#8C52FF" @click="saveEmail">{{ $t('common.validate') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <v-dialog v-model="dialogPass" max-width="400">
      <v-card :title="$t('profile.editPassword')" class="pa-4">
        <v-alert v-if="errorMessage" type="error" variant="tonal" density="compact" class="mb-4">
          {{ errorMessage }}
        </v-alert>

        <v-text-field
          v-model="tempOldPass"
          :label="$t('profile.oldPassword')"
          type="password"
          variant="underlined"
          @keydown.enter.prevent="newPasswordFocus"
        ></v-text-field>
        
        <v-text-field
          v-model="tempPass"
          :label="$t('profile.newPassword')"
          type="password"
          variant="underlined"
          ref="newPassword"
          @keydown.enter.prevent="newPasswordConfirmFocus"
          :rules="passwordRules"
        ></v-text-field>
        
        <v-text-field
          v-model="tempPassConfirm"
          :label="$t('profile.confirmPassword')"
          type="password"
          variant="underlined"
          ref="newPasswordConfirm"
          @keydown.enter.prevent="savePass"
        ></v-text-field>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn variant="text" @click="closeDialogs">{{ $t('common.cancel') }}</v-btn>
          <v-btn color="#8C52FF" @click="savePass">{{ $t('common.validate') }}</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
  <v-snackbar
      v-model="snackbar"
      timeout="3000"
      color="success"
      variant="flat"
    >
      {{ snackbarText }}
    </v-snackbar>
    <ConfirmationDialog
        v-model="dialogConfirmation"
        :title="$t('media.deleteAccount')"
        :message="$t('media.deleteAccountQuestion')"
        :confirm-text="$t('common.delete')"
        :cancel-text="$t('common.cancel')"
        @confirm="confirmDeleteUser"
  ></ConfirmationDialog>
</template>
