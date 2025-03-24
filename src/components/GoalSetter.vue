<template>
    <div class="goal-setter-modal">
      <div class="goal-setter">
        <h2>Tell us more about your financial goals.</h2>
        <p>I pledge to spend within $ <input v-model.number="editableTotalSet" type="number" /> each month.</p>
  
        <div class="goal-list">
          <div class="goal-item" v-for="(category, index) in editableCategories" :key="category.name">
            <span>{{ category.name }}</span>
            <input
              v-model.number="category.percentage"
              type="number"
              min="0"
              max="100"
              @input="updateAmounts"
            /> %
            <span>${{ calculatedAmount(category.percentage) }}</span>
          </div>
  
          <div class="goal-item total-row">
            <span><strong>Total</strong></span>
            <span></span>
            <span :style="{ color: totalPercentage === 100 ? 'green' : 'red' }"><strong>{{ totalPercentage }}%</strong></span>
          </div>
        </div>
  
        <div class="buttons">
          <button class="cancel" @click="$emit('close')">Cancel</button>
          <button class="confirm" :disabled="totalPercentage !== 100 || editableTotalSet <= 0" @click="confirmGoals">Confirm</button>
        </div>
      </div>
    </div>
</template>
  
<script>
export default {
    props: ["categories", "totalSet"],
    data() {
      return {
        editableTotalSet: this.totalSet,
        editableCategories: this.categories.map((c) => ({
          ...c,
          percentage: ((c.setAmount / this.totalSet) * 100).toFixed(2),
        })),
      };
    },
    computed: {
      totalPercentage() {
        return this.editableCategories.reduce((sum, c) => sum + parseFloat(c.percentage), 0);
      },
    },
    methods: {
      calculatedAmount(percent) {
        return (this.editableTotalSet * (percent / 100)).toFixed(2);
      },
      updateAmounts() {
        this.editableCategories.forEach((category) => {
          category.setAmount = parseFloat(this.calculatedAmount(category.percentage));
        });
      },
      confirmGoals() {
        const updated = this.editableCategories.map((c) => ({
          ...c,
          setAmount: parseFloat(this.calculatedAmount(c.percentage)),
          amount: c.amount || 0,
        }));
        this.$emit("updateGoals", {
          categories: updated,
          goalAmount: this.editableTotalSet,
        });
      },
    },
};
</script>
  
<style scoped>
.goal-setter-modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.3);
    display: flex;
    justify-content: center;
    align-items: center;
}
  
.goal-setter {
    background: white;
    padding: 20px 40px;
    border-radius: 12px;
    width: 550px;
    text-align: center;
  }
  
  .goal-setter h2 {
    background-color: #3d5538;
    color: white;
    padding: 15px;
    border-radius: 12px 12px 0 0;
    margin-top: -20px;
    margin-left: -40px;
    margin-right: -40px;
}
  
.goal-setter p {
    margin: 20px 0;
    font-size: 16px;
    font-weight: 500;
}
  
.goal-setter input[type="number"] {
    width: 80px;
    padding: 4px 6px;
    border: 1px solid #ccc;
    border-radius: 6px;
    font-size: 14px;
}
  
.goal-list {
    background-color: #dbc49d;
    padding: 20px;
    border-radius: 10px;
    margin-top: 10px;
}
  
.goal-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 12px;
    font-size: 16px;
}
  
.total-row {
    font-weight: bold;
}
  
.buttons {
    display: flex;
    justify-content: space-around;
    margin-top: 20px;
}
  
button {
    padding: 10px 30px;
    border-radius: 6px;
    font-weight: bold;
    font-size: 14px;
    border: none;
    cursor: pointer;
}
  
button.cancel {
    background-color: #e8a29e;
    color: white;
    box-shadow: 2px 2px 0 #888888;
}
  
button.confirm {
    background-color: #bcd3af;
    color: white;
    box-shadow: 2px 2px 0 #888888;
}
  
button:disabled {
    background-color: #ccc;
    cursor: not-allowed;
}
</style>