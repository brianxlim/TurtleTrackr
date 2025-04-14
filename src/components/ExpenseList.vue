<template>
  <div class="expense-list">
    
    <div class="sort-options">
      <label for="sortBy">Sort By:</label>
      <select v-model="sortOption" @change="sortExpenses" class="sort-select">
        <option value="date-desc">Date (Newest to Oldest)</option>
        <option value="date-asc">Date (Oldest to Newest)</option>
        <option value="amount-desc">Amount (Highest to Lowest)</option>
        <option value="amount-asc">Amount (Lowest to Highest)</option>
      </select>
    </div>

    <div v-if="loading" class="loading">
      <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
    </div>

    <div v-if="!loading && expenses.length === 0" class="no-history">
      No history available.
      <span v-if="isUser">Start adding your expenses now!</span>
      <span v-else>This user does not have any expenses.</span>
    </div>
    
    <div v-else>
      <!-- When sorting by amount, show flat list -->
      <div v-if="sortOption.includes('amount')">
        <ExpenseCard 
          v-for="expense in paginatedExpenses" 
          :key="expense.id" 
          :expense="expense"
          @delete-expense="deleteExpense" 
          @edit-expense="openModalForEditing" 
        />
      </div>
      
      <!-- When sorting by date, show with daily grouping -->
      <div v-else>
        <div v-for="(dateGroup, date) in paginatedDailyGroupedExpenses" :key="date" class="date-group">
          <div class="date-header">{{ formatDateHeader(date) }}</div>
          
          <div class="expense-cards">
            <ExpenseCard
              v-for="expense in dateGroup"
              :key="expense.id"
              :expense="expense"
              @delete-expense="deleteExpense"
              @edit-expense="openModalForEditing"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Pagination Controls -->
    <div v-if="totalPages > 1" class="pagination">
      <button @click="changePage(currentPage - 1)" :disabled="currentPage === 1">Prev</button>
      <span>Page {{ currentPage }} of {{ totalPages }}</span>
      <button @click="changePage(currentPage + 1)" :disabled="currentPage === totalPages">Next</button>
    </div>
  </div>

  <!-- Expense Modal -->
  <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <form @submit.prevent="saveExpense">
        <!-- Title -->
        <div class="form-group">
          <label for="title">Title*</label>
          <input type="text" id="title" v-model="formData.title" required />
        </div>

        <!-- Amount & Date -->
        <div class="form-row">
          <div class="form-group">
            <label for="amount">Amount*</label>
            <input type="text" id="amount" v-model="formData.amount" required />
          </div>
          <div class="form-group">
            <label for="date">Date*</label>
            <input type="date" id="date" v-model="formData.date" :max="maxDate" required />
          </div>
        </div>

        <!-- Category & Highlights -->
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
            <input type="text" id="highlights" v-model="formData.highlights" placeholder="Optional" />
          </div>
        </div>

        <!-- Buttons -->
        <div class="button-group">
          <button type="submit" class="add-expense">Add</button>
          <button type="button" @click="closeModal" class="close-button">
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script>
import { collection, getDocs, query, orderBy, deleteDoc, doc, addDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/firebase";
import ExpenseCard from "./ExpenseCard.vue";

export default {
  components: {
    ExpenseCard
  },
  props: {
    uid: {
      type: String,
      required: true,
    },
  },
  data() {
    return {
      loading: false,
      isUser: this.uid === auth.currentUser.uid,
      sortOption: "date-desc",
      expenses: [], // All fetched expenses
      paginatedExpenses: [], // Paginated expenses for current page
      isModalOpen: false,
      formData: {
        id: "",
        title: "",
        amount: "",
        date: "",
        category: "",
        highlights: "",
      },
      today: new Date().toISOString().split("T")[0],
      maxDate: this.today,
      itemsPerPage: 15, // Number of items per page
      currentPage: 1, // Current page number
    };
  },
  computed: {
    // Group expenses by date
    dailyGroupedExpenses() {
      return this.expenses.reduce((acc, expense) => {
        const date = expense.Date.split("T")[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(expense);
        return acc;
      }, {});
    },
    
    // Paginated daily grouped expenses
    paginatedDailyGroupedExpenses() {
      // Create an object to hold paginated groups
      const result = {};
      
      // Get dates in order of current sort option
      let dates = Object.keys(this.dailyGroupedExpenses);
      if (this.sortOption === 'date-desc') {
        dates.sort((a, b) => b.localeCompare(a));
      } else {
        dates.sort((a, b) => a.localeCompare(b));
      }
      
      let itemsToSkip = (this.currentPage - 1) * this.itemsPerPage;
      let itemsToTake = this.itemsPerPage;
      let itemsAdded = 0;
      
      // Process each date
      for (const date of dates) {
        if (itemsToTake <= 0) break;
        
        const expenses = this.dailyGroupedExpenses[date];
        
        // Skip expenses if needed for pagination
        if (itemsToSkip >= expenses.length) {
          itemsToSkip -= expenses.length;
          continue;
        }
        
        // Add partial or complete date group
        if (itemsToSkip > 0) {
          // Take a slice of the expenses
          result[date] = expenses.slice(itemsToSkip);
          itemsAdded += (expenses.length - itemsToSkip);
          itemsToTake -= (expenses.length - itemsToSkip);
          itemsToSkip = 0;
        } else {
          // Take all expenses for this date or what's left for the page
          const toTake = Math.min(expenses.length, itemsToTake);
          result[date] = expenses.slice(0, toTake);
          itemsAdded += toTake;
          itemsToTake -= toTake;
        }
      }
      
      return result;
    },
    
    totalPages() {
      if (this.sortOption.includes('amount')) {
        return Math.ceil(this.expenses.length / this.itemsPerPage);
      } else {
        // Count total expenses across all groups
        const totalItems = this.expenses.length;
        return Math.ceil(totalItems / this.itemsPerPage);
      }
    },
  },
  watch: {
    expenses: "updatePaginatedExpenses",
    currentPage: "updatePaginatedExpenses",
    sortOption: "sortExpenses",
  },
  methods: {
    async fetchUserExpenses() {
      this.loading = true;
      this.currentPage = 1; // Reset to first page when fetching expenses
      try {
        const q = query(
          collection(db, "Users", this.uid, "Expenses"),
          orderBy("Date", "desc")
        );
        const snapshot = await getDocs(q);
        this.expenses = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        console.log("Fetched Expenses:", this.expenses);
        this.updatePaginatedExpenses();
        this.sortExpenses();
      } catch (error) {
        console.error("Error fetching expenses:", error);
      } finally {
        this.loading = false;
      }
    },

    sortExpenses() {
      console.log("Sorting Expenses by:", this.sortOption);
      switch (this.sortOption) {
        case "date-asc":
          this.expenses.sort((a, b) => new Date(a.Date) - new Date(b.Date));
          break;
        case "date-desc":
          this.expenses.sort((a, b) => new Date(b.Date) - new Date(a.Date));
          break;
        case "amount-asc":
          this.expenses.sort((a, b) => parseFloat(a.Amount) - parseFloat(b.Amount));
          break;
        case "amount-desc":
          this.expenses.sort((a, b) => parseFloat(b.Amount) - parseFloat(a.Amount));
          break;
        default:
          break;
      }
      this.currentPage = 1; // Reset to first page when sorting changes
      this.updatePaginatedExpenses();
    },

    updatePaginatedExpenses() {
      if (this.sortOption.includes("amount")) {
        const start = (this.currentPage - 1) * this.itemsPerPage;
        const end = start + this.itemsPerPage;
        this.paginatedExpenses = this.expenses.slice(start, end);
      }
      // For date grouping, we use the computed paginatedDailyGroupedExpenses
    },

    async deleteExpense(expense) {
      if (!this.uid) return;
      if (confirm(`Are you sure you want to delete "${expense.Title}"?`)) {
        console.log("Deleting expense:", expense);
        try {
          await deleteDoc(doc(db, "Users", this.uid, "Expenses", expense.id));
          this.expenses = this.expenses.filter((e) => e.id !== expense.id);

          // Re-fetch expenses to refresh the list
          await this.fetchUserExpenses();
        } catch (error) {
          console.error("Error deleting expense:", error);
        }
      }
    },

    openModalForEditing(expense) {
      this.formData = {
        id: expense.id || "",
        title: expense.Title || "",
        amount: expense.Amount || "",
        date: expense.Date ? expense.Date.split("T")[0] : "",
        category: expense.Category || "",
        highlights: expense.Highlights || "",
      };
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

    validateForm() {
      if (
        !this.formData.title ||
        !this.formData.amount ||
        !this.formData.date ||
        !this.formData.category
      ) {
        alert("Please fill in all required fields: Title, Amount, Date, and Category.");
        return false;
      }

      const amt = parseFloat(this.formData.amount);
      if (isNaN(amt) || amt <= 0) {
        alert("Please enter a valid amount greater than 0.");
        return false;
      }
      if (this.formData.date > this.maxDate) {
        alert("You cannot log an expense for a future date.");
        return false;
      }
      return true;
    },

    async saveExpense() {
      if (!this.uid) return;
      if (!this.validateForm()) return;

      const { id, title, amount, date, category, highlights } = this.formData;
      try {
        console.log("Saving Expense:", { id, title, amount, date, category, highlights });
        if (id) {
          const expenseRef = doc(db, "Users", this.uid, "Expenses", id);
          await updateDoc(expenseRef, {
            Title: title,
            Amount: parseFloat(amount),
            Date: date,
            Category: category,
            Highlights: highlights ?? "",
            createdAt: new Date(),
          });
        } else {
          await addDoc(collection(db, "Users", this.uid, "Expenses"), {
            Title: title,
            Amount: parseFloat(amount),
            Date: date,
            Category: category,
            Highlights: highlights ?? "",
            createdAt: new Date(),
          });
        }
        console.log("Expense saved successfully.");
        await this.fetchUserExpenses();
        this.closeModal();
      } catch (error) {
        console.error("Error saving expense:", error);
      }
    },

    formatDateHeader(date) {
      const dateObj = new Date(date);
      return dateObj.toLocaleDateString("en-US", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
      });
    },

    changePage(newPage) {
      if (newPage > 0 && newPage <= this.totalPages) {
        this.currentPage = newPage;
        this.updatePaginatedExpenses();
      }
    },
  },
  mounted() {
    this.fetchUserExpenses();
  },
};
</script>


<style scoped>
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
}

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

.pagination {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.pagination button {
  padding: 5px 10px;
  margin: 0 5px;
  background: #d8c49d;
  color: black;
  border: none;
  cursor: pointer;
  border-radius: 8px;

}
</style>
