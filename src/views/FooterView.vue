<template>
  <v-footer v-if="$route.path !== '/login' && $route.path !== '/register' && !$route.meta.hideFooter" class="mt-10 border-t" style="background-color: #F5F5F5;">
    <v-container>
      <v-row align="center" justify="space-between" class="py-8">
        <v-col cols="12" md="3" class="text-center text-md-left mb-6 mb-md-0">
          <img 
            src="../assets/LogoMyMoviesTxt.webp" 
            alt="MyMovies Logo" 
            style="max-width: 180px;"
          />
          <p class="text-caption text-grey-darken-1 mt-2">
            Votre source ultime pour découvrir, suivre et évaluer vos films préférés.
          </p>
        </v-col>

        <v-col cols="12" md="6" class="text-center mb-6 mb-md-0">
          <div class="d-flex flex-wrap justify-center ga-6 mb-4">
            <v-btn variant="text" size="small" to="/" class="text-none">Accueil</v-btn>
            <v-btn variant="text" size="small" to="/library" class="text-none">Ma Bibliothèque</v-btn>
            <v-btn variant="text" size="small" to="/profil" class="text-none">Mon Profil</v-btn>
          </div>
          <div class="d-flex flex-wrap justify-center ga-4">
            <v-btn variant="plain" size="x-small" to="/mentions-legales" class="text-none text-grey">Mentions légales</v-btn>
            <v-btn variant="plain" size="x-small" to="/confidentialite" class="text-none text-grey">Confidentialité</v-btn>
            <v-btn variant="plain" size="x-small" to="/contact" class="text-none text-grey">Contact</v-btn>
          </div>
        </v-col>

        <v-col cols="12" md="3" class="text-center text-md-right">
          <img 
            src="../assets/tmdbLogo.svg" 
            alt="MyMovies Logo" 
            style="max-width: 180px;"
          />
          <p class="text-caption text-grey-darken-1 mt-1" style="font-size: 0.7rem !important; line-height: 1.2;">
            This product uses the TMDB API but is not endorsed or certified by TMDB.
          </p>
        </v-col>
      </v-row>

      <v-divider></v-divider>

      <v-row no-gutters class="py-4">
        <v-col cols="12" class="text-center text-caption text-grey-darken-1">
          &copy; {{ new Date().getFullYear() }} — <strong>MyMovies</strong> — Tous droits réservés.
        </v-col>
      </v-row>
    </v-container>
  </v-footer>
</template>

<script setup>
</script>

<style scoped>
.v-footer {
  width: 100%;
}
</style>