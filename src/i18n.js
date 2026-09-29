import { createI18n } from 'vue-i18n'

const supportedLocales = ['fr', 'en']

const browserLocale = () => {
  const language = navigator.language?.toLowerCase() || 'fr'
  return language.startsWith('fr') ? 'fr' : 'en'
}

const getStoredPreference = () => localStorage.getItem('mymovies-language') || 'auto'

const resolveLocale = (preference = getStoredPreference()) => {
  if (preference === 'fr' || preference === 'en') return preference
  return browserLocale()
}

const messages = {
  fr: {
    language: { auto: 'Automatique', french: 'Français', english: 'Anglais', label: 'Langue' },
    common: {
      cancel: 'Annuler', confirm: 'Confirmer', validate: 'Valider', delete: 'Supprimer',
      close: 'Fermer', loading: 'Chargement...', error: 'Une erreur est survenue',
      retry: 'Réessayer', movie: 'Film', series: 'Série', movies: 'Films', seriesPlural: 'Séries',
      rating: 'Note', notRated: 'Non noté', unknownDate: 'Date inconnue', noDescription: 'Aucune description disponible',
      noResults: 'Aucun résultat', noData: 'Aucune donnée disponible', watch: 'À voir', watching: 'En cours', watched: 'Vu',
      details: 'Détails', synopsis: 'Synopsis', officialWebsite: 'Site officiel', streaming: 'Disponible en streaming :', durationUnknown: 'Durée inconnue', budget: 'Budget', revenue: 'Revenus', today: 'Aujourd’hui', yearsOld: 'ans', upcomingShort: 'À venir', readMore: 'Lire la suite', readLess: 'Moins', asCharacter: 'en tant que',
      explore: 'Explorer le catalogue', score: 'Score d’évaluation', tmdb: 'TMDB'
    },
    header: {
      search: 'Rechercher', searchPlaceholder: 'Inception, Stranger Things, Interstellar, ...',
      profile: 'Mon Profil', library: 'Ma Bibliothèque', logout: 'Déconnexion', login: 'Se connecter',
      logoutQuestion: 'Êtes-vous sûr de vouloir vous déconnecter ?', typeMovie: 'Film', typeSeries: 'Série'
    },
    footer: {
      tagline: 'Votre source ultime pour découvrir, suivre et évaluer vos films préférés.',
      home: 'Accueil', library: 'Ma Bibliothèque', profile: 'Mon Profil', legal: 'Mentions légales', privacy: 'Confidentialité',
      tmdbNotice: 'Ce produit utilise l’API TMDB mais n’est ni approuvé ni certifié par TMDB.', rights: 'Tous droits réservés.'
    },
    auth: {
      login: 'Connexion', register: 'Inscription', username: 'Nom d’utilisateur', email: 'Email', password: 'Mot de passe',
      submitLogin: 'Se connecter', submitRegister: 'S’inscrire', switchToRegister: 'Pas de compte ? Créer un compte',
      switchToLogin: 'Déjà un compte ? Se connecter', authError: 'Erreur d’authentification', emailRequired: 'Email requis',
      emailInvalid: 'L’email doit être valide', passwordRequired: 'Mot de passe requis', passwordLength: 'Le mot de passe doit contenir au moins 6 caractères',
      emailAndPasswordRequired: 'L’email et le mot de passe sont requis.', usernameRequired: 'Le nom d’utilisateur est requis pour l’inscription.', mustLogin: 'Vous devez être connecté pour effectuer cette action.',
      invalidEmail: 'L’adresse email n’est pas valide.', generic: 'Une erreur est survenue. Veuillez réessayer plus tard.'
    },
    home: {
      featured: 'À la une', recommended: 'Recommandé pour vous', general: 'Général', trending: 'Tendances du jour', popular: 'Populaires', theaters: 'En salles', followUp: 'Votre suivi',
      releasedRecently: 'Films sortis depuis 40 jours', added: 'Ajouter à ma liste', details: 'Détails',
      watched: 'Vu', watching: 'En cours', toWatch: 'À voir', film: 'Film'
    },
    library: {
      title: 'Ma Bibliothèque', all: 'Général', movies: 'Films', series: 'Séries', allStatus: 'Tous',
      dateWatched: 'Date de visionnage', recentActivity: 'Activité récente', dateAdded: 'Date d’ajout',
      ratingDesc: 'Note (décroissante)', ratingAsc: 'Note (croissante)', alphabetical: 'Alphabétique (A-Z)',
      longAgo: 'Il y a longtemps', emptyTitle: 'Aucun résultat', emptyDescription: 'Modifiez vos filtres ou ajoutez de nouvelles œuvres à votre bibliothèque.'
    },
    media: {
      trailer: 'Bande-annonce', rateMovie: 'Noter ce film', rateSeries: 'Noter cette série', yourRating: 'Votre note',
      add: 'Ajouter à ma liste', remove: 'Retirer de ma liste', released: 'Sorti', upcoming: 'À venir',
      showOn: 'Diffusé sur :', creators: 'Créateurs', creator: 'Créateur', seasons: 'saison', seasonsPlural: 'saisons',
      episodes: 'épisodes', episodeShort: 'ép.', watchedOn: 'Vu le', finishedOn: 'Terminée le', finishedLongAgo: 'Terminée il y a longtemps',
      deleteMovie: 'Supprimer le film de votre liste', deleteSeries: 'Supprimer la série', deleteQuestionMovie: 'Êtes-vous sûr de vouloir supprimer ce film ?',
      deleteQuestionSeries: 'Êtes-vous sûr de vouloir supprimer cette série ?', deleteAccount: 'Supprimer mon compte',
      deleteAccountQuestion: 'Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.',
      reviewMovie: 'Votre avis sur le film...', reviewSeries: 'Votre avis sur la série...', defaultReview: 'Écrivez ce que vous voulez retenir...', commentLength: 'Le commentaire ne doit pas dépasser 500 caractères.', authRateMovie: 'Connectez-vous pour noter ce film.',
      authRateSeries: 'Connectez-vous pour noter cette série.', nextEpisode: 'Prochain épisode à venir', lastEpisode: 'Dernier épisode diffusé',
      broadcast: 'Diffusion', cast: 'Têtes d’affiche', similar: 'Les spectateurs ont aussi aimé', knownFor: 'Connu(e) pour', filmography: 'Filmographie', changeDate: 'Changer la date', deleteFromList: 'Supprimer de la liste', watchedLongAgo: 'Vu il y a longtemps', sessionExpired: 'Votre session a expiré. Veuillez vous reconnecter.', production: 'En production', returningSeries: 'En cours de production', ended: 'Terminée', canceled: 'Annulée'
    },
    profile: {
      profile: 'Profil', settings: 'Paramètres', memberSince: 'Membre depuis le', lastLogin: 'Dernière connexion le',
      changeUsername: 'Changer le pseudo', changeEmail: 'Changer l’adresse mail', changePassword: 'Changer le mot de passe',
      deleteAccount: 'Supprimer le compte', editUsername: 'Modifier le pseudo', editEmail: 'Modifier l’email', editPassword: 'Modifier le mot de passe',
      newUsername: 'Nouveau pseudo', newEmail: 'Nouvel email', oldPassword: 'Ancien mot de passe', newPassword: 'Nouveau mot de passe',
      confirmPassword: 'Confirmer le nouveau mot de passe', enterUsername: 'Veuillez entrer un pseudo.', enterEmail: 'Veuillez entrer une adresse email.',
      emailUpdated: 'Email mis à jour avec succès !', passwordUpdated: 'Mot de passe modifié avec succès !', fillAll: 'Veuillez remplir tous les champs.',
      passwordsMismatch: 'Les nouveaux mots de passe ne correspondent pas.', newPasswordLength: 'Le nouveau mot de passe doit contenir au moins 6 caractères.',
      updateError: 'Une erreur est survenue lors de la mise à jour.', currentPasswordError: 'L’ancien mot de passe est incorrect.',
      changePasswordError: 'Erreur lors du changement de mot de passe.', languageHelp: 'Choisissez la langue de l’application. En mode automatique, celle de votre appareil est utilisée.'
    },
    episodes: { seasons: 'Saisons', seasonFinale: 'Final de saison', seasonPremiere: 'Début de saison', midSeason: 'Mi-saison', seriesFinale: 'Final de la série', pilot: 'Pilote', noOverview: 'Aucun résumé disponible pour cet épisode.' },
    recommendations: { because: 'Parce que vous avez aimé' },
    person: {
      personalInfo: 'Infos personnelles', job: 'Métier', gender: 'Sexe', birth: 'Naissance', death: 'Décès', birthPlace: 'Lieu de naissance',
      noBiography: 'Aucune biographie n’est disponible pour le moment.', female: 'Femme', male: 'Homme', nonBinary: 'Non-binaire', unspecified: 'Non spécifié'
    },
    legal: {
      title: 'Mentions légales', legalInfo: 'Informations légales', websiteName: 'Nom du site web', owner: 'Propriétaire / Éditeur', contact: 'Contact',
      hosting: 'Hébergement', frontendHosting: 'Hébergement de l’interface (Frontend)', backendHosting: 'Hébergement de l’API et de la base de données (Backend)',
      backendText: 'L’infrastructure backend (Spring Boot) et la base de données PostgreSQL sont hébergées de manière sécurisée par notre fournisseur de cloud.',
      domain: 'Nom de domaine', domainText: 'Le nom de domaine "mymovies.charlesmassuard.com" est enregistré auprès d’OVHcloud.', intellectual: 'Propriété intellectuelle et API tierces', movieDatabase: 'Base de données de films',
      intellectualText: 'L’ensemble de ce site relève de la législation française et internationale sur le droit d’auteur et la propriété intellectuelle.',
      tmdbText: 'Ce produit utilise l’API TMDB (The Movie Database) pour récupérer les données, affiches et images relatives aux films. MyMovies n’est ni approuvé ni certifié par TMDB. Toutes les images, titres et informations sur les films appartiennent à leurs propriétaires respectifs et à TMDB.',
      liability: 'Limites de responsabilité', liabilityText: 'Charles MASSUARD s’efforce d’assurer au mieux de ses possibilités l’exactitude des informations. Toutefois, MyMovies dépend de l’API externe TMDB et ne peut garantir l’exactitude absolue ou l’exhaustivité des données cinématographiques affichées.'
    },
    privacy: {
      title: 'Politique de confidentialité', intro: 'Introduction', introText: 'La présente Politique de Confidentialité décrit la manière dont MyMovies collecte, utilise et protège vos informations personnelles sur mymovies.charlesmassuard.com. Nous nous engageons à respecter le Règlement Général sur la Protection des Données (RGPD).',
      collected: 'Données que nous collectons', collectedText: 'Nous collectons les données suivantes et les stockons dans notre base de données sécurisée (PostgreSQL) :', identity: 'Données d’identification', identityText: 'Nom d’utilisateur, adresse e-mail, mot de passe (strictement chiffré et illisible).', movieData: 'Données relatives aux films', movieDataText: 'Vos favoris, vos notes, vos listes de visionnage personnalisées créées sur MyMovies.', technical: 'Données techniques', technicalText: 'Adresse IP, type de navigateur pour la sécurisation de l’API.',
      thirdParty: 'Services tiers (TMDB)', thirdPartyText: 'MyMovies utilise l’API de The Movie Database (TMDB) pour afficher le catalogue de films. Lorsque vous utilisez la barre de recherche, vos requêtes liées aux films sont envoyées à TMDB. Aucune donnée personnelle (e-mail, mot de passe, nom) n’est partagée, vendue ou transmise à TMDB.',
      usage: 'Comment nous utilisons vos données', usageIntro: 'Nous utilisons les données collectées exclusivement pour :', usageAccount: 'Gérer votre compte utilisateur (inscription, connexion).', usagePreferences: 'Sauvegarder et restituer vos préférences cinématographiques de manière persistante via notre API backend Spring Boot.', usageSecurity: 'Garantir la sécurité de vos sessions (ex : authentification par token).',
      storage: 'Stockage et sécurité des données', storageText: 'Vos données sont stockées sur les serveurs de notre backend, géré par l’API MyMovies. Nous mettons en œuvre des mesures avancées (Spring Security, hachage des mots de passe) pour protéger vos données contre l’accès non autorisé. Les communications avec notre serveur se font via HTTPS.', cookies: 'Cookies et sessions', cookiesText: 'MyMovies n’utilise aucun cookie à des fins de publicité ou de traçage intrusif. Nous utilisons uniquement les technologies (comme les JWT ou cookies de session) strictement nécessaires pour vous maintenir connecté à votre compte.', rights: 'Vos droits (RGPD)', rightsIntro: 'Vous disposez des droits suivants concernant vos données personnelles :', access: 'Droit d’accès et portabilité', accessText: 'Demander une copie des données de votre compte.', correction: 'Droit de rectification', correctionText: 'Corriger toute information inexacte.', deletion: 'Droit à l’effacement', deletionText: 'Demander la suppression totale et définitive de votre compte et de vos listes de films.', contactText: 'Pour exercer ces droits, veuillez nous contacter à charles@charlesmassuard.com.'
    },
    notFound: { title: 'Page introuvable', text: 'La page que vous recherchez n’existe pas.', home: 'Retour à l’accueil' },
    errors: { generic: 'Une erreur est survenue', load: 'Impossible de charger les données.' }
  },
  en: {
    language: { auto: 'Automatic', french: 'French', english: 'English', label: 'Language' },
    common: {
      cancel: 'Cancel', confirm: 'Confirm', validate: 'Save', delete: 'Delete', close: 'Close', loading: 'Loading...', error: 'An error occurred', retry: 'Retry',
      movie: 'Movie', series: 'Series', movies: 'Movies', seriesPlural: 'Series', rating: 'Rating', notRated: 'Not rated', unknownDate: 'Unknown date', noDescription: 'No description available', noResults: 'No results', noData: 'No data available', watch: 'To watch', watching: 'Watching', watched: 'Watched', details: 'Details', synopsis: 'Synopsis', officialWebsite: 'Official website', streaming: 'Available to stream:', durationUnknown: 'Unknown duration', budget: 'Budget', revenue: 'Revenue', today: 'Today', yearsOld: 'years old', upcomingShort: 'Coming soon', readMore: 'Read more', readLess: 'Show less', asCharacter: 'as', score: 'Rating score', tmdb: 'TMDB', explore: 'Explore the catalog'
    },
    header: { search: 'Search', searchPlaceholder: 'Inception, Stranger Things, Interstellar, ...', profile: 'My Profile', library: 'My Library', logout: 'Log out', login: 'Log in', logoutQuestion: 'Are you sure you want to log out?', typeMovie: 'Movie', typeSeries: 'Series' },
    footer: { tagline: 'Your ultimate source for discovering, tracking and rating your favorite movies.', home: 'Home', library: 'My Library', profile: 'My Profile', legal: 'Legal notice', privacy: 'Privacy', tmdbNotice: 'This product uses the TMDB API but is not endorsed or certified by TMDB.', rights: 'All rights reserved.' },
    auth: { login: 'Log in', register: 'Sign up', username: 'Username', email: 'Email', password: 'Password', submitLogin: 'Log in', submitRegister: 'Sign up', switchToRegister: 'No account? Create one', switchToLogin: 'Already have an account? Log in', authError: 'Authentication error', mustLogin: 'You must be logged in to perform this action.', emailRequired: 'Email is required', emailInvalid: 'Email must be valid', passwordRequired: 'Password is required', passwordLength: 'Password must contain at least 6 characters', emailAndPasswordRequired: 'Email and password are required.', usernameRequired: 'Username is required to sign up.', invalidEmail: 'Email address is not valid.', commentLength: 'Comments cannot exceed 500 characters.', generic: 'An error occurred. Please try again later.' },
    home: { featured: 'Featured', recommended: 'Recommended for you', general: 'General', trending: 'Trending today', popular: 'Popular', theaters: 'In theaters', followUp: 'Your watchlist', releasedRecently: 'Movies released in the last 40 days', added: 'Add to my list', details: 'Details', watched: 'Watched', watching: 'Watching', toWatch: 'To watch', film: 'Movie' },
    library: { title: 'My Library', all: 'General', movies: 'Movies', series: 'Series', allStatus: 'All', dateWatched: 'Watch date', recentActivity: 'Recent activity', dateAdded: 'Date added', ratingDesc: 'Rating (descending)', ratingAsc: 'Rating (ascending)', alphabetical: 'Alphabetical (A-Z)', longAgo: 'A long time ago', emptyTitle: 'No results', emptyDescription: 'Change your filters or add new titles to your library.' },
    episodes: { seasons: 'Seasons', seasonFinale: 'Season finale', seasonPremiere: 'Season premiere', midSeason: 'Mid-season', seriesFinale: 'Series finale', pilot: 'Pilot', noOverview: 'No summary available for this episode.' },
    recommendations: { because: 'Because you liked' },
    media: { trailer: 'Trailer', rateMovie: 'Rate this movie', rateSeries: 'Rate this series', yourRating: 'Your rating', add: 'Add to my list', remove: 'Remove from my list', released: 'Released', upcoming: 'Coming soon', showOn: 'Available on:', creators: 'Creators', creator: 'Creator', seasons: 'season', seasonsPlural: 'seasons', episodes: 'episodes', episodeShort: 'ep.', watchedOn: 'Watched on', finishedOn: 'Finished on', finishedLongAgo: 'Finished a long time ago', deleteMovie: 'Remove movie from your list', deleteSeries: 'Remove series from your list', deleteQuestionMovie: 'Are you sure you want to remove this movie?', deleteQuestionSeries: 'Are you sure you want to remove this series?', deleteAccount: 'Delete my account', deleteAccountQuestion: 'Are you sure you want to delete your account? This action cannot be undone.', reviewMovie: 'Your review of the movie...', reviewSeries: 'Your review of the series...', defaultReview: 'Write what you want to remember...', commentLength: 'Comments cannot exceed 500 characters.', authRateMovie: 'Log in to rate this movie.', authRateSeries: 'Log in to rate this series.', nextEpisode: 'Next episode', lastEpisode: 'Last episode aired', broadcast: 'Broadcast', cast: 'Top cast', similar: 'Viewers also liked', knownFor: 'Known for', filmography: 'Filmography', changeDate: 'Change date', deleteFromList: 'Remove from list', watchedLongAgo: 'Watched a long time ago', sessionExpired: 'Your session has expired. Please log in again.', production: 'In production', returningSeries: 'Returning series', ended: 'Ended', canceled: 'Canceled' },
    profile: { profile: 'Profile', settings: 'Settings', memberSince: 'Member since', lastLogin: 'Last login on', changeUsername: 'Change username', changeEmail: 'Change email address', changePassword: 'Change password', deleteAccount: 'Delete account', editUsername: 'Edit username', editEmail: 'Edit email', editPassword: 'Edit password', newUsername: 'New username', newEmail: 'New email', oldPassword: 'Current password', newPassword: 'New password', confirmPassword: 'Confirm new password', enterUsername: 'Please enter a username.', enterEmail: 'Please enter an email address.', emailUpdated: 'Email updated successfully!', passwordUpdated: 'Password changed successfully!', fillAll: 'Please fill in all fields.', passwordsMismatch: 'The new passwords do not match.', newPasswordLength: 'The new password must contain at least 6 characters.', updateError: 'An error occurred while updating.', currentPasswordError: 'The current password is incorrect.', changePasswordError: 'Error while changing the password.', languageHelp: 'Choose the application language. Automatic uses your device language.' },
    person: { personalInfo: 'Personal information', job: 'Occupation', gender: 'Gender', birth: 'Birth', death: 'Death', birthPlace: 'Place of birth', noBiography: 'No biography is available at the moment.', female: 'Female', male: 'Male', nonBinary: 'Non-binary', unspecified: 'Not specified' },
    legal: { title: 'Legal notice', legalInfo: 'Legal information', websiteName: 'Website name', owner: 'Owner / Publisher', contact: 'Contact', hosting: 'Hosting', frontendHosting: 'Frontend hosting', backendHosting: 'API and database hosting', backendText: 'The Spring Boot backend infrastructure and PostgreSQL database are securely hosted by our cloud provider.', domain: 'Domain name', domainText: 'The domain name "mymovies.charlesmassuard.com" is registered with OVHcloud.', intellectual: 'Intellectual property and third-party APIs', movieDatabase: 'Movie database', intellectualText: 'This website is governed by French and international copyright and intellectual property law.', tmdbText: 'This product uses the TMDB API (The Movie Database) to retrieve movie data, posters and images. MyMovies is not endorsed or certified by TMDB. All images, titles and movie information belong to their respective owners and TMDB.', liability: 'Limitation of liability', liabilityText: 'Charles MASSUARD makes every effort to ensure the accuracy of the information. However, MyMovies relies on the external TMDB API and cannot guarantee the absolute accuracy or completeness of the displayed movie data.' },
    privacy: { title: 'Privacy policy', intro: 'Introduction', introText: 'This Privacy Policy describes how MyMovies collects, uses and protects your personal information on mymovies.charlesmassuard.com. We are committed to complying with the General Data Protection Regulation (GDPR).', collected: 'Data we collect', collectedText: 'We collect the following data and store it in our secure database (PostgreSQL):', identity: 'Identification data', identityText: 'Username, email address, password (strictly encrypted and unreadable).', movieData: 'Movie-related data', movieDataText: 'Your favorites, ratings and personalized watchlists created on MyMovies.', technical: 'Technical data', technicalText: 'IP address and browser type for API security.', thirdParty: 'Third-party services (TMDB)', thirdPartyText: 'MyMovies uses The Movie Database (TMDB) API to display the movie catalog. When you use the search bar, movie-related queries are sent to TMDB. No personal data (email, password or name) is shared, sold or transmitted to TMDB.', usage: 'How we use your data', usageIntro: 'We use the collected data exclusively to:', usageAccount: 'Manage your user account (sign-up and login).', usagePreferences: 'Persist and restore your movie preferences through our Spring Boot backend API.', usageSecurity: 'Ensure the security of your sessions (e.g. token authentication).', storage: 'Data storage and security', storageText: 'Your data is stored on our backend servers, managed by the MyMovies API. We use advanced measures (Spring Security and password hashing) to protect your data against unauthorized access. Communications with our server use HTTPS.', cookies: 'Cookies and sessions', cookiesText: 'MyMovies does not use cookies for advertising or intrusive tracking. We only use technologies such as JWTs or session cookies that are strictly necessary to keep you signed in.', rights: 'Your rights (GDPR)', rightsIntro: 'You have the following rights regarding your personal data:', access: 'Right of access and portability', accessText: 'Request a copy of your account data.', correction: 'Right to rectification', correctionText: 'Correct any inaccurate information.', deletion: 'Right to erasure', deletionText: 'Request the complete and permanent deletion of your account and movie lists.', contactText: 'To exercise these rights, contact us at charles@charlesmassuard.com.' },
    notFound: { title: 'Page not found', text: 'The page you are looking for does not exist.', home: 'Back to home' },
    errors: { generic: 'An error occurred', load: 'Unable to load the data.' }
  }
}

export const languagePreference = () => getStoredPreference()

export const setLanguagePreference = (preference) => {
  const normalized = ['auto', ...supportedLocales].includes(preference) ? preference : 'auto'
  localStorage.setItem('mymovies-language', normalized)
  const locale = resolveLocale(normalized)
  i18n.global.locale.value = locale
  document.documentElement.lang = locale
  return locale
}

const i18n = createI18n({
  legacy: false,
  locale: resolveLocale(),
  fallbackLocale: 'fr',
  messages
})

document.documentElement.lang = i18n.global.locale.value

export { supportedLocales }
export default i18n
