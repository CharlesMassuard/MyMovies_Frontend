import axios from 'axios';
import i18n from '../i18n';
import router from '../router';
import { useAuthStore } from '../stores/auth';

const axiosRefresh = axios.create();

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function attachAuthInterceptors(instance) {
  instance.interceptors.request.use((config) => {
    const authStore = useAuthStore();
    config.headers = config.headers || {};
    config.headers['Accept-Language'] = i18n.global.locale.value || 'fr';
    const token = authStore.token || localStorage.getItem('user_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const originalRequest = error.config;
      const authStore = useAuthStore();
      const requestUrl = originalRequest?.url || '';
      const isAuthRequest =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/forgot-password') ||
        requestUrl.includes('/auth/reset-password');
      const isRefreshRequest = requestUrl.includes('/auth/refresh');

      if (
        error.response?.status === 401 &&
        !isAuthRequest &&
        !isRefreshRequest &&
        authStore.refreshToken &&
        originalRequest &&
        !originalRequest._retry
      ) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return instance(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const apiPath = import.meta.env.VITE_API_BASE_URL;
          const response = await axiosRefresh.post(
            `${apiPath}/auth/refresh`,
            { refreshToken: authStore.refreshToken },
            { headers: { 'Accept-Language': i18n.global.locale.value || 'fr' } }
          );

          const newToken = response.data.token;
          const newRefreshToken = response.data.refreshToken;

          authStore.token = newToken;
          if (newRefreshToken) {
            authStore.refreshToken = newRefreshToken;
            localStorage.setItem('user_refresh_token', newRefreshToken);
          }
          localStorage.setItem('user_token', newToken);

          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          processQueue(null, newToken);

          return instance(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          authStore.logout();
          router.push('/login');
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
}

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL
});

attachAuthInterceptors(apiClient);

export default apiClient;
