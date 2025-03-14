<template>
  <div class="auth">
    <h1 v-if="!showSignUp">Log In</h1>
    <h1 v-else>Sign Up</h1>
    <form @submit.prevent="handleAuth">
      <div class="field">
        <label for="email">Email</label>
        <input type="email" v-model="email" placeholder="john_doe@gmail.com" required />
      </div>
      <div class="field">
        <label for="password">Password</label>
        <input type="password" v-model="password" placeholder="Enter password" required />
      </div>
      <div v-if="showSignUp" class="field">
        <label for="display-name">Display Name</label>
        <input type="display-name" v-model="displayName" placeholder="John Doe" required />
      </div>
      <div v-if="showSignUp" class="field">
        <label for="avatar">Select Avatar</label>
        <AvatarSelection @selected-turtle="handleSelectedTurtle" />
      </div>
      <button type="submit">{{ showSignUp ? 'Sign Up' : 'Log In' }}</button>
    </form>
    <p>
      <span v-if="!showSignUp">Don't have an account? </span>
      <span v-else>Already have an account? </span>
      <a href="#" @click.prevent="toggleAuthMode">
        {{ showSignUp ? 'Log In' : 'Sign Up' }}
      </a>
    </p>
  </div>
</template>

<script setup>
import { ref, watchEffect } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '@/stores/AuthStores';
import AvatarSelection from '@/components/AvatarSelection.vue';

const email = ref("");
const password = ref("");
const displayName = ref("");
const selectedTurtle = ref(null);
const showSignUp = ref(false);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// If query.mode equals 'signup', then show sign up; otherwise, show log in.
watchEffect(() => {
  showSignUp.value = route.query.mode === 'signup';
});

// Register or sign in user depending on which page he is on
const handleAuth = async () => {
  // Password validation if sign up
  if (showSignUp.value && password.value.length < 6) {
    alert("Password must be at least 6 characters long.");
    return;
  }

  // If password validated
  try {
    if (showSignUp.value) {
      await authStore.registerUserWithEmailPassword(email.value, password.value, displayName.value, selectedTurtle.value);
    } else {
      await authStore.logInWithEmailAndPassword(email.value, password.value);
    }
    router.push('/home');
  } catch (error) {
    console.error("Authentication error:", error);
  }
};

// Toggle the local state and update the URL query to reflect the change
const toggleAuthMode = () => {
  showSignUp.value = !showSignUp.value;
  router.replace({ path: '/auth', query: { mode: showSignUp.value ? 'signup' : 'login' } });
};

// Handle selected turtle during registration
const handleSelectedTurtle = (turtle) => {
  selectedTurtle.value = turtle;
}
</script>

<style scoped>
.auth {
  width: 80%;
  max-width: 48rem;
  margin: 6rem auto;
  padding: 2rem;
  border: 2px solid #ddd;
  border-radius: 1rem;
  text-align: center;
  background-color: var(--color-main-medium);
}

form {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  align-items: flex-start;
  width: 100%;
}

.field {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 0.4rem;
}

.field > label {
  margin: 0;
  padding: 0;
  width: 100%;
  text-align: left;
}

input {
  width: 100%;
  padding: 1rem;
  border: 1px solid #ccc;
  border-radius: 1rem;
  font-family: 'Poppins';
}

button {
  width: 30%;
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 1rem;
  background-color: var(--color-main-light);
  cursor: pointer;
  font-size: 1rem;
  font-family: 'Poppins';
  margin: 0 0 1rem 0;
  align-self: center;
}

button:hover {
  background-color: var(--color-main-dark);
  transition: ease-in-out 0.3s;
}

a {
  color: var(--color-main-dark);
  cursor: pointer;
  font-weight: 600;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
  background-color: hsla(0, 100%, 100%, 0);
  transition: ease-in-out 0.3s;
}
</style>
