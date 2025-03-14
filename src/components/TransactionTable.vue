<template>
    <div>
      <table class="transaction-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Amount</th>
            <th>Date</th>
            <th>Category</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(expense, index) in expenses" :key="index">
            <td>{{ expense.Title }}</td>
            <td>${{ expense.Amount }}</td>
            <td>{{ expense.Date }}</td>
            <td>{{ expense.Category }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </template>
  
  <script>
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/firebase";
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default {
  data() {
    return {
      expenses: [],
      user: null,
    };
  },
  async mounted() {
    console.log("✅ Component mounted!");
    
    const auth = getAuth();
    onAuthStateChanged(auth, async (user) => {
      if (user) {
        this.user = user;
        console.log(`👤 Logged-in user: ${user.uid}`);
        await this.fetchUserExpenses();
      } else {
        console.warn("⚠️ No user logged in");
      }
    });
  },
  methods: {
    async fetchUserExpenses() {
      if (!this.user) return;

      console.log(`🔍 Fetching expenses for user: ${this.user.uid}`);

      try {
        const q = query(collection(db, "Users", this.user.uid, "Expenses"));
        const snapshot = await getDocs(q);
        let userExpenses = [];

        snapshot.forEach((doc) => {
          console.log(`💰 Expense:`, doc.data());
          userExpenses.push({ id: doc.id, ...doc.data() });
        });

        this.expenses = userExpenses;
        console.log("✅ Final expense list:", this.expenses);
      } catch (error) {
        console.error("❌ Error fetching expenses:", error);
      }
    },
  },
};
</script>

<style scoped>
.transaction-table {
  width: 100%;
  border-collapse: collapse;
  margin: 20px 0;
}

.transaction-table th,
.transaction-table td {
  padding: 10px;
  text-align: left;
  border: 1px solid #ddd;
}

.transaction-table th {
  background-color: #f4f4f4;
}

.transaction-table tr:nth-child(even) {
  background-color: #f9f9f9;
}

.transaction-table tr:hover {
  background-color: #f1f1f1;
}
</style>