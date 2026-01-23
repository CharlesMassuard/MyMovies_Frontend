# MyMovies

Ce site permet d'ajouter des films à sa liste de lecture et de les noter.

## 1. Fonctionnalités

### 1.1 La page d'accueil

La page d'accueil, accessible à tous, compore trois sections :

- Tendances du jour
- Populaires
- En salles *(Films sortis depuis 40 jours)*

Chaque section a un top, les films étant classés du plus populaire au moins populaire.

Lorsque l'utilisateur clique sur un film, la page du détail de ce dernier est affiché.

### 1.2 Détails du film

Cette page, également accessible pour tous les utilisateurs, affiche les détails les plus importants d'un film :

- Titre
- Date de sortie
- Genres
- Durée
- Poster & "backdrop"
- Score d'évaluation TMDB
- "Tagline"
- Synopsis
- Réalisateurs
- Têtes d'affiche

Un membre *(utilisateur connecté)* peut effectuer plusieurs actions :

- Ajouter le film à sa liste de lecture
- Modifier le status du film : A voir, En cours, Vu
- Supprimer le film de sa liste de lecture
- Noter le film
- Commenter le film

> Lorsque l'utilisateur note le film, le status de ce dernier est automatiquement passé à "Vu".

> Un film non sorti ne peut pas être noté, et le seul status disponible est "A voir"

### 1.3 Bibliothèque

Chaque membre a une bibliothèque. Dans cette dernière, tous les films ajoutés à sa bibliothèque sont affichées, avec le status correspondant pour chaque film. Lors du clic sur un film, ses détails sont affichés.

> Les films sont ici triés par ordre d'ajout à la bibliothèque

### 1.4 Profil

Un membre peut accéder à son profil. Sur ce dernier il obttient plusieurs informations :

- Son pseudo
- Son adresse meil
- Sa date d'inscription
- Sa date de dernière connexion

Il peut également changer son pseudo, changer son adresse mail et changer son mot de passe.

Dans la section "Paramètres", il peut supprimer son profil.

### 1.5 Barre de recherche

La barre de recherche permet de rechercher des films et d'accéder à leurs détails simplement et rapidement depuis n'importe quelle page de l'application.

## 2. Technologies

Le site est crée avec **Vue.js** et utilise le framework **Vuetify**, permettant d'avoir un visuel moderne et harmonieux au sein de toute l'application.

L'API utilisée est celle de **TMDB**. Elle permet de fournir toutes les informations des films.

## 3. Lancement du site

Pour lancer le site, effectuer la commande 
```shell
npm run dev
```
dans le repertoire courant.