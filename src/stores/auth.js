import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('user_token') || null);
  
  const savedUser = localStorage.getItem('user_data');
  const user = ref(savedUser ? JSON.parse(savedUser) : null);

  const isAuthenticated = computed(() => !!token.value);

  function login(newToken, userData) {
    token.value = newToken;
    localStorage.setItem('user_token', newToken);
    if (userData) {
      user.value = userData;
      localStorage.setItem('user_data', JSON.stringify(userData));
    }
  }

  function setUser(userData) {
    user.value = userData;
    localStorage.setItem('user_data', JSON.stringify(userData));
  }

  function logout() {
    token.value = null;
    user.value = null;
    localStorage.removeItem('user_token');
    localStorage.removeItem('user_data');
  }

  return { token, user, isAuthenticated, login, setUser, logout };
});