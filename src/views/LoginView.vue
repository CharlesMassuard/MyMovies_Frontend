<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useI18n } from 'vue-i18n';

//initialisation
const authStore = useAuthStore();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();

//etats
const isLogin = ref(true);
const loading = ref(false);
const showPassword = ref(false);
const errorMessage = ref('');
const formRef = ref(null);
const emailField = ref(null);
const passwordField = ref(null);

//donnees
const formData = ref({
  username: '',
  email: '',
  password: ''
});

//regles
const rules = {
  required: v => !!v || t('auth.requiredField'),
  email: v => /.+@.+\..+/.test(v) || t('auth.invalidEmail'),
  password: v => (v && v.length >= 6) || t('auth.passwordLength')
};

onMounted(() => {
  isLogin.value = route.path !== '/register';
});

//bascule
const toggleMode = () => {
  isLogin.value = !isLogin.value;
  errorMessage.value = '';
  formRef.value?.resetValidation();
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
  const { valid } = await formRef.value.validate();
  if (!valid) return;

  loading.value = true;
  errorMessage.value = '';

  const apiPath = import.meta.env.VITE_API_BASE_URL;
  const endpoint = isLogin.value ? '/auth/login' : '/auth/register';

  //payload
  const payload = {
    mail: formData.value.email,
    password: formData.value.password,
    ...(isLogin.value ? {} : { pseudo: formData.value.username })
  };

  try {
    const response = await axios.post(apiPath + endpoint, payload);
    authStore.login(response.data.token, response.data.refreshToken, response.data.user);
    
    if (route.query.redirect) {
      router.push(route.query.redirect);
    } else {
      router.push('/');
    }
  } catch (error) {
    errorMessage.value = error.response?.data?.message || t('auth.generic');
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
            <v-icon icon="mdi-movie-open-play" color="#8C52FF" size="72" class="mb-3"></v-icon>
            <h1 class="text-h4 font-weight-black mb-1">MyMovies</h1>
          </div>

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

          <v-form ref="formRef" @submit.prevent="handleSubmit">
            
            <v-slide-y-transition>
              <v-text-field
                v-if="!isLogin"
                v-model="formData.username"
                :label="$t('auth.username')"
                prepend-inner-icon="mdi-account"
                variant="outlined"
                color="#8C52FF"
                :rules="[rules.required]"
                class="mb-2"
                @keydown.enter.prevent="focusField(emailField)"
              ></v-text-field>
            </v-slide-y-transition>

            <v-text-field
              v-model="formData.email"
              :label="$t('auth.email')"
              prepend-inner-icon="mdi-email"
              type="email"
              variant="outlined"
              color="#8C52FF"
              :rules="[rules.required, rules.email]"
              class="mb-2"
              ref="emailField"
              @keydown.enter.prevent="focusField(passwordField)"
            ></v-text-field>

            <v-text-field
              v-model="formData.password"
              :label="$t('auth.password')"
              prepend-inner-icon="mdi-lock"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              @click:append-inner="showPassword = !showPassword"
              :type="showPassword ? 'text' : 'password'"
              variant="outlined"
              color="#8C52FF"
              :rules="[rules.required, rules.password]"
              class="mb-2"
              ref="passwordField"
              @keydown.enter.prevent="handleSubmit"
            ></v-text-field>

            <div v-if="isLogin" class="d-flex justify-end mb-6">
              <router-link to="/forgot-password" class="text-caption font-weight-medium text-decoration-none" style="color: #8C52FF;">
                {{ $t('auth.forgotPassword') }}
              </router-link>
            </div>

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
              {{ isLogin ? $t('auth.submitLogin') : $t('auth.submitRegister') }}
            </v-btn>

            <div class="text-center">
              <a href="#" @click.prevent="toggleMode" class="text-body-2 font-weight-medium text-decoration-none" style="color: #8C52FF;">
                {{ isLogin ? $t('auth.switchToRegister') : $t('auth.switchToLogin') }}
              </a>
            </div>

          </v-form>
        </v-card>
        
      </v-col>
    </v-row>
  </v-container>
</template>