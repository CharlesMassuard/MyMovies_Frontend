<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import axios from 'axios';
import noPoster from '../assets/noPosterAvailable.webp';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const router = useRouter();

const sections = ref([]);
const loading = ref(true);

const fetchRecommendations = async () => {
  const token = localStorage.getItem('user_token');
  if (!token) {
    loading.value = false;
    return;
  }
  try {
    const response = await axios.get(`${API_BASE_URL}/recommendations/personalized`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    sections.value = response.data;
  } catch (error) {
    console.error('Erreur lors de la récupération des recommandations personnalisées :', error);
  } finally {
    loading.value = false;
  }
};

const goToItem = (item) => {
  if (item.type === 'serie') {
    router.push(`/serie/${item.id}`);
  } else {
    router.push(`/movie/${item.id}`);
  }
};

onMounted(() => {
  fetchRecommendations();
});
</script>

<template>
  <div v-if="sections.length > 0" class="my-8">
    <div v-for="(section, idx) in sections" :key="idx" class="mb-10">
      <div class="d-flex align-center mb-4 px-2">
        <v-icon color="#8C52FF" class="mr-2">mdi-sparkles</v-icon>
        <h3 class="text-h5 font-weight-bold">
          Parce que vous avez aimé <span class="text-primary">{{ section.sourceTitle }}</span>
        </h3>
      </div>

      <v-row class="flex-nowrap overflow-x-auto pb-4 px-2">
        <v-col
          v-for="item in section.recommendations"
          :key="item.id"
          cols="6" sm="4" md="3" lg="2"
          class="flex-shrink-0"
        >
          <v-card
            class="rounded-lg overflow-hidden elevation-2 h-100 rec-card"
            @click="goToItem(item)"
          >
            <v-img
              :src="item.posterPath ? `https://image.tmdb.org/t/p/w300${item.posterPath}` : noPoster"
              height="220"
              cover
              class="bg-grey-lighten-2"
            ></v-img>
            <v-card-text class="pa-2">
              <p class="font-weight-bold mb-0 text-truncate text-body-2" :title="item.title">
                {{ item.title }}
              </p>
              <div class="d-flex align-center mt-1" v-if="item.voteAverage">
                <v-icon color="amber" size="small" class="mr-1">mdi-star</v-icon>
                <span class="text-caption font-weight-medium">
                  {{ Math.round(item.voteAverage * 10) / 10 }}
                </span>
              </div>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </div>
  </div>
</template>

<style scoped>
.rec-card {
  cursor: pointer;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}
.rec-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15) !important;
}
.overflow-x-auto {
  scrollbar-width: thin;
  scrollbar-color: #dbdbdb transparent;
}
</style>