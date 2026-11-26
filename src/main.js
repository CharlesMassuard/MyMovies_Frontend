import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import './style.css'
import router from './router'
import axios from 'axios'
import i18n from './i18n'
import { attachAuthInterceptors } from './api/client'

const pinia = createPinia()
const app = createApp(App)

app.use(pinia)
app.use(router)
app.use(vuetify)
app.use(i18n)

// Attache le même intercepteur (token + refresh transparent 401) à l'instance axios globale
attachAuthInterceptors(axios)

app.mount('#app')
