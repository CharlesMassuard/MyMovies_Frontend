<template>
  <v-container>
    <h1 class="text-h4 mb-4">Mentions Légales</h1>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">1. Informations Légales</h2>
      <p><strong>Nom du site web :</strong> MyMovies</p>
      <p><strong>URL :</strong> mymovies.charlesmassuard.com</p>
      <p><strong>Propriétaire / Éditeur :</strong> Charles MASSUARD</p>
      <p><strong>Contact :</strong> contact@charlesmassuard.com</p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">2. Hébergement</h2>
      <p>
        <!--Hébergement du Frontend(Vue3)-->
        <strong>Hébergement de l'interface (Frontend) :</strong><br />
        <strong>Netlify, Inc.</strong><br />
        2325 3rd Street, Suite 215<br />
        San Francisco, CA 94107, USA<br />
        <a href="https://www.netlify.com" target="_blank">www.netlify.com</a>
      </p>
      <p class="mt-4">
        <!--Hébergement du Backend(SpringBoot/PostgreSQL)-->
        <strong>Hébergement de l'API et Base de données (Backend) :</strong><br />
        L'infrastructure backend (Spring Boot) et la base de données PostgreSQL sont hébergées de manière sécurisée par notre fournisseur de cloud.
        <!--Remplace cette phrase par l'adresse de ton hébergeur backend(ex:OracleCloud) si nécessaire-->
      </p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">3. Nom de domaine</h2>
      <p>
        Le nom de domaine "mymovies.charlesmassuard.com" est enregistré auprès de OVHcloud.<br />
        <strong>OVH SAS</strong><br />
        2 rue Kellermann<br />
        59100 Roubaix, France<br />
        <a href="https://www.ovhcloud.com" target="_blank">www.ovhcloud.com</a>
      </p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">4. Propriété intellectuelle et API Tierces</h2>
      <p>
        L'ensemble de ce site relève de la législation française et internationale sur le droit d'auteur et la propriété intellectuelle.
      </p>
      <p>
        <strong>Base de données de films :</strong><br />
        Ce produit utilise l'API TMDB (The Movie Database) pour récupérer les données, affiches et images relatives aux films. MyMovies n'est ni approuvé ni certifié par TMDB. Toutes les images, titres et informations sur les films appartiennent à leurs propriétaires respectifs et à TMDB.
      </p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">5. Limites de responsabilité</h2>
      <p>
        Charles MASSUARD s'efforce d'assurer au mieux de ses possibilités l'exactitude des informations. Toutefois, MyMovies dépend de l'API externe TMDB et ne peut garantir l'exactitude absolue ou l'exhaustivité des données cinématographiques affichées.
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