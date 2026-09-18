<script setup>
import { useRouter, useRoute } from 'vue-router';

const props = defineProps({
  modelValue: Boolean,
  message: String
});

const emit = defineEmits(['update:modelValue']);
const router = useRouter();
const route = useRoute();

const closeDialog = () => {
  emit('update:modelValue', false);
};

const goToLogin = () => {
  emit('update:modelValue', false);
  router.push({ path: '/login', query: { redirect: route.fullPath } });
};
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" width="400">
    <v-card class="rounded-xl pa-4">
      <div class="text-center">
        <v-icon color="#8C52FF" size="64" class="mb-4">mdi-account-lock</v-icon>
        <v-card-title class="text-h5 font-weight-bold justify-center">Authentification requise</v-card-title>
      </div>
      
      <v-card-text class="text-center text-body-1 text-grey-darken-1">
        {{ message || "Vous devez être connecté pour effectuer cette action." }}
      </v-card-text>

      <v-card-actions class="flex-column ga-2 mt-4">
        <v-btn
          block
          color="#8C52FF"
          size="large"
          rounded="xl"
          variant="flat"
          @click="goToLogin"
        >
          Se connecter
        </v-btn>
        
        <v-btn
          block
          variant="text"
          rounded="xl"
          @click="closeDialog"
        >
          Plus tard
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>