<script setup>
// Privacy policy page
</script>

<template>
  <v-container class="privacy-container py-10 py-md-14">
    <!-- Hero Header -->
    <div class="privacy-hero rounded-xl pa-6 pa-md-8 mb-8">
      <div class="privacy-hero-glow"></div>
      <div class="position-relative">
        <div class="d-flex align-center ga-3 mb-2">
          <div class="hero-icon-box">
            <v-icon color="#8C52FF" size="26">mdi-shield-lock-outline</v-icon>
          </div>
          <h1 class="text-h4 text-md-h3 font-weight-bold">{{ $t('privacy.title') }}</h1>
        </div>
        <p class="text-body-2 opacity-75 mb-0" style="max-width: 760px; line-height: 1.65;">
          {{ $t('privacy.introText') }}
        </p>
      </div>
    </div>

    <v-row>
      <!-- Données collectées -->
      <v-col cols="12" md="6">
        <v-card class="privacy-card rounded-xl pa-6 h-100" elevation="0">
          <div class="d-flex align-center ga-3 mb-4">
            <div class="section-badge">1</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('privacy.collected') }}</h2>
          </div>
          <p class="text-body-2 opacity-80 mb-4">{{ $t('privacy.collectedText') }}</p>
          <div class="d-flex flex-column ga-3">
            <div class="item-box rounded-lg pa-3">
              <div class="font-weight-bold text-body-2 mb-1">{{ $t('privacy.identity') }}</div>
              <div class="text-caption opacity-75">{{ $t('privacy.identityText') }}</div>
            </div>
            <div class="item-box rounded-lg pa-3">
              <div class="font-weight-bold text-body-2 mb-1">{{ $t('privacy.movieData') }}</div>
              <div class="text-caption opacity-75">{{ $t('privacy.movieDataText') }}</div>
            </div>
            <div class="item-box rounded-lg pa-3">
              <div class="font-weight-bold text-body-2 mb-1">{{ $t('privacy.technical') }}</div>
              <div class="text-caption opacity-75">{{ $t('privacy.technicalText') }}</div>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- Utilisation & Services tiers -->
      <v-col cols="12" md="6" class="d-flex flex-column ga-6">
        <v-card class="privacy-card rounded-xl pa-6" elevation="0">
          <div class="d-flex align-center ga-3 mb-4">
            <div class="section-badge">2</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('privacy.usage') }}</h2>
          </div>
          <p class="text-body-2 opacity-80 mb-3">{{ $t('privacy.usageIntro') }}</p>
          <ul class="clean-list text-body-2 opacity-85">
            <li>{{ $t('privacy.usageAccount') }}</li>
            <li>{{ $t('privacy.usagePreferences') }}</li>
            <li>{{ $t('privacy.usageSecurity') }}</li>
          </ul>
        </v-card>

        <v-card class="privacy-card rounded-xl pa-6" elevation="0">
          <div class="d-flex align-center ga-3 mb-4">
            <div class="section-badge">3</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('privacy.thirdParty') }}</h2>
          </div>
          <p class="text-body-2 opacity-85 mb-0" style="line-height: 1.7;">{{ $t('privacy.thirdPartyText') }}</p>
        </v-card>
      </v-col>

      <!-- Stockage & Sécurité -->
      <v-col cols="12" md="6">
        <v-card class="privacy-card rounded-xl pa-6 h-100" elevation="0">
          <div class="d-flex align-center ga-3 mb-4">
            <div class="section-badge">4</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('privacy.storage') }}</h2>
          </div>
          <p class="text-body-2 opacity-85 mb-0" style="line-height: 1.7;">{{ $t('privacy.storageText') }}</p>
        </v-card>
      </v-col>

      <!-- Cookies & Sessions -->
      <v-col cols="12" md="6">
        <v-card class="privacy-card rounded-xl pa-6 h-100" elevation="0">
          <div class="d-flex align-center ga-3 mb-4">
            <div class="section-badge">5</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('privacy.cookies') }}</h2>
          </div>
          <p class="text-body-2 opacity-85 mb-0" style="line-height: 1.7;">{{ $t('privacy.cookiesText') }}</p>
        </v-card>
      </v-col>

      <!-- Droits RGPD -->
      <v-col cols="12">
        <v-card class="privacy-card rounded-xl pa-6" elevation="0">
          <div class="d-flex align-center ga-3 mb-4">
            <div class="section-badge">6</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('privacy.rights') }}</h2>
          </div>
          <p class="text-body-2 opacity-80 mb-4">{{ $t('privacy.rightsIntro') }}</p>
          <v-row class="mb-4">
            <v-col cols="12" md="4">
              <div class="item-box rounded-lg pa-4 h-100">
                <div class="font-weight-bold text-body-2 mb-1">{{ $t('privacy.access') }}</div>
                <div class="text-caption opacity-75">{{ $t('privacy.accessText') }}</div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="item-box rounded-lg pa-4 h-100">
                <div class="font-weight-bold text-body-2 mb-1">{{ $t('privacy.correction') }}</div>
                <div class="text-caption opacity-75">{{ $t('privacy.correctionText') }}</div>
              </div>
            </v-col>
            <v-col cols="12" md="4">
              <div class="item-box rounded-lg pa-4 h-100">
                <div class="font-weight-bold text-body-2 mb-1">{{ $t('privacy.deletion') }}</div>
                <div class="text-caption opacity-75">{{ $t('privacy.deletionText') }}</div>
              </div>
            </v-col>
          </v-row>
          <p class="text-body-2 opacity-85 mb-0">{{ $t('privacy.contactText') }}</p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.privacy-container {
  max-width: 1120px;
}

.privacy-hero {
  position: relative;
  overflow: hidden;
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .privacy-hero {
  border-color: rgba(0, 0, 0, 0.08);
}

.privacy-hero-glow {
  position: absolute;
  top: -70px;
  right: -50px;
  width: 280px;
  height: 280px;
  background: radial-gradient(circle, rgba(140, 82, 255, 0.22) 0%, transparent 70%);
  pointer-events: none;
}

.hero-icon-box {
  width: 46px;
  height: 46px;
  border-radius: 12px;
  background: rgba(140, 82, 255, 0.14);
  display: flex;
  align-items: center;
  justify-content: center;
}

.privacy-card {
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .privacy-card {
  border-color: rgba(0, 0, 0, 0.08);
}

.section-badge {
  width: 30px;
  height: 30px;
  border-radius: 9px;
  background: rgba(140, 82, 255, 0.16);
  color: #b794ff;
  font-size: 0.85rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

:root[data-theme='light'] .section-badge {
  color: #6b21a8;
}

.item-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

:root[data-theme='light'] .item-box {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.07);
}

.clean-list {
  padding-left: 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  line-height: 1.6;
}
</style>
