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

    <div v-if="loading" class="loading">
      <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
    </div>

    <div v-if="!loading && expenses.length === 0" class="no-history">
      No history available.
      <span v-if="isUser">Start adding your expenses now!</span>
      <span v-else>This user does not have any expenses.</span>
    </div>
    <!-- <div v-else>
          
          <div v-if="sortOption.includes('amount')">
              <ExpenseCard
                  v-for="expense in expenses"
                  :key="expense.id"
                  :expense="expense"
                  @delete-expense="deleteExpense"
                  @edit-expense="openModalForEditing"
              />
          </div>
          
          <div
              v-else
              v-for="(group, date) in groupedExpenses"
              :key="date"
              class="date-group"
          >
              <h2 class="date-header">{{ formatDate(date) }}</h2>
              <ExpenseCard
                  v-for="expense in group"
                  :key="expense.id"
                  :expense="expense"
                  @delete-expense="deleteExpense"
                  @edit-expense="openModalForEditing"
              />
          </div> -->
    <div v-else>
      <div v-if="sortOption.includes('amount')">
        <ExpenseCard v-for="expense in paginatedExpenses" :key="expense.id" :expense="expense"
          @delete-expense="deleteExpense" @edit-expense="openModalForEditing" />
      </div>
      <div v-else>
        <ExpenseCard v-for="expense in paginatedExpenses" :key="expense.id" :expense="expense"
          @delete-expense="deleteExpense" @edit-expense="openModalForEditing" />
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
    groupedExpenses() {
      if (this.sortOption.includes("amount")) {
        return;
      }
      return this.expenses.reduce((acc, expense) => {
        const date = expense.Date.split("T")[0];
        if (!acc[date]) {
          acc[date] = [];
        }
        acc[date].push(expense);
        return acc;
      }, {});
    },
    totalPages() {
      const totalItems = this.sortOption.includes("amount")
        ? this.expenses.length
        : Object.values(this.groupedExpenses).flat().length;
      console.log("Total items:", totalItems);
      return Math.ceil(totalItems / this.itemsPerPage);
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
        this.updatePaginatedExpenses(); // Make sure this is called
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
          this.expenses.sort((a, b) => a.Amount - b.Amount);
          break;
        case "amount-desc":
          this.expenses.sort((a, b) => b.Amount - a.Amount);
          break;
        default:
          break;
      }
      this.currentPage = 1; // Reset to first page when sorting changes
      this.updatePaginatedExpenses();
    },

    updatePaginatedExpenses() {
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;

      console.log("Slicing items from", start, "to", end); // Debug log to check slice range

      if (this.sortOption.includes("amount")) {
        this.paginatedExpenses = this.expenses.slice(start, end); // Slice the sorted expenses based on currentPage
      } else {
        const allGroupedExpenses = Object.values(this.groupedExpenses).flat();
        this.paginatedExpenses = allGroupedExpenses.slice(start, end); // Slice the grouped expenses based on currentPage
      }

      console.log("Updated Paginated Expenses:", this.paginatedExpenses);
    },

    async deleteExpense(expense) {
      if (!this.uid) return;
      if (confirm(`Are you sure you want to delete "${expense.Title}"?`)) {
        console.log("Deleting expense:", expense);
        try {
          await deleteDoc(doc(db, "Users", this.uid, "Expenses", expense.id));
          this.expenses = this.expenses.filter((e) => e.id !== expense.id);

          // Re-fetch expenses to refresh the list
          await this.fetchUserExpenses(); // Ensure the expenses list is up to date.
          console.log("Expense deleted. Updated Expenses:", this.expenses);
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
        date: expense.Date || "",
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
            Amount: amount,
            Date: date,
            Category: category,
            Highlights: highlights ?? "",
            createdAt: new Date(),
          });
        } else {
          await addDoc(collection(db, "Users", this.uid, "Expenses"), {
            Title: title,
            Amount: amount,
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

    formatDate(date) {
      return new Date(date).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    },

    changePage(newPage) {
      if (newPage > 0 && newPage <= this.totalPages) {
        this.currentPage = newPage;
        this.updatePaginatedExpenses();
        console.log("Changed to Page:", this.currentPage);
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
