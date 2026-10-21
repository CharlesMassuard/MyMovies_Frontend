<script setup>
import { useRouter } from 'vue-router';
//on-reutilise-la-meme-image-de-fond-que-le-login
import bgImage from '../assets/cinema.webp';

const router = useRouter();

//fonction-pour-verifier-si-la-maintenance-est-terminee
const checkStatus = () => {
//le-router-beforeEach-mis-en-place-precedemment-fera-le-test
//si-la-variable-est-passee-a-false-on-sera-redirige-vers-l-accueil
    router.push('/');
};
</script>

<template>
  <!--fond-floute-identique-a-la-page-de-connexion-->
  <div class="page-background" :style="{ backgroundImage: `url(${bgImage})` }"></div>

  <v-container class="fill-height" fluid>
    <v-row align="center" justify="center">
      <v-col cols="12" sm="8" md="6" lg="5">
        
        <!--carte-centrale-avec-le-style-mymovies-->
        <v-card class="elevation-12 pa-8 pa-sm-10 text-center" rounded="xl" theme="dark">
          
          <!--icone-animee-->
          <v-icon
            icon="mdi-tools"
            color="#8C52FF"
            size="80"
            class="mb-6 maintenance-icon"
          ></v-icon>

          <h1 class="text-h4 text-sm-h3 font-weight-black mb-4">
            De retour très vite !
          </h1>

          <p class="text-body-1 mb-8 opacity-80" style="line-height: 1.6;">
            <b>MyMovies</b> est actuellement en cours de maintenance. 
            Nous mettons à jour notre infrastructure pour vous offrir une expérience encore plus fluide et de nouvelles fonctionnalités.
            <br><br>
            Merci de votre patience !
          </p>

          <!--bouton-de-rafraichissement-->
          <v-btn
            color="#8C52FF"
            size="x-large"
            class="font-weight-bold text-none hover-scale"
            rounded="lg"
            elevation="4"
            prepend-icon="mdi-refresh"
            @click="checkStatus"
          >
            Vérifier le statut
          </v-btn>

        </v-card>
        
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
/*reprise-exacte-du-fond-du-login*/
.page-background {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background-size: cover;
    background-position: center;
    filter: blur(6px) brightness(0.4);
    transform: scale(1.05);
    z-index: 0;
    pointer-events: none;
}

.v-container {
    position: relative;
    z-index: 1;
}

/*animation-douce-de-pulsation-sur-l-icone-pour-faire-patienter*/
@keyframes pulse {
    0% { transform: scale(1); opacity: 0.8; }
    50% { transform: scale(1.1); opacity: 1; }
    100% { transform: scale(1); opacity: 0.8; }
}

.maintenance-icon {
    animation: pulse 2.5s infinite ease-in-out;
}

/*effet-de-survol-du-bouton-comme-sur-le-mainview*/
.hover-scale {
    transition: transform 0.2s ease;
}
.hover-scale:hover {
    transform: scale(1.05);
}
</style>