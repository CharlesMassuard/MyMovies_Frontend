<script setup>
// Legal notice page
</script>

<template>
  <v-container class="legal-container py-10 py-md-14">
    <!-- Hero Header -->
    <div class="legal-hero rounded-xl pa-6 pa-md-8 mb-8">
      <div class="legal-hero-glow"></div>
      <div class="position-relative">
        <div class="d-flex align-center ga-3 mb-2">
          <div class="hero-icon-box">
            <v-icon color="#8C52FF" size="26">mdi-scale-balance</v-icon>
          </div>
          <h1 class="text-h4 text-md-h3 font-weight-bold">{{ $t('legal.title') }}</h1>
        </div>
        <p class="text-body-2 opacity-70 mb-0">mymovies.charlesmassuard.com</p>
      </div>
    </div>

    <v-row>
      <!-- 1. Informations légales -->
      <v-col cols="12" md="6">
        <v-card class="legal-card rounded-xl pa-6 h-100" elevation="0">
          <div class="d-flex align-center ga-3 mb-4">
            <div class="section-badge">1</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('legal.legalInfo') }}</h2>
          </div>
          <div class="info-rows">
            <div class="info-row">
              <span class="info-lbl">{{ $t('legal.websiteName') }}</span>
              <span class="info-val">MyMovies</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">URL</span>
              <span class="info-val">mymovies.charlesmassuard.com</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">{{ $t('legal.owner') }}</span>
              <span class="info-val">Charles MASSUARD</span>
            </div>
            <div class="info-row">
              <span class="info-lbl">{{ $t('legal.contact') }}</span>
              <a href="mailto:charles@charlesmassuard.com" class="info-link">charles@charlesmassuard.com</a>
            </div>
          </div>
        </v-card>
      </v-col>

      <!-- 2. Nom de domaine -->
      <v-col cols="12" md="6">
        <v-card class="legal-card rounded-xl pa-6 h-100" elevation="0">
          <div class="d-flex align-center ga-3 mb-4">
            <div class="section-badge">2</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('legal.domain') }}</h2>
          </div>
          <p class="text-body-2 opacity-85 mb-4">{{ $t('legal.domainText') }}</p>
          <div class="provider-box rounded-lg pa-4">
            <div class="font-weight-bold mb-1">OVH SAS</div>
            <div class="text-body-2 opacity-75">2 rue Kellermann, 59100 Roubaix, France</div>
            <a href="https://www.ovhcloud.com" target="_blank" class="info-link text-body-2 mt-1 d-inline-block">
              www.ovhcloud.com
            </a>
          </div>
        </v-card>
      </v-col>

      <!-- 3. Hébergement -->
      <v-col cols="12">
        <v-card class="legal-card rounded-xl pa-6" elevation="0">
          <div class="d-flex align-center ga-3 mb-5">
            <div class="section-badge">3</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('legal.hosting') }}</h2>
          </div>
          <v-row>
            <v-col cols="12" md="6">
              <div class="provider-box rounded-lg pa-4 h-100">
                <div class="text-caption font-weight-bold text-uppercase opacity-60 mb-2">
                  {{ $t('legal.frontendHosting') }}
                </div>
                <div class="font-weight-bold mb-1">Netlify, Inc.</div>
                <div class="text-body-2 opacity-75">2325 3rd Street, Suite 215, San Francisco, CA 94107, USA</div>
                <a href="https://www.netlify.com" target="_blank" class="info-link text-body-2 mt-1 d-inline-block">
                  www.netlify.com
                </a>
              </div>
            </v-col>
            <v-col cols="12" md="6">
              <div class="provider-box rounded-lg pa-4 h-100">
                <div class="text-caption font-weight-bold text-uppercase opacity-60 mb-2">
                  {{ $t('legal.backendHosting') }}
                </div>
                <p class="text-body-2 opacity-85 mb-0">{{ $t('legal.backendText') }}</p>
              </div>
            </v-col>
          </v-row>
        </v-card>
      </v-col>

      <!-- 4. Propriété intellectuelle -->
      <v-col cols="12" md="6">
        <v-card class="legal-card rounded-xl pa-6 h-100" elevation="0">
          <div class="d-flex align-center ga-3 mb-4">
            <div class="section-badge">4</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('legal.intellectual') }}</h2>
          </div>
          <p class="text-body-2 opacity-85 mb-4" style="line-height: 1.7;">{{ $t('legal.intellectualText') }}</p>
          <div class="provider-box rounded-lg pa-4">
            <div class="font-weight-bold text-body-2 mb-1">{{ $t('legal.movieDatabase') }}</div>
            <p class="text-body-2 opacity-75 mb-0" style="line-height: 1.6;">{{ $t('legal.tmdbText') }}</p>
          </div>
        </v-card>
      </v-col>

      <!-- 5. Limites de responsabilité -->
      <v-col cols="12" md="6">
        <v-card class="legal-card rounded-xl pa-6 h-100" elevation="0">
          <div class="d-flex align-center ga-3 mb-4">
            <div class="section-badge">5</div>
            <h2 class="text-h6 font-weight-bold">{{ $t('legal.liability') }}</h2>
          </div>
          <p class="text-body-2 opacity-85 mb-0" style="line-height: 1.75;">{{ $t('legal.liabilityText') }}</p>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<style scoped>
.legal-container {
  max-width: 1120px;
}

.legal-hero {
  position: relative;
  overflow: hidden;
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .legal-hero {
  border-color: rgba(0, 0, 0, 0.08);
}

.legal-hero-glow {
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

.legal-card {
  background: var(--app-surface);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

:root[data-theme='light'] .legal-card {
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

.info-rows {
  display: flex;
  flex-direction: column;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 16px;
  padding: 11px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.06);
}

:root[data-theme='light'] .info-row {
  border-bottom-color: rgba(0, 0, 0, 0.06);
}

.info-row:last-child {
  border-bottom: none;
}

.info-lbl {
  font-size: 0.84rem;
  opacity: 0.6;
}

.info-val {
  font-size: 0.9rem;
  font-weight: 600;
  text-align: right;
}

.info-link {
  color: #a97dff;
  font-weight: 600;
  text-decoration: none;
}

.info-link:hover {
  text-decoration: underline;
}

.provider-box {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.07);
}

:root[data-theme='light'] .provider-box {
  background: rgba(0, 0, 0, 0.03);
  border-color: rgba(0, 0, 0, 0.07);
}
</style>
