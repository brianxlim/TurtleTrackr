<template>
  <div class="expense-list">
    <div class="sort-options">
      <label for="sortBy">Sort by:</label>
      <select v-model="sortOption" @change="sortExpenses">
        <option value="date-desc">Date (Newest to Oldest)</option>
        <option value="date-asc">Date (Oldest to Newest)</option>
        <option value="amount-desc">Amount (Highest to Lowest)</option>
        <option value="amount-asc">Amount (Lowest to Highest)</option>
      </select>
    </div>

    <div v-if="expenses.length === 0" class="no-history">
      No history available. Start adding your expenses now!
    </div>

    <div v-else>
      <!-- If sorting by amount, don't group by date, just show all expenses in one list -->
      <div v-if="sortOption.includes('amount')">
        <ExpenseCard v-for="(expense, index) in expenses" :key="index" :expense="expense" @delete-expense="deleteExpense"
          @edit-expense="openModalForEditing" />
      </div>

      <!-- Grouped expenses by date (only when not sorting by amount) -->
      <div v-else>
        <div v-for="(group, date) in groupedExpenses" :key="date" class="date-group">
          <h2 class="date-header">{{ formatDate(date) }}</h2>
          <ExpenseCard v-for="(expense, index) in group" :key="index" :expense="expense" @delete-expense="deleteExpense"
            @edit-expense="openModalForEditing" />
        </div>
      </div>
    </div>
  </div>

  <!-- Modal -->
  <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <form id="expense-form">
        <!-- First Row: Title -->
        <div class="form-group">
          <label for="title">Title*</label>
          <input type="text" id="title" v-model="formData.title" required>
        </div>

        <!-- Second Row: Amount & Date -->
        <div class="form-row">
          <div class="form-group">
            <label for="amount">Amount*</label>
            <input type="text" id="amount" v-model="formData.amount" required>
          </div>
          <div class="form-group">
            <label for="date">Date*</label>
            <input type="date" id="date" v-model="formData.date" :max="maxDate" required>
          </div>
        </div>

        <!-- Third Row: Category & Send Highlights -->
        <div class="form-row">
          <div class="form-group">
            <label for="category">Category*</label>
            <select id="category" v-model="formData.category" required>
              <option value="" disabled></option>
              <option value="Food">Food</option>
              <option value="Travel">Travel</option>
              <option value="Shopping">Shopping</option>
              <option value="Others">Others</option>
            </select>
          </div>
          <div class="form-group">
            <label for="highlights">Send Highlights to:</label>
            <input type="text" id="highlights" v-model="formData.highlights" placeholder="Optional">
          </div>
        </div>

        <!-- Buttons -->
        <div class="button-group">
          <button class="add-expense" id="saveButton" @click.prevent="savetofs()">Add</button>
          <button @click="closeModal" class="close-button">Cancel</button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import ExpenseCard from "./ExpenseCard.vue";
