<script setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import axios from 'axios';

const route = useRoute();
const router = useRouter();
const isLogin = ref(true);
const loading = ref(false);
const email = ref('');
const password = ref('');
const username = ref('');

const emailRules = [
  v => !!v || 'Email requis',
  v => /.+@.+\..+/.test(v) || 'L\'email doit être valide'
];
const passwordRules = [
  v => !!v || 'Mot de passe requis',
  v => v.length >= 6 || 'Le mot de passe doit contenir au moins 6 caractères'
];

onMounted(() => {
  if (route.path === '/register') {
    isLogin.value = false;
  } else {
    isLogin.value = true;
  }
});

const errorMessage = ref('');

const handleSubmit = async () => {

    let mail = email.value;
    let pwd = password.value;

    if(!mail || !pwd) {
        errorMessage.value = 'L\'email et le mot de passe sont requis.';
        return;
    }
    if(!isLogin.value && !username.value) {
        errorMessage.value = 'Le nom d\'utilisateur est requis pour l\'inscription.';
        return;
    }

    loading.value = true;
    errorMessage.value = '';
    
    const apiPath = import.meta.env.VITE_API_BASE_URL;
    const endpoint = isLogin.value ? '/user/login' : '/user/register';
    
    const payload = {
        mail: mail,
        password: pwd,
        ...(isLogin.value ? {} : { pseudo: username.value })
    };

    try {
        const response = await axios.post(apiPath + endpoint, payload);
        router.push('/');
    } catch (error) {
        if (error.response) {
            errorMessage.value = error.response.data.message || 'Une erreur est survenue lors de l\'authentification.';
        } else {
            errorMessage.value = 'Une erreur est survenue. Veuillez réessayer plus tard.';
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
            title="Erreur d'authentification"
            :text="errorMessage"
            variant="tonal"
            closable
            class="mb-5"
            @click:close="errorMessage = ''"
        ></v-alert>

        <v-card class="elevation-12" :loading="loading" rounded="lg">
        <v-toolbar color="#8C52FF" dark flat>
            <v-toolbar-title>
            {{ isLogin ? 'Connexion' : 'Inscription' }}
            </v-toolbar-title>
        </v-toolbar>
        
        <v-card-text>
            <v-form @submit.prevent="handleSubmit">
            <v-text-field
                v-if="!isLogin"
                v-model="username"
                label="Nom d'utilisateur"
                prepend-icon="mdi-account"
                type="text"
                required
            ></v-text-field>

            <v-text-field
                v-model="email"
                label="Email"
                prepend-icon="mdi-email"
                type="email"
                :rules="emailRules"
                required
            ></v-text-field>

            <v-text-field
                v-model="password"
                label="Mot de passe"
                prepend-icon="mdi-lock"
                type="password"
                :rules="passwordRules"
                required
            ></v-text-field>
            </v-form>
        </v-card-text>

        <v-card-actions class="flex-column">
            <v-btn
            color="#8C52FF"
            block
            :loading="loading"
            @click="handleSubmit"
            :disabled="email === '' || password === '' || (!isLogin && username === '')"
            >
            {{ isLogin ? 'Se connecter' : "S'inscrire" }}
            </v-btn>
            
            <v-btn
            variant="text"
            class="mt-2"
            @click="isLogin = !isLogin"
            >
            {{ isLogin ? "Pas de compte ? Créer un compte" : "Déjà un compte ? Se connecter" }}
            </v-btn>
        </v-card-actions>
        </v-card>
    </v-col>
    </v-row>
</v-container>
</template>