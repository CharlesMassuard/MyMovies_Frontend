<script setup>
defineProps({
  statusUserMedia: { type: String, required: true },
  textButtonStatus: { type: Object, required: true },
  itemsStatus: { type: Array, required: true },
  displayRating: { type: String, required: true },
  showRatingButton: { type: Boolean, default: true },
  trailerKey: { type: String, default: null }
});

defineEmits(['main-click', 'update-status', 'open-rating', 'open-trailer']);
</script>

<template>
  <div class="actions-row mb-8 d-flex flex-wrap align-center ga-3">
    <v-menu 
      :close-on-content-click="true" 
      location="bottom center"
      offset="10"
      :disabled="statusUserMedia === 'UNDEFINED'"
    >
      <template v-slot:activator="{ props }">
          <v-btn 
              rounded="xl" 
              color="#8C52FF" 
              variant="flat"
              v-bind="props"
              class="action-btn flex-grow-1 flex-md-grow-0"
              min-width="250"
              @click="$emit('main-click')"
          >
              <v-icon start>{{ textButtonStatus[statusUserMedia].icon }}</v-icon>
              <span class="font-weight-bold">{{ textButtonStatus[statusUserMedia].text }}</span>
          </v-btn>
      </template>

      <v-list class="pa-2" width="350" elevation="12" rounded="lg">
          <v-list-item
              v-for="(item, index) in itemsStatus"
              :key="index"
              rounded="md"
              class="mb-1"
              @click="$emit('update-status', item.id)"
          >
              <template v-slot:prepend>
                  <v-icon size="small" :icon="item.icon" :color="item.color"></v-icon>
              </template>
              <v-list-item-title class="text-body-2 font-weight-medium" :class="item.color ? `text-${item.color}` : ''">
                {{ item.text }}
              </v-list-item-title>
          </v-list-item>
      </v-list>
    </v-menu>
    
    <v-btn 
      v-if="showRatingButton"
      rounded="xl" 
      color="white" 
      variant="flat"
      class="action-btn px-6"
      @click="$emit('open-rating')"
    >
      <v-icon start color="amber">mdi-star</v-icon>
      <span class="text-black font-weight-bold">{{ displayRating }}</span>
    </v-btn>

    <v-btn
      v-if="trailerKey"
      rounded="xl"
      variant="outlined"
      color="white"
      class="action-btn px-6"
      @click="$emit('open-trailer')"
    >
      <v-icon start>mdi-play</v-icon>
      <span class="font-weight-bold">Bande-annonce</span>
    </v-btn>
  </div>
</template>

<style scoped>
.action-btn {
  height: 44px !important;
}
</style>