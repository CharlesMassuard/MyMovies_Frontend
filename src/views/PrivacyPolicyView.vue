<template>
  <v-container>
    <h1 class="text-h4 mb-4">{{ $t('privacy.title') }}</h1>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">1. {{ $t('privacy.intro') }}</h2>
      <p>{{ $t('privacy.introText') }}</p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">2. {{ $t('privacy.collected') }}</h2>
      <p>{{ $t('privacy.collectedText') }}</p>
      <ul>
        <li><strong>{{ $t('privacy.identity') }} :</strong> {{ $t('privacy.identityText') }}</li>
        <li><strong>{{ $t('privacy.movieData') }} :</strong> {{ $t('privacy.movieDataText') }}</li>
        <li><strong>{{ $t('privacy.technical') }} :</strong> {{ $t('privacy.technicalText') }}</li>
      </ul>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">3. {{ $t('privacy.thirdParty') }}</h2>
      <p>{{ $t('privacy.thirdPartyText') }}</p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">4. {{ $t('privacy.usage') }}</h2>
      <p>{{ $t('privacy.usageIntro') }}</p>
      <ul>
        <li>{{ $t('privacy.usageAccount') }}</li>
        <li>{{ $t('privacy.usagePreferences') }}</li>
        <li>{{ $t('privacy.usageSecurity') }}</li>
      </ul>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">5. {{ $t('privacy.storage') }}</h2>
      <p>{{ $t('privacy.storageText') }}</p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">6. {{ $t('privacy.cookies') }}</h2>
      <p>{{ $t('privacy.cookiesText') }}</p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">7. {{ $t('privacy.rights') }}</h2>
      <p>{{ $t('privacy.rightsIntro') }}</p>
      <ul>
        <li><strong>{{ $t('privacy.access') }} :</strong> {{ $t('privacy.accessText') }}</li>
        <li><strong>{{ $t('privacy.correction') }} :</strong> {{ $t('privacy.correctionText') }}</li>
        <li><strong>{{ $t('privacy.deletion') }} :</strong> {{ $t('privacy.deletionText') }}</li>
      </ul>
      <p>{{ $t('privacy.contactText') }}</p>
    </section>

  </v-container>
</template>

<script setup>
//Aucune logique n'est requise pour le moment
</script>

<style scoped>
/*Styles spécifiques*/
</style>
