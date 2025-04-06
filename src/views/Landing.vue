<template>
  <div class="landing-page">
    <div class="overlay"></div>

    <div class="landing-content">
      <div class="logo-title">
        <img src="/images/spurredTortoise.png" class="main-logo" alt="Turtle Icon" />
        <h1 class="app-title">TurtleTrackr</h1>
      </div>

      <p class="tagline">Slow, Steady, and Financially Ready.</p>

      <button class="get-started-btn" @click="goToAuth">Get Started</button>
    </div>
  </div>
</template>

<script>
import { useRouter } from 'vue-router';

export default {
  setup() {
    const router = useRouter();
    const goToAuth = () => router.push('/auth');
    return { goToAuth };
  }
};
</script>

<style scoped>
.landing-page {
  height: 100vh;
  background: url('/images/turtle-bg.jpg') center/cover no-repeat;
  position: relative;
  display: flex;
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

/* Mobile friendly adjustments */
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
</style>
