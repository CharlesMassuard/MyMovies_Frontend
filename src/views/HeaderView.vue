<template>
  <v-app-bar :elevation="0" v-if="$route.path !== '/login' && $route.path !== '/register'">
    <div class="header-section">
      <img src="../assets/LogoMyMoviesTxt.webp" alt="MyMovies Logo" class="logo"/>
    </div>

    <v-text-field 
      clearable 
      label="Rechercher" 
      density="compact" 
      variant="outlined" 
      rounded="xl" 
      class="search-bar custom-append"
      hide-details
      placeholder="Inception, Interstellar, Zootopie    , ..."
    >
      <template v-slot:append-inner>
        <v-btn color="#8C52FF" rounded="xl" variant="flat" class="search-btn">
          <v-icon icon="mdi-magnify" color="white"></v-icon>
        </v-btn>
      </template>
    </v-text-field>

    <div class="header-section">
      <v-btn 
        to="/login" 
        rounded="xl" 
        color="#8C52FF" 
        variant="flat"
        :icon="$vuetify.display.smAndDown"
      >
        <v-icon v-if="$vuetify.display.smAndDown">mdi-account</v-icon>
        <template v-else>
          <v-icon start>mdi-account</v-icon>
          Se Connecter
        </template>
      </v-btn>
    </div>
  </v-app-bar>
</template>

<style scoped>
    .v-toolbar {
        border-bottom: 1px solid #e0e0e0 !important;
        padding: 5px 15px !important;
    }

    .header-section {
        flex: 1;
        display: flex;
        align-items: center;
        min-width: fit-content;
    }

    .header-section:last-child {
        justify-content: flex-end;
    }

    .search-bar {
        max-width: 500px;
        flex: 2;
        margin: 0 15px;
        transition: all 0.3s ease;
    }

    .logo {
        height: 60px;
        transition: height 0.3s ease;
    }

    @media (max-width: 960px) {
        .logo {
            height: 45px;
        }
        .search-bar {
            margin: 0 10px;
        }
    }

    @media (max-width: 600px) {
        .logo {
            height: 35px;
        }
        .search-bar {
            margin: 0 5px;
        }
        .v-toolbar {
            padding: 5px 8px !important;
        }
    }

    .search-btn {
        height: 100% !important;
        min-width: 40px;
        border-radius: inherit;
    }

    .custom-append :deep(.v-field__append-inner) {
        padding-top: 0;
        align-items: center;
        margin-inline-start: 0;
    }

    .custom-append :deep(.v-field--variant-outlined) {
        padding-inline-end: 0;
    }
</style>