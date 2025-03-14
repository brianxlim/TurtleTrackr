<template>
    <div class="p-6">
      <h1 class="text-2xl font-bold mb-4">Expense History</h1>
      <AllExpenses />
    </div>
  </template>
  
  <script>
  import AllExpenses from "@/components/TransactionTable.vue"; // Adjust path if needed
  
  export default {
    components: {
      AllExpenses,
    },
  };
  </script>
  