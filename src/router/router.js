import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import Family from '@/views/Family.vue';
import History from '@/views/History.vue';
import Goals from '@/views/Goals.vue';
import Profile from '@/views/Profile.vue';

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/family', name: 'Family', component: Family },
  { path: '/history', name: 'History', component: History },
  { path: '/goals', name: 'Goals', component: Goals },
  { path: '/profile', name: 'Profile', component: Profile },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;
