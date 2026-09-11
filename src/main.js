import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import axios from 'axios'
import { useAuthStore } from './stores/auth'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(vuetify)

axios.interceptors.request.use((config) => {
    const authStore = useAuthStore()
    if (authStore.token) {
        config.headers.Authorization = `Bearer ${authStore.token}`
    }
    return config
})

let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

//Gestion du 401 et rafraîchissement transparent
axios.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config
        const authStore = useAuthStore()

        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function(resolve, reject) {
                    failedQueue.push({ resolve, reject })
                }).then(token => {
                    originalRequest.headers['Authorization'] = 'Bearer ' + token
                    return axios(originalRequest)
                }).catch(err => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            try {
                const apiPath = import.meta.env.VITE_API_BASE_URL
                const response = await axios.post(`${apiPath}/auth/refresh`, {
                    refreshToken: authStore.refreshToken
                })

                const newToken = response.data.token
                const newRefreshToken = response.data.refreshToken //Récupère le nouveau refresh token

                //Mise à jour des deux jetons dans le store et le local storage
                authStore.token = newToken
                authStore.refreshToken = newRefreshToken
                localStorage.setItem('user_token', newToken)
                localStorage.setItem('user_refresh_token', newRefreshToken)

                originalRequest.headers['Authorization'] = 'Bearer ' + newToken
                processQueue(null, newToken)
                
                return axios(originalRequest)
                
            } catch (refreshError) {
                //Si le refresh échoue, on déconnecte et on redirige
                processQueue(refreshError, null)
                authStore.logout()
                router.push('/login')
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }
        return Promise.reject(error)
    }
)

app.mount('#app')