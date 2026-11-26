<template>
  <div class="media-skeleton-page">
    <!-- Full-Bleed Hero Skeleton -->
    <div class="hero-skeleton">
      <v-container class="hero-skeleton-container">
        <div class="hero-skeleton-inner">
          <div class="d-flex ga-2 mb-5">
            <v-skeleton-loader type="chip" width="68" class="bg-transparent" />
            <v-skeleton-loader type="chip" width="64" class="bg-transparent" />
            <v-skeleton-loader type="chip" width="110" class="bg-transparent" />
            <v-skeleton-loader type="chip" width="84" class="bg-transparent" />
          </div>

          <v-skeleton-loader type="heading" width="380" class="mb-4 bg-transparent" />
          <v-skeleton-loader type="text" width="320" class="mb-5 bg-transparent" />
          <v-skeleton-loader type="paragraph" width="540" class="mb-6 bg-transparent" />

          <div class="d-flex ga-3">
            <v-skeleton-loader type="button" width="190" height="46" class="rounded-lg bg-transparent" />
            <v-skeleton-loader type="button" width="150" height="46" class="rounded-lg bg-transparent" />
            <v-skeleton-loader type="button" width="110" height="46" class="rounded-lg bg-transparent" />
          </div>
        </div>
      </v-container>
    </div>

    <!-- Sticky Tabs Skeleton -->
    <div class="tabs-skeleton-bar">
      <v-container class="skeleton-content-container py-3 d-flex ga-6">
        <v-skeleton-loader v-for="n in 5" :key="n" type="text" width="80" class="bg-transparent" />
      </v-container>
    </div>

    <!-- 2-Column Overview Skeleton -->
    <v-container class="skeleton-content-container py-10">
      <v-row>
        <v-col cols="12" md="7" class="pr-md-10">
          <v-skeleton-loader type="heading" width="180" class="mb-4 bg-transparent" />
          <v-skeleton-loader type="text" width="260" class="mb-4 bg-transparent" />
          <v-skeleton-loader type="paragraph" class="mb-3 bg-transparent" />
          <v-skeleton-loader type="paragraph" class="bg-transparent" />
        </v-col>
        <v-col cols="12" md="5">
          <v-skeleton-loader v-for="r in 6" :key="r" type="text" class="mb-4 bg-transparent" />
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<style scoped>
.media-skeleton-page {
  min-height: 100vh;
  background: var(--app-background);
}

.hero-skeleton {
  width: 100%;
  min-height: 76vh;
  max-height: 820px;
  display: flex;
  align-items: flex-end;
  padding-top: 96px;
  padding-bottom: 48px;
  background: linear-gradient(135deg, rgba(140, 82, 255, 0.12) 0%, rgba(23, 25, 34, 0.9) 60%, var(--app-background) 100%);
}

.hero-skeleton-container,
.skeleton-content-container {
  max-width: 1360px;
}

.hero-skeleton-inner {
  max-width: 680px;
}

.tabs-skeleton-bar {
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .tabs-skeleton-bar {
  border-bottom-color: rgba(0, 0, 0, 0.08);
}
</style>
