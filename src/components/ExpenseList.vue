<template>
  <div class="expense-list">
    <!-- Sort Options -->
    <div class="sort-options">
      <label for="sortBy">Sort By:</label>
      <select v-model="sortOption" @change="sortExpenses" class="sort-select">
        <option value="date-desc">Date (Newest to Oldest)</option>
        <option value="date-asc">Date (Oldest to Newest)</option>
        <option value="amount-desc">Amount (Highest to Lowest)</option>
        <option value="amount-asc">Amount (Lowest to Highest)</option>
      </select>
    </div>

    <!-- Loading Indicator -->
    <div v-if="loading" class="loading">
      <i class="pi pi-spin pi-spinner" style="font-size: 1rem"></i>
    </div>

    <!-- Empty State -->
    <div v-if="!loading && expenses.length === 0" class="no-history">
      No history available.
      <span v-if="isUser">Start adding your expenses now!</span>
      <span v-else>This user does not have any expenses.</span>
    </div>

    <!-- Expenses List -->
    <div v-else>
      <!-- Flat List if sorting by amount -->
      <div v-if="sortOption.includes('amount')">
        <ExpenseCard
          v-for="expense in paginatedExpenses"
          :key="expense.id"
          :expense="expense"
          :isUser="isUser"
          @delete-expense="deleteExpense"
          @edit-expense="openModalForEditing"
        />
      </div>

      <!-- Grouped by Date if sorting by date -->
      <div v-else>
        <div
          v-for="(group, date) in paginatedDailyGroupedExpenses"
          :key="date"
          class="date-group"
        >
          <div class="date-header">{{ formatDateHeader(date) }}</div>
          <div class="expense-cards">
            <ExpenseCard
              v-for="expense in group"
              :key="expense.id"
              :expense="expense"
              :is-user="isUser"
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

    <!-- Expense Modal -->
    <div v-if="isModalOpen" class="modal-overlay" @click.self="closeModal">
      <div class="modal-content">
        <!-- Form for Adding/Editing Expense -->
        <form @submit.prevent="saveExpense">
          <!-- Title -->
          <div class="form-group">
            <label for="title">Title*</label>
            <input id="title" v-model="formData.title" required />
          </div>

          <!-- Amount & Date -->
          <div class="form-row">
            <div class="form-group">
              <label for="amount">Amount*</label>
              <input id="amount" v-model="formData.amount" required />
            </div>
            <div class="form-group">
              <label for="date">Date*</label>
              <input id="date" type="date" v-model="formData.date" :max="maxDate" required />
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
              <input id="highlights" v-model="formData.highlights" placeholder="Optional" />
            </div>
          </div>

          <!-- Buttons -->
          <div class="button-group">
            <button type="submit" class="add-expense">Add</button>
            <button type="button" class="close-button" @click="closeModal">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { collection, getDocs, query, orderBy, deleteDoc, doc, addDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase';
import ExpenseCard from './ExpenseCard.vue';

// Props
const props = defineProps({
  uid: { type: String, required: true }
});

// Determine if viewing own expenses
const isUser = computed(() => auth.currentUser?.uid === props.uid);

// Reactive state
const loading = ref(false);
const sortOption = ref('date-desc');
const expenses = ref([]);
const paginatedExpenses = ref([]);
const isModalOpen = ref(false);
const formData = ref({ id: '', title: '', amount: '', date: '', category: '', highlights: '' });
const maxDate = ref(new Date().toISOString().split('T')[0]);
const itemsPerPage = ref(15);
const currentPage = ref(1);

// Computed groupings
const dailyGroupedExpenses = computed(() => {
  return expenses.value.reduce((acc, e) => {
    const d = e.Date.split('T')[0];
    (acc[d] = acc[d] || []).push(e);
    return acc;
  }, {});
});

const paginatedDailyGroupedExpenses = computed(() => {
  const result = {};
  const dates = Object.keys(dailyGroupedExpenses.value).sort((a, b) =>
    sortOption.value === 'date-desc' ? b.localeCompare(a) : a.localeCompare(b)
  );
  let skip = (currentPage.value - 1) * itemsPerPage.value;
  let take = itemsPerPage.value;
  for (const d of dates) {
    if (take <= 0) break;
    const group = dailyGroupedExpenses.value[d];
    if (skip >= group.length) { skip -= group.length; continue; }
    const chunk = group.slice(skip, skip + take);
    result[d] = chunk;
    take -= chunk.length;
    skip = 0;
  }
  return result;
});

const totalPages = computed(() =>
  sortOption.value.includes('amount')
    ? Math.ceil(expenses.value.length / itemsPerPage.value)
    : Math.ceil(expenses.value.length / itemsPerPage.value)
);

// Fetch expenses from Firestore
async function fetchUserExpenses() {
  loading.value = true;
  currentPage.value = 1;
  try {
    const q = query(
      collection(db, 'Users', props.uid, 'Expenses'),
      orderBy('Date', 'desc')
    );
    const snap = await getDocs(q);
    expenses.value = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (err) {
    console.error(err);
  } finally {
    loading.value = false;
    updatePaginatedExpenses();
  }
}

// Sort and paginate
function sortExpenses() {
  const opt = sortOption.value;
  expenses.value.sort((a, b) => {
    if (opt === 'date-asc') return new Date(a.Date) - new Date(b.Date);
    if (opt === 'date-desc') return new Date(b.Date) - new Date(a.Date);
    return opt.includes('asc')
      ? parseFloat(a.Amount) - parseFloat(b.Amount)
      : parseFloat(b.Amount) - parseFloat(a.Amount);
  });
  currentPage.value = 1;
  updatePaginatedExpenses();
}

function updatePaginatedExpenses() {
  if (sortOption.value.includes('amount')) {
    const start = (currentPage.value - 1) * itemsPerPage.value;
    paginatedExpenses.value = expenses.value.slice(start, start + itemsPerPage.value);
  }
}

// CRUD operations
async function deleteExpense(exp) {
  if (!isUser.value) return;
  if (!confirm(`Delete "${exp.Title}"?`)) return;
  try {
    await deleteDoc(doc(db, 'Users', props.uid, 'Expenses', exp.id));
    await fetchUserExpenses();
  } catch (err) {
    console.error(err);
  }
}

function openModalForEditing(exp) {
  formData.value = {
    id: exp.id,
    title: exp.Title,
    amount: exp.Amount,
    date: exp.Date.split('T')[0],
    category: exp.Category,
    highlights: exp.Highlights || ''
  };
  isModalOpen.value = true;
}

function closeModal() {
  isModalOpen.value = false;
  formData.value = { id: '', title: '', amount: '', date: '', category: '', highlights: '' };
}

async function saveExpense() {
  if (!isUser.value) return;
  const f = formData.value;
  if (!f.title || !f.amount || !f.date || !f.category) {
    alert('All fields are required.');
    return;
  }
  try {
    if (f.id) {
      await updateDoc(doc(db, 'Users', props.uid, 'Expenses', f.id), {
        Title: f.title,
        Amount: parseFloat(f.amount),
        Date: f.date,
        Category: f.category,
        Highlights: f.highlights,
        createdAt: new Date()
      });
    } else {
      await addDoc(collection(db, 'Users', props.uid, 'Expenses'), {
        Title: f.title,
        Amount: parseFloat(f.amount),
        Date: f.date,
        Category: f.category,
        Highlights: f.highlights,
        createdAt: new Date()
      });
    }
    await fetchUserExpenses();
    closeModal();
  } catch (err) {
    console.error(err);
  }
}

function formatDateHeader(d) {
  return new Date(d).toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

function changePage(page) {
  if (page < 1 || page > totalPages.value) return;
  currentPage.value = page;
  updatePaginatedExpenses();
}

// Lifecycle
onMounted(fetchUserExpenses);
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
