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

      <div v-else>
          <!-- When sorting by amount, display a flat list -->
          <div v-if="sortOption.includes('amount')">
              <ExpenseCard
                  v-for="expense in expenses"
                  :key="expense.id"
                  :expense="expense"
                  @delete-expense="deleteExpense"
                  @edit-expense="openModalForEditing"
              />
          </div>
          <!-- Otherwise, group expenses by date -->
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
          </div>
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
                      <input
                          type="date"
                          id="date"
                          v-model="formData.date"
                          :max="maxDate"
                          required
                      />
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
                      <input
                          type="text"
                          id="highlights"
                          v-model="formData.highlights"
                          placeholder="Optional"
                      />
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

<script setup>
import { ref, computed, onMounted, watch } from "vue";
import ExpenseCard from "./ExpenseCard.vue";
import {
  collection,
  getDocs,
  query,
  orderBy,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/firebase";
import { auth } from "@/firebase";

const props = defineProps({
  uid: {
      type: String,
      required: true,
  },
});

const loading = ref(false);
const isUser = ref(props.uid == auth.currentUser.uid);
const sortOption = ref("date-desc");
const expenses = ref([]);
const isModalOpen = ref(false);
const formData = ref({
  id: "",
  title: "",
  amount: "",
  date: "",
  category: "",
  highlights: "",
});
const today = new Date().toISOString().split("T")[0];
const maxDate = ref(today);

// Group expenses by date (only when not sorting by amount)
const groupedExpenses = computed(() => {
  if (sortOption.value.includes("amount")) {
    return;
  };

  return expenses.value.reduce((acc, expense) => {
      const date = expense.Date.split("T")[0];
      if (!acc[date]) {
          acc[date] = [];
      }
      acc[date].push(expense);
      return acc;
  }, {});
});

// Fetch expenses for the user specified by props.uid
const fetchUserExpenses = async () => {
  loading.value = true;
  try {
      const q = query(
          collection(db, "Users", props.uid, "Expenses"),
          orderBy("Date", "desc")
      );
      const snapshot = await getDocs(q);
      expenses.value = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
      }));
      sortExpenses();
  } catch (error) {
      console.error("Error fetching expenses:", error);
  } finally {
    loading.value = false;
  }
};

const sortExpenses = () => {
  switch (sortOption.value) {
  case "date-asc":
      expenses.value.sort((a, b) => new Date(a.Date) - new Date(b.Date));
      break;
  case "date-desc":
      expenses.value.sort((a, b) => new Date(b.Date) - new Date(a.Date));
      break;
  case "amount-asc":
      expenses.value.sort((a, b) => a.Amount - b.Amount);
      console.log(expenses);
      break;
  case "amount-desc":
      expenses.value.sort((a, b) => b.Amount - a.Amount);
      console.log(expenses);
      break;
  default:
      break;
  }
};

const deleteExpense = async (expense) => {
  if (!props.uid) return;
  if (confirm(`Are you sure you want to delete "${expense.Title}"?`)) {
      try {
          await deleteDoc(doc(db, "Users", props.uid, "Expenses", expense.id));
          expenses.value = expenses.value.filter((e) => e.id !== expense.id);
      } catch (error) {
          console.error("Error deleting expense:", error);
      }
  }
};

const openModalForEditing = (expense) => {
  formData.value = {
  id: expense.id || "",
  title: expense.Title || "",
  amount: expense.Amount || "",
  date: expense.Date || "",
  category: expense.Category || "",
  highlights: expense.Highlights || "",
  };
  isModalOpen.value = true;
};

const closeModal = () => {
  isModalOpen.value = false;
  resetForm();
};

const resetForm = () => {
  formData.value = {
      id: "",
      title: "",
      amount: "",
      date: "",
      category: "",
      highlights: "",
  };
};

const validateForm = () => {
  if (
      !formData.value.title ||
      !formData.value.amount ||
      !formData.value.date ||
      !formData.value.category
  ) {
      alert("Please fill in all required fields: Title, Amount, Date, and Category.");
      return false;
  }

  const amt = parseFloat(formData.value.amount);
  if (isNaN(amt) || amt <= 0) {
      alert("Please enter a valid amount greater than 0.");
      return false;
  }
  if (formData.value.date > maxDate.value) {
      alert("You cannot log an expense for a future date.");
      return false;
  }
  return true;
};

const saveExpense = async () => {
  if (!props.uid) return;
  if (!validateForm()) return;
  const { id, title, amount, date, category, highlights } = formData.value;
  try {
      if (id) {
          const expenseRef = doc(db, "Users", props.uid, "Expenses", id);
          await updateDoc(expenseRef, {
          Title: title,
          Amount: amount,
          Date: date,
          Category: category,
          Highlights: highlights ?? "",
          createdAt: new Date(),
          });
      } else {
          await addDoc(collection(db, "Users", props.uid, "Expenses"), {
          Title: title,
          Amount: amount,
          Date: date,
          Category: category,
          Highlights: highlights ?? "",
          createdAt: new Date(),
          });
      }
      await fetchUserExpenses();
      closeModal();
  } catch (error) {
      console.error("Error saving expense:", error);
  }
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
  });
};

onMounted(() => {
  fetchUserExpenses();
});

watch(sortOption, () => {
  sortExpenses();
});
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
</style>
