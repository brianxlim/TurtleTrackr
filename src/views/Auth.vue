<template>
  <div class="auth">
    <h1 v-if="!showSignUp">Log In</h1>
    <h1 v-else>Sign Up</h1>
    <form @submit.prevent="handleAuth">
      <!-- Email field -->
      <div class="field">
        <label v-if="showSignUp" for="email">*Email</label>
        <label v-else for="email">Email</label>
        <input type="email" v-model="email" placeholder="john_doe@gmail.com" required />
      </div>

      <!-- Password field -->
      <div class="field">
        <label v-if="showSignUp" for="password">*Password</label>
        <label v-else for="password">Password</label>
        <input type="password" v-model="password" placeholder="Enter password" required />
      </div>
      
      <div v-if="showSignUp" class="field">
        <label for="confirm-password">*Confirm Password</label>
        <input type="password" v-model="confirmPassword" placeholder="Re-enter password" required />
      </div>

      <!-- Display name field -->
      <div v-if="showSignUp" class="field">
        <label for="display-name">*Display Name</label>
        <input type="display-name" v-model="displayName" placeholder="John Doe" required />
      </div>

      <!-- Avatar field -->
      <section id="avatar" v-if="showSignUp" class="field">
        <label for="avatar">*Select Avatar</label>
        <AvatarSelection @selected-turtle="handleSelectedTurtle" />
      </section>

      <!-- Sign up button -->
      <button type="submit" :disabled="loading">
        <span v-if="loading" class="spinner">
          <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
        </span>
        <span v-else>{{ showSignUp ? 'Sign Up' : 'Log In' }}</span>
      </button>
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
const confirmPassword = ref("");
const displayName = ref("");
const selectedTurtle = ref(null);
const showSignUp = ref(false);
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();
const loading = ref(false);

// If query.mode equals 'signup', then show sign up; otherwise, show log in.
watchEffect(() => {
  showSignUp.value = route.query.mode === 'signup';
});

// Register or sign in user depending on which page he is on
const handleAuth = async () => {
  if (loading.value) return;
  loading.value = true;

  // Password and avatar validation if sign up
  if (showSignUp.value) {
    const validPassword = isValidPassword(password.value);
    if (validPassword !== true) {
      alert(validPassword);
      loading.value = false;
      return;
    }
    
    if (password.value != confirmPassword.value) {
      alert("Passwords do not match!");
      loading.value = false;
      return;
    }

    if (!selectedTurtle.value) {
      alert("Please select an avatar!");
      const avatarSection = document.getElementById("avatar"); // Scroll back to avatar field if no avatar selected
      avatarSection.scrollIntoView({ behavior: "smooth", block: "center" });
      loading.value = false;
      return;
    }
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
  } finally {
    loading.value = false;
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

button:disabled {
  background-color: #ddd;
  cursor: not-allowed;
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
