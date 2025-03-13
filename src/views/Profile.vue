<template>
    <div class="main">
        <h1>Welcome back, {{ displayName }}</h1>
        <button @click="signOutUser">Log out</button>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useAuthStore } from '@/stores/AuthStores';

const authStore = useAuthStore();
const displayName = computed(() => authStore.user?.displayName || "Guest");

const signOutUser = async () => {
    await authStore.logUserOut(); 
};
</script>

<style scoped>
.main {
    padding: var(--padding-body);
}
</style>
  