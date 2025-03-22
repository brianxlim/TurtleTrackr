<template>
    <div class="category-container">
      <div class="category">
        <span class="category-name">{{ category.name }}</span>
        <span class="category-amount">${{ category.amount.toFixed(2) }}/${{ category.setAmount }}</span>
      </div>
      <div class="progress-bar">
        <div class="fill" :style="{ width: `${progressWidth}%`, backgroundColor: category.color }"></div>
      </div>
    </div>
</template>
  
<script>
export default {
    props: {
      category: {
        type: Object,
        required: true
      },
      setAmount: {
        type: Object,
        required: true
      }
    },
    computed: {
      progressWidth() {
        return Math.min((this.category.amount / this.category.setAmount) * 100, 100);
      }
    }
};
</script>
  
<style scoped>
.category-container {
  display: flex;
  flex-direction: column; /* Stack elements vertically */
  width: 100%;
  margin-bottom: 15px;
  padding: 10px;
  background-color: #dbc49d; /* Background color */
  border-radius: 10px;
}

.category {
  display: flex;
  justify-content: space-between;
  font-weight: bold;
  margin-bottom: 5px;
}

.progress-bar {
  width: 100%;
  height: 15px;
  background-color: white;
  border-radius: 7px;
  overflow: hidden;
  margin-bottom: 10px; /* Adds space between bars */
}

.fill {
  height: 100%;
  border-radius: 7px;
}
</style>