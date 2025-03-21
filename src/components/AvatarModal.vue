<template>
    <div class="modal-overlay">
    <div class="modal">
        <h2>Before you continue...</h2>
        <h3>Please choose an avatar</h3>
        <AvatarSelection @selected-turtle="onAvatarSelected" />
        <button :disabled="!selectedAvatar" @click="saveAvatar">
            <span v-if="loading" class="spinner">
                <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
            </span>
            <span v-else>Save Avatar</span>
        </button>
    </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuthStore } from '@/stores/AuthStores';
import AvatarSelection from './AvatarSelection.vue';

const authStore = useAuthStore();
const selectedAvatar = ref(null);
const loading = ref(false);

const onAvatarSelected = (avatar) => {
    selectedAvatar.value = avatar;
};

const saveAvatar = async () => {
    loading.value = true;
    if (!selectedAvatar.value || !authStore.user) {
        loading.value = false;
        return;
    }

    try {
        const userDocRef = doc(db, 'Users', authStore.user.uid);
        await updateDoc(userDocRef, { selectedTurtle: selectedAvatar.value });
        authStore.user.selectedTurtle = selectedAvatar.value;
        authStore.showAvatarModal = false;
    } catch (error) {
        console.error('Error updating avatar:', error);
    } finally {
        loading.value = false;
    }
};

// Disable background scrolling while the modal is open
onMounted(() => {
    document.body.style.overflow = 'hidden';
});
onBeforeUnmount(() => {
    document.body.style.overflow = '';
});
</script>

<style scoped>
h3 {
    margin: 0 0 2rem 0;
}

button {
    margin: 2rem 0;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 1rem;
    background-color: var(--color-main-light);
    cursor: pointer;
    font-size: 1rem;
    font-family: 'Poppins';
    align-self: center;
}

button:disabled {
    background-color: #ddd;
    cursor: not-allowed;
}

button:hover {
    background-color: var(--color-main-dark);
    transition: ease-in-out 0.3s;
}

.modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: rgba(0, 0, 0, 0.5);
}

.modal {
    background-color: var(--color-main-medium);
    padding: 2rem;
    border-radius: 8px;
    text-align: center;
    width: 70%;
    max-height: 60vh;
    overflow-y: auto;
    place-items: center;
}
</style>
  