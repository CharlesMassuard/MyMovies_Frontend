<template>
  <div>
    <div class="banner-wrapper bg-grey-darken-4">
      <v-container class="py-10">
        <v-row align="center">
          <v-col cols="12" md="3" class="d-flex justify-center">
            <v-skeleton-loader type="image" width="300" height="450" class="rounded-lg"></v-skeleton-loader>
          </v-col>
          <v-col cols="12" md="9" class="px-md-10">
            <v-skeleton-loader type="heading" width="300" class="mb-4 bg-transparent"></v-skeleton-loader>
            <v-skeleton-loader type="text" width="200" class="mb-6 bg-transparent"></v-skeleton-loader>
            <v-skeleton-loader type="list-item-avatar-two-line" width="300" class="mb-4 bg-transparent"></v-skeleton-loader>
            <v-skeleton-loader type="paragraph" class="mt-6 bg-transparent"></v-skeleton-loader>
          </v-col>
        </v-row>
      </v-container>
    </div>
    
    <v-container class="mt-10 mb-6">
      <v-skeleton-loader type="heading" width="200" class="mb-6"></v-skeleton-loader>
      <v-row class="flex-nowrap overflow-hidden pb-4">
        <v-col v-for="n in 6" :key="n" cols="6" sm="4" md="2">
          <v-skeleton-loader type="card" height="250" class="rounded-lg"></v-skeleton-loader>
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
  display: flex;
  align-items: center;
  overflow: hidden;
}
</style>