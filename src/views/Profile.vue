<template>
    <div class="main">
        <header>
            <h1 id="welcome-text">Welcome back, {{ displayName }}</h1>
            <div class="avatar-container">
                <img :src="turtleSrc" id="avatar" />
            </div>
        </header>
        <div class="button-container">
            <button id="logout-button" @click="signOutUser">Log out</button>
            <button id="delete-account-button" @click="">Delete Account</button>
        </div>
    </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useAuthStore } from '@/stores/AuthStores';
import { getAvatarURL } from '@/firebase';

const authStore = useAuthStore();
const displayName = computed(() => authStore.user?.displayName || "Guest");
const turtleSrc = computed(() => getAvatarURL(authStore.user?.selectedTurtle.turtleFilename) || "https://i.sstatic.net/l60Hf.png");

const signOutUser = async () => {
    await authStore.logUserOut(); 
};
</script>

<style scoped>
.main {
    padding: var(--padding-body);
}

#welcome-text {
    margin: 0;
}

header {
    display: flex;
    flex-direction: row;
    align-items: center;
    margin: 0 0 2rem 0;
    gap: 1rem;
}

@media (max-width: 1000px) {
    header {
        gap: 0;
    }
}

.avatar-container {
    width: 6rem;
    height:6rem;
    place-content: center;
    border: 2px solid #ddd;
    border-radius: 50%;
    margin: 0;
}

#avatar {
    width: 6rem;
    height: 4rem;
}

button {
    border-radius: 1cqb;
    border: 1px solid #ddd;
    padding: 0.5rem 1rem;
    font-family: 'Poppins';
    font-size: 1rem;
    color: white;
}

button:hover {
    opacity: 70%;
    transition: ease-in-out 0.3s;
    cursor: pointer;
}

.button-container {
    display: flex;
    gap: 3rem;
}

#logout-button {
    background-color: var(--color-accent-dark);
}

#delete-account-button {
    background-color: rgb(161, 57, 57);
}
</style>
  