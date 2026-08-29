<template>
  <v-container>
    <h1 class="text-h4 mb-4">Politique de Confidentialité</h1>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">1. Introduction</h2>
      <p>
        La présente Politique de Confidentialité décrit la manière dont MyMovies collecte, utilise et protège vos informations personnelles sur mymovies.charlesmassuard.com.
        Nous nous engageons à respecter le Règlement Général sur la Protection des Données (RGPD).
      </p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">2. Données que nous collectons</h2>
      <p>Nous collectons les données suivantes et les stockons dans notre base de données sécurisée (PostgreSQL) :</p>
      <ul>
        <li><strong>Données d'identification :</strong> Nom d'utilisateur, adresse e-mail, mot de passe (strictement chiffré et illisible).</li>
        <li><strong>Données relatives aux films :</strong> Vos favoris, vos notes, vos listes de visionnage personnalisées créées sur MyMovies.</li>
        <li><strong>Données techniques :</strong> Adresse IP, type de navigateur pour la sécurisation de l'API.</li>
      </ul>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">3. Services Tiers (TMDB)</h2>
      <p>
        MyMovies utilise l'API de <strong>The Movie Database (TMDB)</strong> pour afficher le catalogue de films.
        Lorsque vous utilisez la barre de recherche, vos requêtes liées aux films sont envoyées à TMDB. <strong>Aucune donnée personnelle (e-mail, mot de passe, nom) n'est partagée, vendue ou transmise à TMDB.</strong>
      </p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">4. Comment nous utilisons vos données</h2>
      <p>Nous utilisons les données collectées exclusivement pour :</p>
      <ul>
        <li>Gérer votre compte utilisateur (inscription, connexion).</li>
        <li>Sauvegarder et restituer vos préférences cinématographiques de manière persistante via notre API backend Spring Boot.</li>
        <li>Garantir la sécurité de vos sessions (ex: authentification par token).</li>
      </ul>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">5. Stockage et sécurité des données</h2>
      <p>
        Vos données sont stockées sur les serveurs de notre backend, géré par l'API MyMovies. Nous mettons en œuvre des mesures avancées (Spring Security, hachage des mots de passe) pour protéger vos données contre l'accès non autorisé. Les communications avec notre serveur se font via HTTPS.
      </p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">6. Cookies et Sessions</h2>
      <p>
        MyMovies n'utilise aucun cookie à des fins de publicité ou de traçage intrusif. Nous utilisons uniquement les technologies (comme les JWT ou cookies de session) strictement nécessaires pour vous maintenir connecté à votre compte.
      </p>
    </section>

    <section class="mb-6">
      <h2 class="text-h5 mb-2">7. Vos droits (RGPD)</h2>
      <p>Vous disposez des droits suivants concernant vos données personnelles :</p>
      <ul>
        <li><strong>Droit d'accès et portabilité :</strong> Demander une copie des données de votre compte.</li>
        <li><strong>Droit de rectification :</strong> Corriger toute information inexacte.</li>
        <li><strong>Droit à l'effacement :</strong> Demander la suppression totale et définitive de votre compte et de vos listes de films.</li>
      </ul>
      <p>Pour exercer ces droits, veuillez nous contacter à contact@charlesmassuard.com.</p>
    </section>

  </v-container>
</template>

<script setup>
//Aucune logique n'est requise pour le moment
</script>

<style scoped>
/*Styles spécifiques*/
</style>