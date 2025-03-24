<template>
    <div class="container">
        <div class="separator">
            <hr class="line" />
            <span class="separator-text">Or use</span>
            <hr class="line" />
        </div>
        <button @click="googleLogInHandler">
            <img id="google-icon" :src="googleIcon" alt="Google Icon" />
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/AuthStores';

const authStore = useAuthStore();
const googleIcon = ref("/google-icon.png");

const googleLogInHandler = async () => {
    await authStore.logInWithGoogle();
};
</script>

<style scoped>
.container {
    border: none;
    text-align: center;
}

.separator {
    display: flex;
    align-items: center;
    margin-bottom: 1rem;
}

.line {
    flex-grow: 1;
    border: none;
    border-top: 1px solid #ccc;
}

.separator-text {
    padding: 0 1rem;
    color: #555;
    font-size: 0.9rem;
}

button {
    padding: 0;
    background-color: transparent;
    border: none;
    cursor: pointer;
}

#google-icon {
    width: 2rem;
}
</style>
