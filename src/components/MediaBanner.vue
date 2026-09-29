<script setup>
import noPoster from '../assets/noPosterAvailable.webp';
defineProps({
  backdropPath: String,
  posterPath: String,
  title: String
});
</script>

<template>
  <div class="banner-wrapper">
    <div 
      class="backdrop-image" 
      :style="backdropPath ? { backgroundImage: `url(https://image.tmdb.org/t/p/original${backdropPath})` } : {}"
    ></div>
    
    <v-container class="content-overlay py-10">
      <v-row align="center">
        <v-col cols="12" md="3" class="d-flex justify-center">
          <v-img
            :src="posterPath ? `https://image.tmdb.org/t/p/w500${posterPath}` : noPoster"
            :alt="title"
            class="poster-img elevation-10"
            cover
          ></v-img>
        </v-col>
        <v-col cols="12" md="9" class="text-white px-md-10">
          <slot></slot>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.banner-wrapper {
  position: relative;
  width: 100%;
  min-height: 510px;
  background-color: #032541;
  display: flex;
  align-items: center;
  overflow: hidden;
}
.backdrop-image {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: right 20% center;
  z-index: 0;
}
.backdrop-image::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-image: linear-gradient(to right, rgb(42, 24, 78) 150px, rgba(42, 24, 78, 0.84) 100%);
}
.content-overlay {
  position: relative;
  z-index: 1;
}
.poster-img {
  border-radius: 12px;
  width: 300px;
  height: 450px;
}
@media (max-width: 960px) {
  .backdrop-image::after {
    background-image: linear-gradient(to bottom, rgba(10, 20, 40, 0.9), rgba(10, 20, 40, 1));
  }
}
</style>