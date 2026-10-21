<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { getApiErrorMessage } from '../utils/apiError';

//initialisation
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

//etats
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const formRef = ref(null);
const showPassword = ref(false);
const password = ref('');
const confirmPassword = ref('');
const token = ref('');
const confirmPasswordField = ref(null);

//recuperationdutokendanslurl
onMounted(() => {
  token.value = route.query.token;
  if (!token.value) {
    errorMessage.value = t('auth.invalidToken');
  }
});

//regles
const rules = {
  required: v => !!v || t('auth.requiredField'),
  password: v => (v && v.length >= 6) || t('auth.passwordLength'),
  match: v => v === password.value || t('auth.passwordsDoNotMatch')
};

//gestiondufocus
const focusField = fieldInstance => {
  if (fieldInstance?.focus) {
    fieldInstance.focus();
  } else {
    const input = fieldInstance?.$el?.querySelector('input');
    if (input) input.focus();
  }
};

//soumission
const handleSubmit = async () => {
  if (!token.value) return;
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  errorMessage.value = '';
  
  const apiPath = import.meta.env.VITE_API_BASE_URL;

  try {
//appelAPI
    await axios.post(`${apiPath}/auth/reset-password`, { 
      token: token.value,
      password: password.value
    });
    
    successMessage.value = t('auth.passwordResetSuccess');
    
//redirectionautomatiqueapres3secondes
    setTimeout(() => {
      router.push('/login');
    }, 3000);
    
  } catch (error) {
    errorMessage.value = getApiErrorMessage(error, {
      network: t('auth.networkError'),
      generic: t('auth.generic')
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <v-container class="fill-height bg-grey-darken-4" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="5" lg="4">
        
        <v-card class="elevation-12 pa-6 pa-sm-8" rounded="xl" theme="dark">
          
          <div class="text-center mb-8">
            <v-icon icon="mdi-shield-lock" color="#8C52FF" size="72" class="mb-3"></v-icon>
            <h1 class="text-h4 font-weight-black mb-1">MyMovies</h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              {{ $t('auth.resetPasswordTitle') }}
            </p>
          </div>

          <v-alert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-6"
          >
            {{ successMessage }} <br>
            <small>{{ $t('auth.redirectingToLogin') }}</small>
          </v-alert>

          <v-alert
            v-if="errorMessage"
            type="error"
            variant="tonal"
            closable
            class="mb-6"
            @click:close="errorMessage = ''"
          >
            {{ errorMessage }}
          </v-alert>

          <v-form v-if="!successMessage" ref="formRef" @submit.prevent="handleSubmit">
            
            <v-text-field
              v-model="password"
              :label="$t('auth.newPassword')"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              color="#8C52FF"
              :rules="[rules.required, rules.password]"
              class="mb-2"
              @keydown.enter.prevent="focusField(confirmPasswordField)"
            ></v-text-field>

            <v-text-field
              v-model="confirmPassword"
              :label="$t('auth.confirmPassword')"
              prepend-inner-icon="mdi-lock-check"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              color="#8C52FF"
              :rules="[rules.required, rules.match]"
              class="mb-6"
              ref="confirmPasswordField"
              @keydown.enter.prevent="handleSubmit"
            ></v-text-field>

            <v-btn
              color="#8C52FF"
              size="x-large"
              block
              type="submit"
              :loading="loading"
              :disabled="!token"
              class="font-weight-bold text-none"
              rounded="lg"
              elevation="4"
            >
              {{ $t('auth.submitReset') }}
            </v-btn>

          </v-form>

          <div class="text-center mt-6">
            <router-link to="/login" class="text-body-2 font-weight-medium text-decoration-none" style="color: #8C52FF;">
              {{ $t('auth.backToLogin') }}
            </router-link>
          </div>

        </v-card>
        
      </v-col>
    </v-row>
  </v-container>
</template>