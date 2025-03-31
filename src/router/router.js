import { createRouter, createWebHistory } from 'vue-router';
import Home from '@/views/Home.vue';
import Family from '@/views/Family.vue';
import FamilyDetails from "@/views/FamilyDetails.vue";
import History from '@/views/History.vue';
import Goals from '@/views/Goals.vue';
import Profile from '@/views/Profile.vue';
import Auth from '@/views/Auth.vue';
import { auth } from '@/firebase';

const routes = [
  // Use a dynamic redirect for the root path
  {
    path: '/',
    name: 'Root',
    redirect: () => (auth.currentUser ? '/home' : '/auth'),
  },
  { 
    path: '/auth',
    name: 'Auth',
    component: Auth
  },
  { 
    path: '/home',
    name: 'Home',
    component: Home, 
    meta: { requiresAuth: true }
  },
  { 
    path: '/family',
    name: 'Family',
    component: Family,
    meta: { requiresAuth: true }
  },
  {
    path: '/family/:id',
    name: 'FamilyDetails',
    component: FamilyDetails,
    props: true,
    meta: { requiresAuth: true }
  },
  { 
    path: '/history/:uid?',
    name: 'History',
    component: History,
    meta: { requiresAuth: true }
  },
  { 
    path: '/goals',
    name: 'Goals',
    component: Goals,
    meta: { requiresAuth: true }
  },
  { 
    path: '/profile',
    name: 'Profile',
    component: Profile,
    meta: { requiresAuth: true }
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Global Navigation Guard
router.beforeEach((to, from, next) => {
  const loggedIn = !!auth.currentUser; // true if user is logged in

  // If navigating to /auth while logged in, redirect to /home
  if (to.path === '/auth' && loggedIn) {
    next({ path: '/home' });
  }
  // If navigating to the root, redirect based on login status
  else if (to.path === '/') {
    next(loggedIn ? '/home' : '/auth');
  }
  // If the route requires auth and user isn't logged in, redirect to /auth
  else if (to.meta.requiresAuth && !loggedIn) {
    next({ path: '/auth' });
  } else {
    next();
  }
});

export default router;
