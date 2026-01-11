<template>
  <v-app>
      <v-main>
        <header v-if="!['/login', '/register'].includes($route.path)">
          <div class="header-section">
            <img src="./assets/LogoMyMoviesTxt.webp" alt="MyMovies Logo" class="logo"/>
          </div>

          <v-text-field 
            clearable 
            label="Rechercher un film" 
            density="compact" 
            placeholder="Inception, Interstellar, ..." 
            variant="outlined" 
            rounded="xl" 
            class="search-bar custom-append"
            hide-details
          >
              <template v-slot:append-inner>
                  <v-btn color="#8C52FF" rounded="xl" variant="flat" class="search-btn">
                      <v-icon icon="mdi-magnify" color="white" size="large"></v-icon>
                  </v-btn>
              </template>
          </v-text-field>

          <div class="header-section">
            <v-btn prepend-icon="mdi-account" text="white" to="/login" rounded="xl" color="#8C52FF" variant="flat">
              Charles Massuard
            </v-btn>
          </div>
        </header>
        <router-view />
      </v-main>
  </v-app>
</template>

<style scoped>
    header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 20px;
      position: absolute;
      width: 100%;
      top: 0;
      z-index: 10;
      border-bottom: 0.7px solid #ccc;
    }

    .header-section {
      flex: 1;
      display: flex;
    }

    .header-section:last-child {
      justify-content: flex-end;
    }

    .search-bar {
      max-width: 500px;
      flex: 1;
      margin: 0 20px;
    }

    .search-btn {
      height: 100% !important;
      min-width: 50px;
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

    .logo {
      height: 60px;
    }
</style>