<template>
  <div class="navbar">
    <Logo />
    <div class="menu">
      <!-- Toggle between mobile and desktop view -->
      <button v-if="isMobile" class="menu-button" @click="toggleDrawer">
        <i class="pi pi-bars"></i>
      </button>

      <!-- Desktop view -->
      <nav v-else>
        <router-link to="/">Home</router-link>
        <router-link to="/family">Family</router-link>
        <router-link to="/history">History</router-link>
        <router-link to="/goals">Goals</router-link>
        <router-link to="/profile">Profile</router-link>
      </nav>
    </div>
  </div>

  <!-- Drawer for mobile view -->
  <Drawer
    v-model:visible="visibleDrawer"
    position="left"
    :modal="true"
    :baseZIndex="1000"
    class="drawer"
  >
    <template #container="{ closeCallback }">
      <div class="drawer-container">
        <nav class="drawer-nav">
          <router-link class="drawer-nav-link" to="/" @click="closeDrawer">Home</router-link>
          <router-link class="drawer-nav-link" to="/family" @click="closeDrawer">Family</router-link>
          <router-link class="drawer-nav-link" to="/history" @click="closeDrawer">History</router-link>
          <router-link class="drawer-nav-link" to="/goals" @click="closeDrawer">Goals</router-link>
          <router-link class="drawer-nav-link" to="/profile" @click="closeDrawer">Profile</router-link>
        </nav>
      </div>
    </template>
  </Drawer>
</template>

<script>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import Drawer from 'primevue/drawer';
import 'primeicons/primeicons.css';
import Logo from "@/components/NavBar/Logo.vue";

export default {
  name: "NavBar",
  components: {
    Logo,
    Drawer,
  },
  setup() {
    const visibleDrawer = ref(false);
    const windowWidth = ref(window.innerWidth);

    const handleResize = () => {
      windowWidth.value = window.innerWidth;
    };

    onMounted(() => {
      window.addEventListener("resize", handleResize);
    });

    onUnmounted(() => {
      window.removeEventListener("resize", handleResize);
    });

    // Set mobile view for widths below 800px
    const isMobile = computed(() => windowWidth.value < 800);

    const toggleDrawer = () => {
      visibleDrawer.value = !visibleDrawer.value;
    };

    const closeDrawer = () => {
      visibleDrawer.value = false;
    };

    return {
      visibleDrawer,
      isMobile,
      toggleDrawer,
      closeDrawer,
    };
  },
};
</script>

<style scoped>
.navbar {
  display: flex;
  align-items: center;
  padding: 1rem 4rem;
  justify-content: space-between;
  width: 100%;
  background-color: var(--color-main-dark);
  box-shadow: 0 -1rem 3rem var(--color-main-dark);
}

/* Container for menu items */
.menu {
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: none;
}

/* Hamburger icon button style */
.menu-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 0;
  margin: 0;
  outline: none;
  font-size: 1.5rem;
  color: white;
}

/* Desktop navigation */
nav {
  display: flex;
  gap: 1rem;
}

nav a {
  text-decoration: none;
  color: white;
  transition: 0.4s;
  padding: 0.8rem;
  border-radius: 1rem;
}

@media (hover: hover) {
  nav a:hover {
    background-color: hsla(160, 100%, 37%, 0.2);
  }
}

/* Drawer Styles */
.drawer {
  transition: all 0.3s ease-in-out;
}

.drawer-container {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--color-main-dark);
  border-right: solid 1px grey;
  padding: 6rem 0 0 0 ;
  box-shadow: 0 0 3rem var(--color-main-dark);
}

.drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 4rem;
  padding: 1rem;
}
</style>
