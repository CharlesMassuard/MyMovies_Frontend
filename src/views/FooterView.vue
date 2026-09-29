<template>
  <v-footer v-if="$route.path !== '/login' && $route.path !== '/register' && !$route.meta.hideFooter" class="mt-10 border-t" style="background-color: #F5F5F5;">
    <v-container>
      <v-row align="center" justify="space-between" class="py-8">
        <v-col cols="12" md="3" class="text-center text-md-left mb-6 mb-md-0">
          <img 
            src="../assets/logoMyMoviesTxt.webp" 
            :alt="$t('footer.home')"
            style="max-width: 180px;"
          />
          <p class="text-caption text-grey-darken-1 mt-2">
            {{ $t('footer.tagline') }}
          </p>
        </v-col>

        <v-col cols="12" md="6" class="text-center mb-6 mb-md-0">
          <div class="d-flex flex-wrap justify-center ga-6 mb-4">
            <v-btn variant="text" size="small" to="/" class="text-none">{{ $t('footer.home') }}</v-btn>
            <v-btn variant="text" size="small" to="/library" class="text-none">{{ $t('footer.library') }}</v-btn>
            <v-btn variant="text" size="small" to="/profil" class="text-none">{{ $t('footer.profile') }}</v-btn>
          </div>
          <div class="d-flex flex-wrap justify-center ga-4">
            <v-btn variant="plain" size="x-small" to="/mentions-legales" class="text-none text-grey">{{ $t('footer.legal') }}</v-btn>
            <v-btn variant="plain" size="x-small" to="/confidentialite" class="text-none text-grey">{{ $t('footer.privacy') }}</v-btn>
          </div>
        </v-col>

        <v-col cols="12" md="3" class="text-center text-md-right">
          <img 
            src="../assets/tmdbLogo.svg" 
            alt="TMDB"
            style="max-width: 180px;"
          />
          <p class="text-caption text-grey-darken-1 mt-1" style="font-size: 0.7rem !important; line-height: 1.2;">
            {{ $t('footer.tmdbNotice') }}
          </p>
        </v-col>
      </v-row>

      <v-divider></v-divider>

      <v-row no-gutters class="py-4">
        <v-col cols="12" class="text-center text-caption text-grey-darken-1">
          &copy; {{ new Date().getFullYear() }} — <strong>MyMovies</strong> — {{ $t('footer.rights') }}
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
