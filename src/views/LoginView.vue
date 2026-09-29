<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '../stores/auth';
import { useI18n } from 'vue-i18n';

const authStore = useAuthStore();
const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const isLogin = ref(true);  
const loading = ref(false);
const email = ref('');
const password = ref('');
const username = ref('');
const usernameField = ref(null);
const emailField = ref(null);
const passwordField = ref(null);

const emailRules = [
  v => !!v || t('auth.emailRequired'),
  v => /.+@.+\..+/.test(v) || t('auth.emailInvalid')
];
const passwordRules = [
  v => !!v || t('auth.passwordRequired'),
  v => v.length >= 6 || t('auth.passwordLength')
];

onMounted(() => {
  if (route.path === '/register') {
    isLogin.value = false;
  } else {
    isLogin.value = true;
  }
});

const focusEmail = () => {
    emailField.value?.focus?.();
};

const focusPassword = () => {
    passwordField.value?.focus?.();
};

const errorMessage = ref('');

const handleSubmit = async () => {

    let mail = email.value;
    let pwd = password.value;

    if(!mail || !pwd) {
        errorMessage.value = t('auth.emailAndPasswordRequired');
        return;
    }
    if(!isLogin.value && !username.value) {
        errorMessage.value = t('auth.usernameRequired');
        return;
    }

    const emailPattern = /.+@.+\..+/;
    if (!emailPattern.test(mail)) {
        errorMessage.value = t('auth.invalidEmail');
        return;
    }
    if (pwd.length < 6) {
        errorMessage.value = t('auth.passwordLength');
        return;
    }

    loading.value = true;
    errorMessage.value = '';
    
    const apiPath = import.meta.env.VITE_API_BASE_URL;
    const endpoint = isLogin.value ? '/auth/login' : '/auth/register';
    
    const payload = {
        mail: mail,
        password: pwd,
        ...(isLogin.value ? {} : { pseudo: username.value })
    };

    try {
        const response = await axios.post(apiPath + endpoint, payload);
        authStore.login(response.data.token, response.data.refreshToken, response.data.user)
        if(route.query.redirect) {
            router.push(route.query.redirect);
            return;
        }
        router.push('/');
    } catch (error) {
        if (error.response) {
            errorMessage.value = error.response.data.message || t('auth.generic');
        } else {
            errorMessage.value = t('auth.generic');
        }
    } finally {
        loading.value = false;
    }
};
</script>

<template>
<v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
    <v-col cols="12" sm="8" md="4">
        <v-alert
            v-if="errorMessage"
            type="error"
            :title="$t('auth.authError')"
            :text="errorMessage"
            variant="tonal"
            closable
            class="mb-5"
            @click:close="errorMessage = ''"
        ></v-alert>

        <v-card class="elevation-12" :loading="loading" rounded="lg">
        <v-toolbar color="#8C52FF" dark flat>
            <v-toolbar-title>
            {{ isLogin ? $t('auth.login') : $t('auth.register') }}
            </v-toolbar-title>
        </v-toolbar>
        
        <v-card-text>
            <v-form @submit.prevent="handleSubmit">
            <v-text-field
                v-if="!isLogin"
                v-model="username"
                :label="$t('auth.username')"
                prepend-icon="mdi-account"
                type="text"
                ref="usernameField"
                @keydown.enter.prevent="focusEmail"
                required
            ></v-text-field>

            <v-text-field
                v-model="email"
                :label="$t('auth.email')"
                prepend-icon="mdi-email"
                type="email"
                :rules="emailRules"
                ref="emailField"
                @keydown.enter.prevent="focusPassword"
                required
            ></v-text-field>

            <v-text-field
                v-model="password"
                :label="$t('auth.password')"
                prepend-icon="mdi-lock"
                type="password"
                :rules="passwordRules"
                ref="passwordField"
                @keydown.enter.prevent="handleSubmit"
                required
            ></v-text-field>

            <v-card-actions class="flex-column">
                <v-btn
                color="#8C52FF"
                block
                type="submit"
                :loading="loading"
                :disabled="email === '' || password === '' || (!isLogin && username === '')"
                >
                {{ isLogin ? $t('auth.submitLogin') : $t('auth.submitRegister') }}
                </v-btn>
                
                <v-btn
                variant="text"
                class="mt-2"
                type="button"
                @click="isLogin = !isLogin"
                >
                {{ isLogin ? $t('auth.switchToRegister') : $t('auth.switchToLogin') }}
                </v-btn>
            </v-card-actions>
            </v-form>
        </v-card-text>
        </v-card>
    </v-col>
    </v-row>
</v-container>
</template>
