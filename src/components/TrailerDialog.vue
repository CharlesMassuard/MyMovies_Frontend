<script setup>
const props = defineProps({
  modelValue: Boolean,
  videoKey: String
});
const emit = defineEmits(['update:modelValue']);

const closeDialog = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <v-dialog :model-value="modelValue" @update:model-value="emit('update:modelValue', $event)" max-width="900" transition="dialog-bottom-transition">
    <v-card class="bg-black rounded-xl overflow-hidden">
      <div class="d-flex justify-end pa-2 position-absolute w-100" style="z-index: 10;">
        <!--Bouton-de-fermeture-superposé-à-la-vidéo-->
        <v-btn icon="mdi-close" variant="flat" color="black" density="comfortable" @click="closeDialog" class="opacity-70"></v-btn>
      </div>
      
      <!--Le-v-if-permet-de-couper-le-son/la-vidéo-dès-qu'on-ferme-la-modale-->
      <div v-if="modelValue && videoKey" style="position: relative; padding-bottom: 56.25%; height: 0;">
        <iframe 
          :src="`https://www.youtube.com/embed/${videoKey}?autoplay=1`" 
          style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; border: 0;" 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowfullscreen>
        </iframe>
      </div>
    </v-card>
  </v-dialog>
</template>