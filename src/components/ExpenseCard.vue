<template>
    <div :class="['expense-card', categoryClass]">
        <div class="expense-header">
            <h3 class="expense-title">{{ expense.Title }}</h3>
            <span class="expense-amount">SGD {{ formatAmount(expense.Amount) }} <button @click.stop="toggleMenu" ref="menuButton" class="options-btn">></button>
            </span>
        </div>
        <p class="expense-date">{{ formatDate(expense.Date) }}</p>
        <div v-if="showMenu" class="dropdown-menu" :style="menuStyle" @click.stop>
            <button @click="openModalForEditing">Edit</button>
            <button @click="deleteExpense">Delete</button>
        </div>
    </div>
</template>
  
<script>
export default {
    props: {
        expense: Object,
    },
    data() {
        return {
            showMenu: false,
        };
    },
    computed: {
        categoryClass() {
            const categoryColors = {
                Food: "blue-card",
                Travel: "purple-card",
                Shopping: "pink-card",
                Others: "green-card",
            };
            return categoryColors[this.expense.Category] || "default-card";
        },
    },
    methods: {
        formatDate(date) {
            return new Date(date).toLocaleDateString("en-US", {
                day: "numeric",
                month: "long",
                year: "numeric",
            });
        },
        formatAmount(amount) {
            if (typeof amount !== "number") {
                amount = parseFloat(amount) || 0;
            }
            return amount.toFixed(2);
        },
        toggleMenu() {
            this.showMenu = !this.showMenu;
        },
        openModalForEditing() {
            this.$emit("edit-expense", this.expense);
            this.showMenu = false;
        },
        deleteExpense() {
            this.$emit("delete-expense", this.expense);
            this.showMenu = false;
        },
    },
};
</script>
  
<style scoped>
.expense-card {
    padding: 6px 12px;
    border-radius: 8px;
    margin: 6px 0;
    color: black;
    height: auto;
}

.expense-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    font-weight: bold;
    padding-bottom: 0px;
    /* Reduce space below title */
    line-height: 1.2;
    /* Bring title and date closer */
}

.expense-title {
    flex-grow: 1;
    margin-right: 8px;
    margin-top: 3px
}

.expense-amount {
    text-align: right;
    font-weight: bold;
}

.expense-date {
    font-size: 12px;
    opacity: 0.8;
    margin-top: -22px;
    margin-bottom: 3px;

}

/* Background colors */
.blue-card {
    background: var(--color-category-food);
}

.green-card {
    background: var(--color-category-others);
}

.pink-card {
    background: var(--color-category-shopping);
}

.purple-card {
    background: var(--color-category-travel);
}

.default-card {
    background: #696969;
}

.options-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  cursor: pointer;
  padding: 5px;
  position: relative;
}

.dropdown-menu {
  position: absolute;
  background: white;
  border: 1px solid #ddd;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  border-radius: 5px;
  z-index: 10;
  padding: 5px;
  display: flex;
  flex-direction: column;
  right: 0%;
}

.dropdown-menu button {
  background: none;
  border: none;
  padding: 8px;
  text-align: left;
  width: 100%;
  cursor: pointer;
}

.dropdown-menu button:hover {
  background: #f0f0f0;
}</style>
  