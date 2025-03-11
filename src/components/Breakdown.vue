<template>
  <div class="breakdown">
    <h2>Breakdown</h2>
    <div v-for="category in categories" :key="category.name" class="category">
      <div class="icon" :style="{ backgroundColor: category.color }"></div>
      <p>{{ category.name }}</p>
      <p>${{ category.amount.toFixed(2) }}</p>
    </div>
  </div>
</template>

<script>
export default {
  props: ["categories"],
};
</script>

<style scoped>
.breakdown {
  background: white;
  padding: 2rem 6rem;
  border-radius: 1rem;
  width: 80%;
  height: 100%; /* Full height */
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);
  overflow: auto;
}

h2 {
  text-align: center;
  font-size: 1.5rem;
  margin: 0 0 1.5rem 0;
  color: var(--color-main-dark);
  font-weight: 800;
}

.category {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}

p{
  color: var(--color-main-dark);
  font-weight: bold;
}
</style>
