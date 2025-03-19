<template>
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Spending History</h1>
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
  