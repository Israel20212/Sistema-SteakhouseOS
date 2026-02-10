import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from './router'
import './style.css'
import '@fortawesome/fontawesome-free/css/all.css'
import App from './App.vue'

const app = createApp(App)

app.use(createPinia())
app.use(router)

import { useAuthStore } from './stores/auth'
const authStore = useAuthStore()
authStore.initializeAuth()

app.mount('#app')
