import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import apiClient from '../api/client';

export function useMediaDetails(mediaType, mediaId) {
  const { t, locale } = useI18n();

  const isMovie = computed(() => mediaType.value === 'movie');
  const apiSegment = computed(() => (isMovie.value ? 'movies' : 'series'));
  const userApiSegment = computed(() => (isMovie.value ? 'user/movies' : 'user/series'));

  const isLoading = ref(true);
  const details = ref({});
  const credits = ref({});
  const similarMedia = ref([]);
  const watchProviders = ref([]);
  const videos = ref([]);
  const trailerKey = ref(null);
  const collectionDetails = ref(null);
  const libraryStatusMap = ref({});

  // Dialog states
  const dialogTrailer = ref(false);
  const dialogConfirmation = ref(false);
  const dialogDate = ref(false);
  const dialogNote = ref(false);
  const dialogAuth = ref(false);
  const dialogHistory = ref(false);
  const authMessage = ref('');
  const historyTab = ref('list');

  // User tracking state
  const userRating = ref(0);
  const userComment = ref('');
  const statusUserMedia = ref('UNDEFINED');
  const textWatchedWithDate = ref('');

  // Series season state
  const selectedSeasonInfo = ref(null);
  const loadingSeason = ref(false);
  const activeSeasonNumber = ref(null);

  const title = computed(() => details.value.title || details.value.name || '');

  const isReleased = computed(() => {
    if (isMovie.value) {
      return details.value.status === 'Released';
    }
    if (!details.value.first_air_date) return false;
    return new Date(details.value.first_air_date) <= new Date();
  });

  const statusBadge = computed(() => {
    const s = details.value.status;
    if (!s) return null;
    if (isMovie.value) {
      if (s === 'Released') return { text: t('media.released'), color: '#22c55e' };
      return { text: t('media.upcoming'), color: '#8C52FF' };
    }
    if (s === 'Returning Series') return { text: t('media.returningSeries'), color: '#22c55e' };
    if (s === 'Ended') return { text: t('media.ended'), color: '#3b82f6' };
    if (s === 'Canceled') return { text: t('media.canceled'), color: '#ef4444' };
    if (s === 'In Production') return { text: t('media.production'), color: '#f59e0b' };
    return { text: s, color: '#8C52FF' };
  });

  const logoPath = computed(() => {
    const logos = details.value.images?.logos;
    if (!Array.isArray(logos) || logos.length === 0) return null;
    const currentLang = locale.value === 'en' ? 'en' : 'fr';
    const preferred =
      logos.find(l => l.iso_639_1 === currentLang) ||
      logos.find(l => l.iso_639_1 === 'en') ||
      logos.find(l => !l.iso_639_1) ||
      logos[0];
    return preferred?.file_path || null;
  });

  const certification = computed(() => {
    if (isMovie.value) {
      const results = details.value.release_dates?.results || [];
      const fr = results.find(r => r.iso_3166_1 === 'FR');
      const us = results.find(r => r.iso_3166_1 === 'US');
      const pick = (entry) => entry?.release_dates?.find(d => d.certification && d.certification.trim() !== '')?.certification;
      const cert = pick(fr) || pick(us);
      if (!cert) return null;
      return /^\d+$/.test(cert) ? `${cert}+` : cert;
    }
    const results = details.value.content_ratings?.results || [];
    const fr = results.find(r => r.iso_3166_1 === 'FR');
    const us = results.find(r => r.iso_3166_1 === 'US');
    const cert = fr?.rating || us?.rating;
    if (!cert) return null;
    return /^\d+$/.test(cert) ? `${cert}+` : cert;
  });

  const directors = computed(() => {
    if (!Array.isArray(credits.value.crew)) return [];
    return credits.value.crew.filter(m => m.job === 'Director');
  });

  const writers = computed(() => {
    if (!Array.isArray(credits.value.crew)) return [];
    const seen = new Set();
    return credits.value.crew.filter(m => {
      if (!['Screenplay', 'Writer', 'Story', 'Novel'].includes(m.job)) return false;
      if (seen.has(m.id)) return false;
      seen.add(m.id);
      return true;
    });
  });

  const creators = computed(() => {
    if (isMovie.value) return directors.value;
    return Array.isArray(details.value.created_by) ? details.value.created_by : [];
  });

  const releaseYear = computed(() => {
    const raw = isMovie.value ? details.value.release_date : details.value.first_air_date;
    return raw ? raw.split('-')[0] : '';
  });

  const periodYears = computed(() => {
    if (isMovie.value) return releaseYear.value;
    if (!releaseYear.value) return '';
    const lastYear = details.value.last_air_date ? details.value.last_air_date.split('-')[0] : '';
    if (details.value.status === 'Ended' || details.value.status === 'Canceled') {
      return lastYear && lastYear !== releaseYear.value ? `${releaseYear.value} - ${lastYear}` : releaseYear.value;
    }
    return `${releaseYear.value} - ${t('common.today')}`;
  });

  const releaseDateFormatted = computed(() => {
    const raw = isMovie.value ? details.value.release_date : details.value.first_air_date;
    if (!raw) return null;
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) return raw;
    return new Intl.DateTimeFormat(locale.value, { day: 'numeric', month: 'long', year: 'numeric' }).format(d);
  });

  const runtimeMinutes = computed(() => {
    if (isMovie.value) return details.value.runtime || 0;
    const arr = details.value.episode_run_time;
    return Array.isArray(arr) && arr.length > 0 ? arr[0] : 0;
  });

  const runtimeFormatted = computed(() => {
    const rm = runtimeMinutes.value;
    if (!rm || rm <= 0) return isMovie.value ? t('common.durationUnknown') : null;
    const hours = Math.floor(rm / 60);
    const mins = rm % 60;
    if (isMovie.value) {
      return hours > 0 ? `${hours} h ${String(mins).padStart(2, '0')}` : `${mins} min`;
    }
    return hours > 0
      ? `${hours} h ${String(mins).padStart(2, '0')} / ${t('media.episodeShort')}`
      : `${mins} min / ${t('media.episodeShort')}`;
  });

  const runtimeFullFormatted = computed(() => {
    const rm = runtimeMinutes.value;
    if (!rm || rm <= 0) return t('common.durationUnknown');
    const hours = Math.floor(rm / 60);
    const mins = rm % 60;
    if (hours > 0) {
      return `${hours} h ${String(mins).padStart(2, '0')} (${rm} ${t('media.minutes')})`;
    }
    return `${rm} ${t('media.minutes')}`;
  });

  const allGenres = computed(() =>
    Array.isArray(details.value.genres) ? details.value.genres.map(g => g.name).join(', ') : ''
  );

  const textButtonStatus = computed(() => ({
    WATCHED: { text: textWatchedWithDate.value || t('common.watched'), icon: 'mdi-check-all' },
    WATCHING: { text: t('common.watching'), icon: 'mdi-play-circle-outline' },
    TO_WATCH: { text: t('common.watch'), icon: 'mdi-clock-outline' },
    UNDEFINED: { text: t('media.add'), icon: 'mdi-plus' }
  }));

  const allActions = computed(() => [
    { id: 'TO_WATCH', text: t('common.watch'), icon: 'mdi-clock-outline' },
    { id: 'WATCHING', text: t('common.watching'), icon: 'mdi-play-circle-outline' },
    { id: 'WATCHED', text: t('common.watched'), icon: 'mdi-check-all' },
    { id: 'HISTORY', text: t('common.history'), icon: 'mdi-history' },
    { id: 'ADD_HISTORY', text: t('common.addHistory'), icon: 'mdi-plus-box-multiple' },
    { id: 'DATE', text: t('media.changeDate'), icon: 'mdi-calendar' },
    { id: 'DELETE', text: t('media.deleteFromList'), icon: 'mdi-delete', color: 'error' }
  ]);

  const itemsStatus = computed(() => {
    if (!isReleased.value) {
      return allActions.value.filter(i => i.id === 'DELETE');
    }
    switch (statusUserMedia.value) {
      case 'TO_WATCH':
        return allActions.value.filter(i => ['WATCHING', 'WATCHED', 'DELETE'].includes(i.id));
      case 'WATCHING':
        return allActions.value.filter(i => ['TO_WATCH', 'WATCHED', 'DELETE'].includes(i.id));
      case 'WATCHED':
        return allActions.value.filter(i =>
          ['HISTORY', 'ADD_HISTORY', 'TO_WATCH', 'WATCHING', 'DATE', 'DELETE'].includes(i.id)
        );
      default:
        return [];
    }
  });

  const displayRating = computed(() => (userRating.value > 0 ? `${userRating.value}/10` : t('common.rating')));

  const handleAuthError = (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      localStorage.removeItem('user_token');
      authMessage.value = t('media.sessionExpired');
      dialogAuth.value = true;
      return true;
    }
    return false;
  };

  const checkAuth = (message) => {
    if (!localStorage.getItem('user_token')) {
      authMessage.value = message;
      dialogAuth.value = true;
      return false;
    }
    return true;
  };

  const fetchCollection = async (collectionId) => {
    if (!collectionId) {
      collectionDetails.value = null;
      return;
    }
    try {
      const response = await apiClient.get(`/movies/collection/${collectionId}`);
      collectionDetails.value = response.data;
    } catch (error) {
      console.error('Error fetching collection:', error);
      collectionDetails.value = null;
    }
  };

  const fetchUserLibraryMap = async () => {
    const token = localStorage.getItem('user_token');
    if (!token) return;
    try {
      const [mRes, sRes] = await Promise.all([
        apiClient.get('/user/movies'),
        apiClient.get('/user/series')
      ]);
      const map = {};
      (mRes.data || []).forEach(i => {
        if (i.movie?.id) map[`movie-${i.movie.id}`] = i.status;
      });
      (sRes.data || []).forEach(i => {
        if (i.serie?.id) map[`serie-${i.serie.id}`] = i.status;
      });
      libraryStatusMap.value = map;
    } catch {
      // Ignore if unauthenticated
    }
  };

  const fetchDetails = async () => {
    try {
      // Single aggregated TMDB call via append_to_response
      const detailsRes = await apiClient.get(`/${apiSegment.value}/${mediaId.value}`);
      const d = detailsRes.data || {};
      details.value = d;

      credits.value = d.credits || {};

      const recResults = d.recommendations?.results || [];
      similarMedia.value = recResults.slice(0, 12);

      const vidResults = d.videos?.results || [];
      videos.value = vidResults;
      const trailer =
        vidResults.find(v => v.type === 'Trailer' && v.site === 'YouTube') ||
        vidResults.find(v => v.site === 'YouTube');
      trailerKey.value = trailer ? trailer.key : null;

      const provResults = d['watch/providers']?.results || {};
      const regionKey = locale.value === 'en' ? 'US' : 'FR';
      const regional = provResults[regionKey] || provResults.FR;
      watchProviders.value = regional ? regional.flatrate || regional.rent || regional.buy || [] : [];

      if (isMovie.value && d.belongs_to_collection?.id) {
        fetchCollection(d.belongs_to_collection.id);
      } else {
        collectionDetails.value = null;
      }
    } catch (error) {
      console.error('Error fetching media details:', error);
    }
  };

  const fetchStatusUserMedia = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;

      const response = await apiClient.get(`/${userApiSegment.value}/status/${mediaId.value}`);
      statusUserMedia.value = response.data;

      if (statusUserMedia.value === 'WATCHED') {
        const watchedResponse = await apiClient.get(`/${userApiSegment.value}/watched-date/${mediaId.value}`);

        let baseText = isMovie.value ? t('media.watchedLongAgo') : t('media.finishedLongAgo');
        if (watchedResponse.data && !String(watchedResponse.data).startsWith('1970-01-01')) {
          const d = new Date(watchedResponse.data);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const prefix = isMovie.value ? t('media.watchedOn') : t('media.finishedOn');
          baseText = `${prefix} ${day}/${month}/${d.getFullYear()}`;
        }

        try {
          const historyResponse = await apiClient.get(`/${userApiSegment.value}/history/${mediaId.value}`);
          const count = historyResponse.data.length;
          if (count > 1) {
            baseText += ` (${count} ${t('media.watchings')})`;
          }
        } catch (e) {
          console.error('Erreur récupération historique', e);
        }

        textWatchedWithDate.value = baseText;
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const fetchRating = async () => {
    try {
      const token = localStorage.getItem('user_token');
      if (!token) return;
      const [resRating, resComment] = await Promise.all([
        apiClient.get(`/${userApiSegment.value}/rating/${mediaId.value}`),
        apiClient.get(`/${userApiSegment.value}/comment/${mediaId.value}`)
      ]);
      userComment.value = ['UNDEFINED', null, 'NO_COMMENT'].includes(resComment.data)
        ? ''
        : resComment.data || '';
      userRating.value = resRating.data || 0;
    } catch (error) {
      handleAuthError(error);
      userRating.value = 0;
      userComment.value = '';
    }
  };

  const fetchSeasonDetails = async (seasonNumber) => {
    if (activeSeasonNumber.value === seasonNumber) {
      selectedSeasonInfo.value = null;
      activeSeasonNumber.value = null;
      return;
    }
    loadingSeason.value = true;
    activeSeasonNumber.value = seasonNumber;
    try {
      const response = await apiClient.get(`/series/${mediaId.value}/season/${seasonNumber}`);
      selectedSeasonInfo.value = response.data;
    } catch (error) {
      console.error('Erreur chargement saison:', error);
    } finally {
      loadingSeason.value = false;
    }
  };

  const handleMainButtonClick = () => {
    if (!checkAuth(t('auth.mustLogin'))) return;
    if (statusUserMedia.value === 'UNDEFINED') {
      apiClient
        .post(`/${userApiSegment.value}/to-watch/${mediaId.value}`, {})
        .then(() => {
          statusUserMedia.value = 'TO_WATCH';
          libraryStatusMap.value[`${mediaType.value}-${mediaId.value}`] = 'TO_WATCH';
        })
        .catch(handleAuthError);
    }
  };

  const updateStatus = async (newStatus) => {
    if (!checkAuth(t('auth.mustLogin'))) return;

    if (newStatus === 'DELETE') return (dialogConfirmation.value = true);
    if (newStatus === 'DATE') return (dialogDate.value = true);
    if (newStatus === 'HISTORY') {
      historyTab.value = 'list';
      return (dialogHistory.value = true);
    }
    if (newStatus === 'ADD_HISTORY') {
      historyTab.value = 'add';
      return (dialogHistory.value = true);
    }

    try {
      const payload = { status: newStatus };
      if (newStatus === 'WATCHED') {
        const today = new Date();
        payload.watchedAt = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
          today.getDate()
        ).padStart(2, '0')}`;
        const prefix = isMovie.value ? t('media.watchedOn') : t('media.finishedOn');
        textWatchedWithDate.value = `${prefix} ${String(today.getDate()).padStart(2, '0')}/${String(
          today.getMonth() + 1
        ).padStart(2, '0')}/${today.getFullYear()}`;
      }
      await apiClient.put(`/${userApiSegment.value}/status/${mediaId.value}`, payload);
      statusUserMedia.value = newStatus;
      libraryStatusMap.value[`${mediaType.value}-${mediaId.value}`] = newStatus;
      if (newStatus === 'WATCHED') {
        await fetchStatusUserMedia();
      }
    } catch (error) {
      handleAuthError(error);
    }
  };

  const confirmDelete = async () => {
    try {
      await apiClient.delete(`/${userApiSegment.value}/status/${mediaId.value}`);
      statusUserMedia.value = 'UNDEFINED';
      delete libraryStatusMap.value[`${mediaType.value}-${mediaId.value}`];
      dialogConfirmation.value = false;
      userComment.value = '';
      userRating.value = 0;
    } catch (error) {
      handleAuthError(error);
    }
  };

  const handleDateConfirm = async (dateData) => {
    try {
      let formattedDate = '1970-01-01';
      if (dateData !== 'long-time-ago') {
        formattedDate = `${dateData.getFullYear()}-${String(dateData.getMonth() + 1).padStart(2, '0')}-${String(
          dateData.getDate()
        ).padStart(2, '0')}`;
      }
      await apiClient.put(`/${userApiSegment.value}/status/${mediaId.value}`, {
        status: 'WATCHED',
        watchedAt: formattedDate
      });
      statusUserMedia.value = 'WATCHED';
      libraryStatusMap.value[`${mediaType.value}-${mediaId.value}`] = 'WATCHED';
      await fetchStatusUserMedia();
    } catch (error) {
      handleAuthError(error);
    }
  };

  const saveRating = async ({ rating, comment }) => {
    try {
      userRating.value = rating;
      userComment.value = comment;
      await apiClient.put(`/${userApiSegment.value}/rate/${mediaId.value}`, { rating, comment });
      fetchStatusUserMedia();
    } catch (error) {
      handleAuthError(error);
    }
  };

  const resetAndLoad = async () => {
    if (!mediaId.value) return;
    details.value = {};
    credits.value = {};
    similarMedia.value = [];
    watchProviders.value = [];
    videos.value = [];
    trailerKey.value = null;
    collectionDetails.value = null;
    statusUserMedia.value = 'UNDEFINED';
    userRating.value = 0;
    userComment.value = '';
    selectedSeasonInfo.value = null;
    activeSeasonNumber.value = null;
    textWatchedWithDate.value = isMovie.value ? t('common.watched') : t('media.finishedLongAgo');

    isLoading.value = true;
    try {
      await Promise.all([
        fetchDetails(),
        fetchStatusUserMedia(),
        fetchRating(),
        fetchUserLibraryMap()
      ]);
    } catch (error) {
      console.error('Error loading media data:', error);
    } finally {
      isLoading.value = false;
    }
  };

  watch([mediaId, mediaType], () => {
    resetAndLoad();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  return {
    isMovie,
    isLoading,
    details,
    credits,
    similarMedia,
    watchProviders,
    videos,
    trailerKey,
    collectionDetails,
    libraryStatusMap,
    dialogTrailer,
    dialogConfirmation,
    dialogDate,
    dialogNote,
    dialogAuth,
    dialogHistory,
    authMessage,
    historyTab,
    userRating,
    userComment,
    statusUserMedia,
    selectedSeasonInfo,
    loadingSeason,
    activeSeasonNumber,
    title,
    isReleased,
    statusBadge,
    logoPath,
    certification,
    directors,
    writers,
    creators,
    releaseYear,
    periodYears,
    releaseDateFormatted,
    runtimeMinutes,
    runtimeFormatted,
    runtimeFullFormatted,
    allGenres,
    textButtonStatus,
    itemsStatus,
    displayRating,
    checkAuth,
    fetchStatusUserMedia,
    fetchSeasonDetails,
    handleMainButtonClick,
    updateStatus,
    confirmDelete,
    handleDateConfirm,
    saveRating,
    resetAndLoad
  };
}
