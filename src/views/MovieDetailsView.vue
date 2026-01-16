<script setup>
  import { ref, onMounted } from 'vue';
  import { useRoute } from 'vue-router';
  import axios  from 'axios';
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const movieId = useRoute().params.id;
  
  const fetchDetailsMovies = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/movies/${movieId}`);
      console.log('Movie details:', response.data);
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  };

  onMounted(() => {
    fetchDetailsMovies();
  });

</script>

<template>
  <v-container fluid class="pa-4">
    <h1>{{ msg }}</h1>
    <v-btn @click="count++">You clicked me {{ count }} times.</v-btn>
  </v-container>
</template>

<style scoped>

</style>
