<template>
    <div class="modal-overlay">
        <div class="modal">
            <h2>Change Password</h2>
            <input v-model="currentPassword" type="password" placeholder="Current Password">
            <input v-model="newPassword" type="password" placeholder="New Password">
            <input v-model="confirmPassword" type="password" placeholder="Confirm New Password">
            <p class="error" v-if="error">{{ error }}</p>

            <div class="buttons">
                <button :disabled="loading" @click="handleChange">Save Password</button>
                <button class="cancel" @click="$emit('close')">Cancel</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { getAuth, reauthenticateWithCredential, EmailAuthProvider, updatePassword } from 'firebase/auth';

const emit = defineEmits(['close']);
const currentPassword = ref('');
const newPassword = ref('');
const confirmPassword = ref('');
const error = ref('');
const loading = ref(false);

const handleChange = async() => {
    error.value='';
    if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
        error.value = 'All fields are required.';
        return;
    }
    if (newPassword.value!=confirmPassword.value) {
        error.value = 'New passwords do not match.';
        return;
    }
    const valid = isValidPassword(newPassword.value);
    if (valid !== true) {
        error.value = valid; // this will show all rule errors
        return;
    }

    try {
        loading.value = true;
        const auth = getAuth();
        const user = auth.currentUser;
        const credential = EmailAuthProvider.credential(user.email, currentPassword.value);

        await reauthenticateWithCredential(user, credential);
        await updatePassword(user, newPassword.value);
        
        alert('Your password has been updated successfully!');
        emit('close');
    } catch (err) {
        console.error(err);
        error.value = err.message;
    } finally {
        loading.value = false;
    }
};

// Password validator
const isValidPassword = (password) => {
  const errors = [];

  if (password.length < 6) {
    errors.push("be at least 6 characters long");
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("contain at least 1 uppercase letter");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("contain at least 1 lowercase letter");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("contain at least 1 number");
  }
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push("contain at least 1 special character");
  }

  if (errors.length === 0) {
    return true;
  }

  return "Password must " + errors.join(", ") + ".";
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0;
  width: 100vw; height: 100vh;
  background-color: rgba(0,0,0,0.5);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000;
}
.modal {
  background: var(--color-accent-medium);
  padding: 2rem;
  border-radius: 10px;
  width: 90%;
  max-width: 400px;
}
input {
  width: 100%;
  padding: 0.8rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  border: 1px solid #ccc;
}
.error {
  color: red;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}
.buttons {
  display: flex;
  justify-content: space-between;
}
button {
  padding: 0.6rem 1.2rem;
  border-radius: 6px;
  border: none;
  font-weight: bold;
  cursor: pointer;
}
button:hover {
    background-color: var(--color-main-dark);
    color: white;
    transition: ease-in-out 0.3s;
    cursor: pointer;
}
.cancel {
  background-color: #ccc;
  color: black;
}
.cancel:hover {
    background-color: rgb(161, 57, 57);
    color: white;
}
</style>