import { collection, getDocs, query, orderBy, deleteDoc, doc, addDoc, updateDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { auth } from "@/firebase";
import { onAuthStateChanged } from "firebase/auth";

export default {
  components: { ExpenseCard },
  data() {
    const today = new Date().toISOString().split("T")[0]; // Get today's date in YYYY-MM-DD format
    return {
      expenses: [],
      user: null,
      isModalOpen: false,
      sortOption: "date-desc", // Default sorting option
      formData: {
        id: "",
        title: "",
        amount: "",
        date: "",
        category: "",
        highlights: "",
      },
      maxDate: today,
    };
  },
  computed: {
    groupedExpenses() {
      // Group expenses by date only when sorting by date
      if (this.sortOption.includes("amount")) return {}; // No grouping if sorting by amount

      const grouped = this.expenses.reduce((acc, expense) => {
        const date = expense.Date.split("T")[0]; // Extract YYYY-MM-DD
        if (!acc[date]) acc[date] = [];
        acc[date].push(expense);
        return acc;
      }, {});

      return grouped;
    },
  },
  async mounted() {
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
          orderBy("Date", "desc")
        );
        const snapshot = await getDocs(q);
        this.expenses = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
        this.sortExpenses(); // Apply sorting after data is fetched
      } catch (error) {
        console.error("Error fetching expenses:", error);
      }
    },
    sortExpenses() {
      switch (this.sortOption) {
        case "date-asc":
          this.expenses.sort((a, b) => new Date(a.Date) - new Date(b.Date));
          break;
        case "date-desc":
          this.expenses.sort((a, b) => new Date(b.Date) - new Date(a.Date));
          break;
        case "amount-asc":
          this.expenses.sort((a, b) => a.Amount - b.Amount);
          break;
        case "amount-desc":
          this.expenses.sort((a, b) => b.Amount - a.Amount);
          break;
        default:
          break;
      }
    },
    validateForm() {
      // Check if all required fields are filled out
      if (!this.formData.title || !this.formData.amount || !this.formData.date || !this.formData.category) {
        alert("Please fill in all required fields: Title, Amount, Date, and Category.");
        return false;
      }

      // Validate amount is a valid number and greater than 0
      const amount = parseFloat(this.formData.amount);
      if (isNaN(amount) || amount <= 0) {
        alert("Please enter a valid amount greater than 0.");
        return false;
      }

      if (this.formData.date > this.maxDate) {
        alert("You cannot log an expense for a future date.");
        return false;
      }

      return true;
    },
    formatDate(date) {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    },
    async deleteExpense(expense) {
      if (!this.user) return;

      if (confirm(`Are you sure you want to delete "${expense.Title}"?`)) {
        try {
          await deleteDoc(doc(db, "Users", this.user.uid, "Expenses", expense.id));
          this.expenses = this.expenses.filter(e => e.id !== expense.id); // Update local state
        } catch (error) {
          console.error("Error deleting expense:", error);
        }
      }
    },
    openModalForEditing(expense) {
      this.formData.id = expense.id || "";
      this.formData.title = expense.Title || "";
      this.formData.amount = expense.Amount || "";
      this.formData.date = expense.Date || "";
      this.formData.category = expense.Category || "";
      this.formData.highlights = expense.Highlights || "";
      this.isModalOpen = true;
    },
    closeModal() {
      this.isModalOpen = false;
      this.resetForm();
    },
    resetForm() {
      this.formData = {
        id: "",
        title: "",
        amount: "",
        date: "",
        category: "",
        highlights: "",
      };
    },
    async savetofs() {
      if (!this.user) {
        alert("Please log in to save the expense.");
        return;
      }
      if (!this.validateForm()) {
        return; // Stop if the form is invalid
      }

      const { id, title, amount, date, category, highlights } = this.formData;

      try {
        if (id) {
          const expenseRef = doc(db, "Users", this.user.uid, "Expenses", id);
          await updateDoc(expenseRef, {
            Title: title,
            Amount: amount,
            Date: date,
            Category: category,
            Highlights: highlights ?? "",
            createdAt: new Date(),
          });
          this.fetchUserExpenses(); // Fetch updated expenses
        } else {
          await addDoc(collection(db, "Users", this.user.uid, "Expenses"), {
            Title: title,
            Amount: amount,
            Date: date,
            Category: category,
            Highlights: highlights ?? "",
            createdAt: new Date(),
          });
          this.fetchUserExpenses(); // Fetch updated expenses
        }
        this.closeModal();
      } catch (error) {
        console.error("Error saving expense:", error);
      }
    }
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

.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-content {
  background: rgb(206, 220, 204);
  padding: 20px;
  border-radius: 10px;
  width: 50%;
  max-width: 800px;
  text-align: left;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 15px;
  border: 2px solid rgb(57, 68, 61);
  box-sizing: border-box;
  overflow-y: auto;
}

.button-group {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 10px;
}

input,
select,
textarea {
  width: 100%;
  padding: 8px;
  font-size: 10px;
  border: 1px solid #ddd;
}


.close-button {
  margin-top: 10px;
  padding: 5px 10px;
  background: #d8c49d;
  color: black;
  border: 2px solid rgb(57, 68, 61);
  cursor: pointer;
}

.add-expense {
  margin-top: 10px;
  padding: 5px 15px;
  background: rgba(254, 243, 220, 255);
  color: black;
  border: 2px solid rgb(57, 68, 61);
  cursor: pointer;
}

.add-expense:hover {
  background-color: rgb(167, 167, 101);
}

.close-button:hover {
  background: #a89a7d;
}

.form-row {
  display: flex;
  justify-content: space-between;
  gap: 10px;
}

.form-group {
  display: flex;
  flex-direction: column;
  flex: 1;
  font-size: large;
}

#title,
#amount,
#date,
#category,
#highlights {
  font-size: 16px;
}

.no-history {
  text-align: center;
  font-size: 18px;
  color: #777;
  margin-top: 20px;
}

.sort-options {
  margin-bottom: 20px;
}

.sort-options label {
  margin-right: 10px;
}

.sort-options select {
  padding: 5px;
}

.sort-options {
  margin-bottom: 20px;

}

.sort-options label {
  margin-right: 10px;
}

.sort-options select {
  padding: 5px;
}
</style>
