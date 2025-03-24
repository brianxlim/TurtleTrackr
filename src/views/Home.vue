<template>
    <div class="dashboard">
        <div class="content">
            <PieChart :totalAmount="totalAmount" :categories="categories" />
            <Breakdown :categories="categories" />
        </div>
        <AddButton @refresh-data="loadExpenses" />
    </div>
</template>

<script>
import PieChart from "@/components/PieChart.vue";
import Breakdown from "@/components/Breakdown.vue";
import NavBar from "@/components/NavBar/NavBar.vue";
import AddButton from "@/components/AddButton.vue";
import { db, auth } from '@/firebase.js';
import { collection, addDoc, getDocs } from "firebase/firestore";

export default {
    components: {
        PieChart,
        Breakdown,
        NavBar,
        AddButton,
    },
    data() {
        return {
            totalAmount: 0,
            categories: [
                { name: "Food", amount: 0, color: "#6F9BD1" },
                { name: "Travel", amount: 0, color: "#B394C6" },
                { name: "Shopping", amount: 0, color: "#E08E99" },
                { name: "Others", amount: 0, color: "#96BE8C" },
            ],
        };
    },
    async mounted() {
        console.log('trying to call loadexpeses()')
        await this.loadExpenses();
    },
    methods: {
        async loadExpenses() {
            try {
                const user = auth.currentUser;
                if (!user) {
                    console.error("NO USER LOGGIN IN!");
                    return;
                }
                console.log('trying to fetch expense history')
                const userExpenseRef = collection(db, "Users", auth.currentUser.uid, "Expenses");
                console.log('successfully fetched')
                console.log('trying to read the expenses')
                const ExpensesRecords = await getDocs(userExpenseRef);
                console.log('successfully read')
                let expenses = [];
                ExpensesRecords.forEach((doc) => {
                    expenses.push({ id: doc.id, ...doc.data() });
                });
                console.log('successfully pushed')
                this.processExpenses(expenses);
            } catch (error) {
                console.error("error fetching expenses");
            }

        },
        processExpenses(expenses) {
            let total = 0;
            let categoryMap = {
                "Food": 0,
                "Travel": 0,
                "Shopping": 0,
                "Others": 0
            };
            //this is to add up amounts in diff categories
            expenses.forEach(expense => {
                const amount = parseFloat(expense.Amount) || 0
                total += amount;
                if (categoryMap.hasOwnProperty(expense.Category)) {
                    categoryMap[expense.Category] += amount;
                } else {
                    categoryMap["Others"] += amount;
                }
            });
            console.log('trying to fetch spending data')
            console.log('updating spending history')
            this.totalAmount = total;
            this.categories = [
                { name: "Food", amount: categoryMap["Food"], color: "#6F9BD1" },
                { name: "Travel", amount: categoryMap["Travel"], color: "#B394C6" },
                { name: "Shopping", amount: categoryMap["Shopping"], color: "#E08E99" },
                { name: "Others", amount: categoryMap["Others"], color: "#96BE8C" },
        ];
        }
    }
};
</script>

<style scoped>
.dashboard {
    display: flex;
    flex-direction: column;
    /* Ensure add button is below main content */
    width: 100vw;
    padding: var(--padding-body);
    gap: 3rem;
}

.content {
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: row;
    flex-grow: 1;
    width: 100%;
}

@media (max-width: 1000px) {
    .content {
        flex-direction: column;
    }
}
</style>