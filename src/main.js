import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from '@/router/router.js';
import { createPinia } from 'pinia';
import { auth } from './firebase';
import { onAuthStateChanged } from 'firebase/auth';

let app;
const pinia = createPinia();

onAuthStateChanged(auth, () => {
    if (!app) {
        app = createApp(App);
        app.use(pinia).use(router).mount('#app');
    }
})
