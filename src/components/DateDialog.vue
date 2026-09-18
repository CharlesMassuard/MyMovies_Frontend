<script setup>
import { ref } from 'vue';

const props = defineProps({
  modelValue: Boolean,
  title: String
});

const emit = defineEmits(['update:modelValue', 'confirm']);
const selectedDate = ref(new Date());

const closeDialog = () => {
  emit('update:modelValue', false);
};

const confirmDate = () => {
  emit('confirm', selectedDate.value);
  closeDialog();
};

const setLongTimeAgo = () => {
  emit('confirm', 'long-time-ago');
  closeDialog();
};
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="420">
    <v-card rounded="xl" class="elevation-10">
      <v-card-title class="font-weight-bold pt-6 px-6 pb-2 text-h6">
        {{ title }}
      </v-card-title>
      
      <v-card-text class="pa-0 d-flex justify-center">
        <!--Ajout-de-w-100-pour-que-le-calendrier-prenne-bien-l'espace-->
        <v-date-picker 
          v-model="selectedDate" 
          color="#8C52FF" 
          hide-header 
          show-adjacent-months 
          control-variant="modal" 
          :max="new Date()"
          class="w-100"
        ></v-date-picker>
      </v-card-text>
      
      <v-divider></v-divider>
      
      <!--Utilisation-de-d-flex-flex-wrap-et-gap-pour-éviter-l'écrasement-sur-mobile-->
      <v-card-actions class="d-flex flex-wrap justify-space-between px-4 py-3 ga-2">
        <!--text-none-retire-les-majuscules-automatiques-->
        <v-btn 
          color="grey-darken-1" 
          variant="text" 
          class="text-none font-weight-medium" 
          @click="setLongTimeAgo"
        >
          Vu il y a longtemps
        </v-btn>
        
        <div class="d-flex ga-2 ml-auto">
          <v-btn 
            variant="text" 
            class="text-none font-weight-medium" 
            @click="closeDialog"
          >
            Annuler
          </v-btn>
          
          <v-btn 
            color="#8C52FF" 
            variant="flat" 
            class="text-none font-weight-bold px-4" 
            @click="confirmDate"
          >
            Confirmer
          </v-btn>
        </div>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>