<script setup>
defineProps({
  voteAverage: { type: Number, default: 0 }
});
</script>

<template>
  <div class="score-section my-6 d-flex align-center">
    <v-progress-circular
      :model-value="voteAverage * 10"
      color="green-accent-3"
      size="60"
      width="6"
      class="bg-black rounded-circle"
    >
      <span class="font-weight-bold text-caption">{{ Math.round(voteAverage * 10) }}%</span>
    </v-progress-circular>
    <span class="ml-3 font-weight-bold" style="line-height: 1.2;">Score d'évaluation<br>TMDB</span>
  </div>
</template>