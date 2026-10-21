<script setup>
import { ref } from 'vue';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import { getApiErrorMessage } from '../utils/apiError';

//initialisation
const { t } = useI18n();

//etats
const loading = ref(false);
const successMessage = ref('');
const errorMessage = ref('');
const formRef = ref(null);
const email = ref('');

//regles
const rules = {
  required: v => !!v || t('auth.requiredField'),
  email: v => /.+@.+\..+/.test(v) || t('auth.invalidEmail')
};

//soumission
const handleSubmit = async () => {
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  errorMessage.value = '';
  successMessage.value = '';

  const apiPath = import.meta.env.VITE_API_BASE_URL;

  try {
    //appelAPI
    await axios.post(`${apiPath}/auth/forgot-password`, { mail: email.value });
    successMessage.value = t('auth.resetLinkSent');
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
            <v-icon icon="mdi-lock-reset" color="#8C52FF" size="72" class="mb-3"></v-icon>
            <h1 class="text-h4 font-weight-black mb-1">MyMovies</h1>
            <p class="text-subtitle-1 text-medium-emphasis">
              {{ $t('auth.forgotPasswordTitle') }}
            </p>
          </div>

          <v-alert
            v-if="successMessage"
            type="success"
            variant="tonal"
            class="mb-6"
          >
            {{ successMessage }}
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
            
            <p class="text-body-2 mb-6 text-medium-emphasis text-center">
              {{ $t('auth.forgotPasswordInstructions') }}
            </p>

            <v-text-field
              v-model="email"
              :label="$t('auth.email')"
              prepend-inner-icon="mdi-email"
              type="email"
              variant="outlined"
              color="#8C52FF"
              :rules="[rules.required, rules.email]"
              class="mb-4"
            ></v-text-field>

            <v-btn
              color="#8C52FF"
              size="x-large"
              block
              type="submit"
              :loading="loading"
              class="mb-6 font-weight-bold text-none"
              rounded="lg"
              elevation="4"
            >
              {{ $t('auth.sendResetLink') }}
            </v-btn>

          </v-form>

          <div class="text-center mt-2">
            <router-link to="/login" class="text-body-2 font-weight-medium text-decoration-none" style="color: #8C52FF;">
              <v-icon icon="mdi-arrow-left" size="small" class="mr-1"></v-icon>
              {{ $t('auth.backToLogin') }}
            </router-link>
          </div>

        </v-card>
        
      </v-col>
    </v-row>
  </v-container>
</template>