<template>
    <div :class="['expense-card', categoryClass]">
        <div class="expense-header">
            <h3 class="expense-title">{{ expense.Title }}</h3>
            <span class="expense-amount">SGD {{ formatAmount(expense.Amount) }}</span>
        </div>
        <p class="expense-date">{{ formatDate(expense.Date) }}</p>
    </div>
</template>
  
<script>
export default {
    props: {
        expense: Object,
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
  padding-bottom: 0px; /* Reduce space below title */
  line-height: 1.2; /* Bring title and date closer */
}

.expense-title {
    flex-grow: 1;
    margin-right: 8px;
    margin-top:3px
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
    background: var( --color-category-others);
}

.pink-card {
    background:var(--color-category-shopping);
}

.purple-card {
    background: var(--color-category-travel);
}

.default-card {
    background: #696969;
}</style>
  