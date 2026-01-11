import { createRouter, createWebHistory } from 'vue-router'
import LoginView from '../views/LoginView.vue'
import MainView from '../views/MainView.vue'

const routes = [
    {
        path: '/login',
        name: 'login',
        component: LoginView,
        alias: ['/register']
    },
    {
        path: '/',
        name: 'main',
        component: MainView
    }
]

const router = createRouter({
    history: createWebHistory(),
    routes
})

export default router