<template>
    <div class="expense-list">
      <div v-for="(group, date) in groupedExpenses" :key="date" class="date-group">
        <h2 class="date-header">{{ formatDate(date) }}</h2>
        <ExpenseCard v-for="(expense, index) in group" :key="index" :expense="expense" />
      </div>
    </div>
  </template>
  
  <script>
  import ExpenseCard from "./ExpenseCard.vue";
  import { collection, getDocs, query, orderBy } from "firebase/firestore";
  import { db } from "@/firebase";
  import { getAuth, onAuthStateChanged } from "firebase/auth";
  
  export default {
    components: { ExpenseCard },
    data() {
      return {
        expenses: [],
        user: null,
      };
    },
    computed: {
      groupedExpenses() {
        return this.expenses.reduce((acc, expense) => {
          const date = expense.Date.split("T")[0]; // Extract YYYY-MM-DD
          if (!acc[date]) acc[date] = [];
          acc[date].push(expense);
          return acc;
        }, {});
      },
    },
    async mounted() {
      const auth = getAuth();
      onAuthStateChanged(auth, async (user) => {
        if (user) {
          this.user = user;
          await this.fetchUserExpenses();
        }
      });
    },
    methods: {
      async fetchUserExpenses() {
        if (!this.user) return;
        try {
          const q = query(
            collection(db, "Users", this.user.uid, "Expenses"),
            orderBy("Date", "desc"),
            orderBy("createdAt", "desc")
          );
          const snapshot = await getDocs(q);
          this.expenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        } catch (error) {
          console.error("❌ Error fetching expenses:", error);
        }
      },
      formatDate(date) {
        return new Date(date).toLocaleDateString("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        });
      },
    },
  };
  </script>
  
  <style scoped>
  .expense-list {
    padding: 10px;
  }
  
  .date-group {
    margin-bottom: 15px;
  }
  
  .date-header {
    font-size: 14px;
    font-weight: bold;
    color: #555;
    margin-bottom: 5px;
    padding-left: 10px;
  }
  </style>
  