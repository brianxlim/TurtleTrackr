<template>
  <div class="p-6">
    <h1 class="historyHeading">Spending History</h1>
    <ExpenseList />
  </div>
</template>
  
<script>
import ExpenseList from "@/components/ExpenseList.vue"; // Adjust path if needed

export default {
  components: {
    ExpenseList,
  },
};
</script>

<style>
.historyHeading {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  margin-left: 10px;
}</style>
  