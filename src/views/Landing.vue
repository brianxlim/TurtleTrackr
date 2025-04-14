<template>
  <div class="landing-page">
    <div class="overlay"></div>

    <div class="landing-content">
      <div class="logo-title">
        <img src="/images/spurredTortoise.png" class="main-logo" alt="Turtle Icon" />
        <h1 class="app-title">TurtleTrackr</h1>
      </div>

      <p class="tagline">Slow, Steady, and Financially Ready.</p>

      <button class="get-started-btn" @click="triggerSingleCoin">Get Started</button>
    </div>

    <!-- 🪙 Coin -->
    <img v-if="showCoin" src="/images/coin.png" class="center-coin" alt="Coin" />
  </div>
</template>

<script>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

export default {
  setup() {
    const showCoin = ref(false);
    const router = useRouter();
    const route = useRoute();

    const triggerSingleCoin = () => {
      showCoin.value = true;

      setTimeout(() => {
        showCoin.value = false;
        sessionStorage.setItem('hasSeenLanding', 'true');

        // Redirect to the originally intended path if passed
        const redirectTo = route.query.redirect || '/auth/main';
        router.push(redirectTo);
      }, 1000);
    };

    return {
      showCoin,
      triggerSingleCoin
    };
  }
};
</script>


<style scoped>
.landing-page {
  height: 100vh;
  background: url('/images/turtle-bg.jpg') center/cover no-repeat;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  overflow: hidden;
  padding: 20px;
}

.overlay {
  position: absolute;
  inset: 0;
  background-color: rgba(255, 255, 255, 0.65);
  z-index: 0;
}

.landing-content {
  position: relative;
  z-index: 1;
  text-align: center;
  max-width: 100%;
}

.logo-title {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 16px;
  padding: 0 10px;
}

.main-logo {
  width: 105px;
  height: auto;
}

.app-title {
  font-size: 64px;
  font-weight: 900;
  color: #fefae0;
  margin: 0;
  text-shadow: 2px 2px 5px rgba(0, 0, 0, 0.2);
}

@media (max-width: 600px) {
  .app-title {
    font-size: 48px;
  }

  .main-logo {
    width: 50px;
  }

  .logo-title {
    flex-direction: column;
  }
}

.tagline {
  font-size: 20px;
  color: #3e533f;
  font-weight: 600;
  margin-top: 10px;
  margin-bottom: 30px;
  text-shadow: 1px 1px 2px rgba(255, 255, 255, 0.3);
}

.get-started-btn {
  background-color: #fff;
  color: #3e533f;
  padding: 12px 24px;
  font-weight: bold;
  font-size: 16px;
  border-radius: 30px;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.get-started-btn:hover {
  transform: scale(1.05);
}

.center-coin {
  position: fixed;
  top: 50%;
  left: 50%;
  width: 100px;
  height: 50px;
  transform: translate(-50%, -50%);
  z-index: 10;
  animation: spinFade 1s ease-out forwards;
  pointer-events: none;
}

@keyframes spinFade {
  0% {
    transform: translate(-50%, -50%) scale(1) rotate(0deg);
    opacity: 1;
  }
  50% {
    transform: translate(-50%, -50%) scale(1.2) rotate(180deg);
    opacity: 0.9;
  }
  100% {
    transform: translate(-50%, -50%) scale(0.8) rotate(360deg);
    opacity: 0;
  }
}
</style>
