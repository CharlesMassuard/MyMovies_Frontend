<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

const returnHome = () => {
  router.push('/');
};
</script>

<template>
  <v-container fluid class="error-page fill-height">
    <div class="blob blob-1"></div>
    <div class="blob blob-2"></div>

    <v-row align="center" justify="center" class="relative-content">
      <v-col cols="12" sm="8" md="6" class="text-center">
        
        <div class="glitch-wrapper mb-6">
          <h1 class="display-404">404</h1>
          <h1 class="display-404 shadow">404</h1>
        </div>

        <div class="glass-card pa-8 rounded-xl mb-8">
          <h2 class="text-h4 font-weight-black mb-4 gradient-text">
            Scène manquante au montage
          </h2>
          <p class="text-body-1 text-grey-lighten-1">
            Désolé, mais l'URL que vous tentez de visionner n'est pas disponible.
          </p>
        </div>

        <v-btn
          size="x-large"
          color="#8C52FF"
          rounded="xl"
          elevation="8"
          class="home-btn px-10"
          @click="returnHome"
        >
          <v-icon start>mdi-arrow-left</v-icon>
          Retour à l'accueil
        </v-btn>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.error-page {
  background-color: #0a0a0c;
  overflow: hidden;
  position: relative;
  min-height: 100vh;
}

.blob {
  position: absolute;
  width: 400px;
  height: 400px;
  background: #8C52FF;
  filter: blur(80px);
  border-radius: 50%;
  z-index: 0;
  opacity: 0.15;
  animation: float 10s infinite alternate;
}
.blob-1 { top: -100px; right: -100px; }
.blob-2 { bottom: -150px; left: -150px; animation-delay: -5s; }

.relative-content {
  position: relative;
  z-index: 1;
}

.glass-card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.05);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}

.display-404 {
  font-size: clamp(8rem, 15vw, 12rem);
  font-weight: 900;
  line-height: 1;
  color: white;
  position: relative;
  margin: 0;
}

.display-404.shadow {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  color: transparent;
  -webkit-text-stroke: 2px rgba(140, 82, 255, 0.3);
  z-index: -1;
  animation: pulse 3s infinite;
}

.gradient-text {
  background: linear-gradient(135deg, #ffffff 0%, #8C52FF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

@keyframes float {
  0% { transform: translate(0, 0) scale(1); }
  100% { transform: translate(50px, 100px) scale(1.2); }
}

@keyframes pulse {
  0% { transform: translateX(-50%) scale(1); opacity: 0.8; }
  50% { transform: translateX(-50%) scale(1.1); opacity: 0.2; }
  100% { transform: translateX(-50%) scale(1); opacity: 0.8; }
}

.home-btn {
  text-transform: none;
  font-weight: bold;
  letter-spacing: 0.5px;
  transition: all 0.3s ease;
}

.home-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 20px rgba(140, 82, 255, 0.4);
}
</style>