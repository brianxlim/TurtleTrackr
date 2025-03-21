<template>
  <NavBar />
  <AvatarModal v-if="authStore.showAvatarModal" />
  <router-view />
</template>

<script setup>
import AvatarModal from './components/AvatarModal.vue';
import NavBar from './components/NavBar/NavBar.vue';
import { useAuthStore } from './stores/AuthStores';

const authStore = useAuthStore();
console.log(authStore.showAvatarModal)
</script>