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
  padding: 50px 100px;
  margin: 50px 150px;
  border-radius: 10px;
  width: 200px; /* Fixed width */
  height: 100%; /* Full height */
  max-height: 250px; /* Limits height */
  box-shadow: 0px 4px 6px rgba(0, 0, 0, 0.1);

}

h2 {
  text-align: center;
  font-size: 20px;
  margin-bottom: 10px;
  color: #3d5538;
  font-weight: bold;

}

.category {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 5px 0;
}

.icon {
  width: 16px;
  height: 16px;
  border-radius: 50%;
}
p{
  color: #3d5538;
  font-weight: bold;
}
</style>
