<template>
  <div class="expense-list">
    <div v-for="(group, date) in groupedExpenses" :key="date" class="date-group">
      <h2 class="date-header">{{ formatDate(date) }}</h2>
      <ExpenseCard v-for="(expense, index) in group" :key="index" :expense="expense" @delete-expense="deleteExpense"
        @edit-expense="openModalForEditing" />
    </div>
  </div>

  <!-- Modal -->
  <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <form id="expense-form">
        <!-- Form content here -->
        <div class="form-group">
          <label for="title">Title*</label>
          <input type="text" id="title" v-model="formData.title" required />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label for="amount">Amount*</label>
            <input type="text" id="amount" v-model="formData.amount" required />
          </div>
          <div class="form-group">
            <label for="date">Date*</label>
            <input type="date" id="date" v-model="formData.date" required />
          </div>
        </div>
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
            <input type="text" id="highlights" v-model="formData.highlights" placeholder="None" />
          </div>
        </div>
        <div class="button-group">
          <button class="add-expense" id="saveButton" @click.prevent="savetofs()">Save</button>
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
import { getAuth, onAuthStateChanged } from "firebase/auth";

export default {
  components: { ExpenseCard },
  data() {
    return {
      expenses: [],
      user: null,
      isModalOpen: false,
      formData: {
        id: "",
        title: "",
        amount: "",
        date: "",
        category: "",
        highlights: "",
      },
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
    async deleteExpense(expense) {
      if (!this.user) return;

      if (confirm(`Are you sure you want to delete "${expense.Title}"?`)) {
        try {
          await deleteDoc(doc(db, "Users", this.user.uid, "Expenses", expense.id));
          console.log(`✅ Expense "${expense.Title}" deleted successfully.`);

          // Remove from local state
          this.expenses = this.expenses.filter(e => e.id !== expense.id);
        } catch (error) {
          console.error("❌ Error deleting expense:", error);
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
      const user = getAuth().currentUser;
      if (!user) {
        alert("Please log in to save the expense.");
        return;
      }

      const { id, title, amount, date, category, highlights } = this.formData;

      try {
        if (id) {
          // Update existing expense without overwriting unchanged fields
          const expenseRef = doc(db, "Users", user.uid, "Expenses", id);
          await updateDoc(expenseRef, {
            ...(title && { Title: title }),
            ...(amount && { Amount: amount }),
            ...(date && { Date: date }),
            ...(category && { Category: category }),
            ...(highlights !== undefined ? { Highlights: highlights } : {}), // Ensure no undefined values
            createdAt: new Date(),
          });
          console.log("✅ Expense updated successfully!");
        } else {
          // Add new expense
          await addDoc(collection(db, "Users", user.uid, "Expenses"), {
            Title: title,
            Amount: amount,
            Date: date,
            Category: category,
            Highlights: highlights ?? "",
            createdAt: new Date(),
          });
        }
        this.closeModal();
        window.location.reload(); // Refresh the page after saving
        console.log("✅ Expense added successfully!");
      } catch (error) {
        console.error("❌ Error saving expense:", error);
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

.button-group {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
  gap: 10px;
}
</style>
