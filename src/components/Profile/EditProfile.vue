<template>
    <div class="modal-overlay">
      <div class="modal">
        <h2>Editing Profile...</h2>
  
        <h3>Please input your new name</h3>
        <input v-model="newName" type="text" placeholder="Enter new display name" class="name-input" />
  
        <h3>Please choose a new avatar</h3>
        <AvatarSelection @selected-turtle="onAvatarSelected" />
  
        <div class="button-group">
            <button :disabled="!selectedAvatar && !newName" @click="saveChanges">
                <span v-if="loading" class="spinner">
                <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
                </span>
                <span v-else>Save Changes</span>
            </button>

            <button class="cancel-button" @click="$emit('close-modal')">Cancel</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted, onBeforeUnmount } from 'vue';
  import { updateProfile, getAuth } from 'firebase/auth';
  import { doc, updateDoc } from 'firebase/firestore';
  import { db } from '@/firebase';
  import { useAuthStore } from '@/stores/AuthStores';
  import AvatarSelection from './AvatarSelection.vue';
  
  const emit = defineEmits(['close-modal', 'avatar-updated']);
  
  const authStore = useAuthStore();
  const selectedAvatar = ref(null);
  const newName = ref(authStore.user?.displayName || '');
  const loading = ref(false);
  
  const onAvatarSelected = (avatar) => {
    selectedAvatar.value = avatar;
  };
  
  const saveChanges = async () => {
    loading.value = true;
    const auth = getAuth();
    const user = auth.currentUser;

    try {
        // 1. Update Firebase Auth
        if (newName.value && newName.value !== authStore.user.displayName) {
        await updateProfile(user, { displayName: newName.value });
        authStore.user.displayName = newName.value;
        }

        // 2. Update Firestore document (IMPORTANT)
        const userDocRef = doc(db, 'Users', user.uid);
        const updates = {};
        if (newName.value) updates.displayName = newName.value;
        if (selectedAvatar.value) updates.selectedTurtle = selectedAvatar.value;
        if (Object.keys(updates).length) await updateDoc(userDocRef, updates);

        // 3. Emit updated data to Profile.vue
        emit('avatar-updated', {
            turtle: selectedAvatar.value || authStore.user.selectedTurtle,
            name: newName.value
        });

        emit('close-modal');
        } catch (error) {
            console.error('Error updating profile:', error);
            alert('Failed to update profile: ' + error.message);
        } finally {
            loading.value = false;
        }
    };

  
  onMounted(() => {
    document.body.style.overflow = 'hidden';
  });
  onBeforeUnmount(() => {
    document.body.style.overflow = '';
  });
  </script>
  
  <style scoped>
  h3 {
    margin: 0 0 1rem 0;
  }
  
  input.name-input {
    width: 80%;
    padding: 0.8rem;
    border-radius: 10px;
    border: 1px solid #ccc;
    font-size: 1rem;
    font-family: 'Poppins';
    margin-bottom: 2rem;
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
    color: white;
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
    max-height: 70vh;
    overflow-y: auto;
    place-items: center;
  }

  .button-group {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
}

.cancel-button {
  background-color: var(--color-accent-light);
  color: black;
}

.cancel-button:hover {
  background-color: rgb(161, 57, 57);
  color: white;
}

  </style>
  