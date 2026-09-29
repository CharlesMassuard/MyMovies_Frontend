<template>
  <v-container>
    <h1 class="text-h4 mb-4">{{ $t('legal.title') }}</h1>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">1. {{ $t('legal.legalInfo') }}</h2>
      <p><strong>{{ $t('legal.websiteName') }} :</strong> MyMovies</p>
      <p><strong>URL :</strong> mymovies.charlesmassuard.com</p>
      <p><strong>{{ $t('legal.owner') }} :</strong> Charles MASSUARD</p>
      <p><strong>{{ $t('legal.contact') }} :</strong> charles@charlesmassuard.com</p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">2. {{ $t('legal.hosting') }}</h2>
      <p>
        <!--Hébergement du Frontend(Vue3)-->
        <strong>{{ $t('legal.frontendHosting') }} :</strong><br />
        <strong>Netlify, Inc.</strong><br />
        2325 3rd Street, Suite 215<br />
        San Francisco, CA 94107, USA<br />
        <a href="https://www.netlify.com" target="_blank">www.netlify.com</a>
      </p>
      <p class="mt-4">
        <!--Hébergement du Backend(SpringBoot/PostgreSQL)-->
        <strong>{{ $t('legal.backendHosting') }} :</strong><br />
        {{ $t('legal.backendText') }}
        <!--Remplace cette phrase par l'adresse de ton hébergeur backend(ex:OracleCloud) si nécessaire-->
      </p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">3. {{ $t('legal.domain') }}</h2>
      <p>
        {{ $t('legal.domainText') }}<br />
        <strong>OVH SAS</strong><br />
        2 rue Kellermann<br />
        59100 Roubaix, France<br />
        <a href="https://www.ovhcloud.com" target="_blank">www.ovhcloud.com</a>
      </p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">4. {{ $t('legal.intellectual') }}</h2>
      <p>
        {{ $t('legal.intellectualText') }}
      </p>
      <p>
        <strong>{{ $t('legal.movieDatabase') }} :</strong><br />
        {{ $t('legal.tmdbText') }}
      </p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">5. {{ $t('legal.liability') }}</h2>
      <p>
        {{ $t('legal.liabilityText') }}
      </p>
    </section>
  </v-container>
</template>

<script setup>
//Pas de logique spécifique nécessaire ici
</script>

<style scoped>
/*Styles spécifiques*/
</style>
