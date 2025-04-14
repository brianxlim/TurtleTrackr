<template>
    <div class = "bar">
        <DateSelection @month-changed="handleMonthChange" />
    </div>
    <div class="dashboard">
        <div v-if="isLoading" class="loading-container">
            <div class="spinner"></div>
            <p>Loading your goals...</p>
        </div>

        <div v-if="!isLoading" class="content">
            <GoalPieChart :totalSet="totalSet" :categories="categories" :totalSpent="totalSpent" />
            <div class="progress-container">
                <div class="progressbar">
                    <div v-for="category in categories" :key="category.name">
                        <IndividualGoals :category="category" :totalSet="totalSet"/>
                    </div>
                    <div class="button">
                        <button class="change-goals" 
                        @click="showGoalSetter = true"
                        :disabled="!isCurrentMonth"
                    >
                    Change Goals</button>
                    </div>
                </div>
            </div>
            <GoalSetter
            v-if="showGoalSetter"
            :categories="categories"
            :totalSet="totalSet"
            :force="forceSetGoal"
            @close="handleGoalSetterClose"
            @updateGoals="setGoals"
            />
        </div>
    </div>
</template>

<script>
import { db, auth } from "@/firebase";
import { doc, collection, addDoc, getDoc, getDocs, query, where, Timestamp, setDoc, onSnapshot } from "firebase/firestore";

import GoalPieChart from "@/components/Goals/GoalPieChart.vue";
import NavBar from "@/components/NavBar/NavBar.vue";
import DateSelection from "@/components/DateSelection.vue";
import GoalSetter from "@/components/Goals/GoalSetter.vue";
import IndividualGoals from "@/components/Goals/IndividualGoals.vue";

export default {
    components: {
        GoalPieChart,
        NavBar,
        DateSelection,
        GoalSetter,
        IndividualGoals,
    },
    data() {
        const now = new Date();
        return {
            showGoalSetter: false,
            forceSetGoal: false,
            isLoading: true,
            totalSet: 0,
            totalSpent: 0,
            selectedYear: now.getFullYear(),
            selectedMonth: now.getMonth() + 1,
            categories: [
                { name: "Food", amount: 0, setAmount:0, color: "#6F9BD1" },
                { name: "Travel", amount: 0, setAmount:0, color: "#B394C6" },
                { name: "Shopping", amount: 0, setAmount:0, color: "#E08E99" },
                { name: "Others", amount: 0, setAmount:0, color: "#96BE8C" },
            ],
        };
    },
    mounted() {
        this.loadGoalsFromFirestore();
        this.setupExpenseListener();
    },
    computed: {
        isCurrentMonth() {
            const now = new Date();
            return this.selectedYear === now.getFullYear() && this.selectedMonth === (now.getMonth() + 1);
        }
    },
    methods: {
        async setGoals({ categories, goalAmount }) {
            this.categories = categories;
            this.totalSet = goalAmount;
            this.showGoalSetter = false;

            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

            const user = auth.currentUser;
            if (!user) {
                console.warn("⚠️ No authenticated user.");
                return;
            }

            const userGoalsRef = doc(db, "Users", user.uid, "Goals", currentMonth);
            const querySnapshot = await getDoc(userGoalsRef);

            const goalData = {
                month: currentMonth,
                totalSet: goalAmount,
                totalSpent: this.totalSpent,
                categories: categories.map(c => ({
                    name: c.name,
                    spent: c.amount,
                    setAmount: c.setAmount
                })),
                updatedAt: new Date()
            };

            try {
            if (querySnapshot.exists()) {
                // Document exists — update it
                const docRef = doc(db, "Users", user.uid, "Goals", currentMonth);
                await setDoc(docRef, goalData);
                console.log("✅ Existing goals updated in Firestore.");
            } else {
                // Document does not exist — create new
                const docRef = doc(db, "Users", user.uid, "Goals", currentMonth);
                await setDoc(docRef, goalData);
                console.log("✅ New goals snapshot added to Firestore.");
            }

                alert("🎯 Your goals have been successfully saved.");
            } catch (error) {
                console.error("❌ Error saving goals to Firestore:", error);
            }

            this.forceSetGoal = false;
        },
        async loadGoalsFromFirestore() {
            const user = auth.currentUser;
            if (!user) {
                console.warn("⚠️ No user is logged in.");
                return;
            }

            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
            const userGoalsRef = doc(db, "Users", user.uid, "Goals", currentMonth);

            try {
                const querySnapshot = await getDoc(userGoalsRef);

                // Start with defaults
                let goalsData = {
                    totalSet: 0,
                    categories: [
                        { name: "Food", setAmount: 0 },
                        { name: "Travel", setAmount: 0 },
                        { name: "Shopping", setAmount: 0 },
                        { name: "Others", setAmount: 0 },
                    ]
                };

                if (querySnapshot.exists()) {
                    const data = querySnapshot.data();
                    goalsData.totalSet = data.totalSet;
                    goalsData.categories = data.categories;
                    console.log("✅ Goals loaded from Firestore.");
                } else {
                    console.log("📭 No goals found for this month. Using default set amounts.");
                    // Force users to set up Goals
                    if (this.isCurrentMonth) {
                        this.showGoalSetter = true;
                        this.forceSetGoal = true;
                    }
                }

                // Load real-time spendings from "Expenses"
                const expenseRef = collection(db, "Users", user.uid, "Expenses");
                const expensesSnapshot = await getDocs(expenseRef);

                let categoryMap = {
                    Food: 0,
                    Travel: 0,
                    Shopping: 0,
                    Others: 0,
                };
                let totalSpent = 0;

                expensesSnapshot.forEach((doc) => {
                    const data = doc.data();
                    const amount = parseFloat(data.Amount) || 0;
                    const date = new Date(data.Date);
                    const expenseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                    const selectedMonth = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;

                    if (expenseMonth === selectedMonth) {
                        totalSpent += amount;
                        const category = categoryMap.hasOwnProperty(data.Category) ? data.Category : "Others";
                        categoryMap[category] += amount;
                    }
                });

                // Combine setAmount with real-time spent
                this.categories = goalsData.categories.map((c) => ({
                    name: c.name,
                    amount: categoryMap[c.name] || 0,       // real-time spending
                    setAmount: c.setAmount,                 // set target from Firestore
                    color: this.getColorForCategory(c.name) // retain color
                }));

                this.totalSet = goalsData.totalSet;
                this.totalSpent = totalSpent;

            } catch (error) {
                console.error("❌ Error loading goals:", error);
            }

            this.isLoading = false;
        },
        getColorForCategory(categoryName) {
            const defaultColors = {
                Food: "#6F9BD1",
                Travel: "#B394C6",
                Shopping: "#E08E99",
                Others: "#96BE8C",
            };
            return defaultColors[categoryName] || "#ccc";
        },
        async handleMonthChange({ year, month }) {
            this.isLoading = true;

            this.selectedMonth = month;
            this.selectedYear = year;

            const selectedMonth = `${year}-${String(month).padStart(2, '0')}`;
            const user = auth.currentUser;
            if (!user) return;

            try {
                const userGoalsRef = doc(db, "Users", user.uid, "Goals", selectedMonth);
                const snapshot = await getDoc(userGoalsRef);

                if (snapshot.exists()) {
                const data = snapshot.data();
                this.totalSet = data.totalSet;
                this.totalSpent = data.totalSpent;
                this.categories = data.categories.map(c => ({
                    name: c.name,
                    amount: c.spent,
                    setAmount: c.setAmount,
                    color: this.getColorForCategory(c.name)
                }));
                console.log("✅ Goals loaded for selected month:", selectedMonth);
                } else {
                console.log("📭 No goals found for selected month. Backfilling...");
                // Fallback to default goal structure
                const defaultCategories = this.categories.map((c) => ({
                    name: c.name,
                    setAmount: 0,
                    spent: 0
                }));

                // Reflect this new default in UI
                this.totalSpent = 0;
                this.totalSet = 0;
                this.categories = defaultCategories.map((c) => ({
                    ...c,
                    amount: 0,
                    color: this.getColorForCategory(c.name)
                }));

                console.log("📦 Backfilled snapshot created for", selectedMonth);
                }
            } catch (error) {
                console.error("❌ Failed to handle month change:", error);
            }
            this.isLoading = false;
        },
        handleGoalSetterClose() {
            if(this.forceSetGoal) {
                return;
            }
            this.showGoalSetter = false;
        },
        //in experiment, currently does help update database value automatically, but not sure if the naming convention of document ID under subcollection "Goals" will still be YYYY-MM, or will it go back to just random IDs
        setupExpenseListener() {
            const user = auth.currentUser;
            if (!user) return;

            const expenseRef = collection(db, "Users", user.uid, "Expenses");

            onSnapshot(expenseRef, async (snapshot) => {
            const currentMonth = `${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}`;
            const categoryMap = {
                Food: 0,
                Travel: 0,
                Shopping: 0,
                Others: 0,
            };
            let totalSpent = 0;

            snapshot.forEach(doc => {
                const data = doc.data();
                const amount = parseFloat(data.Amount || 0);
                const date = new Date(data.Date);
                const expenseMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
                if (expenseMonth === currentMonth) {
                    totalSpent += amount;
                    const cat = categoryMap.hasOwnProperty(data.Category) ? data.Category : "Others";
                    categoryMap[cat] += amount;           
                }
            });

            // Update UI in real-time
            this.totalSpent = totalSpent;
            this.categories = this.categories.map(c => ({
                ...c,
                amount: categoryMap[c.name] || 0
            }));

            // Also update Firestore "Goals" subcollection
            const userGoalsRef = doc(db, "Users", user.uid, "Goals", currentMonth);
            const docSnapshot = await getDoc(userGoalsRef);

            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                const updatedData = {
                ...data,
                totalSpent,
                categories: data.categories.map((c) => ({
                    ...c,
                    spent: categoryMap[c.name] || 0
                })),
                updatedAt: new Date()
                };

                await setDoc(userGoalsRef, updatedData, { merge: true });
                console.log("🔥 Real-time Goal spending updated");
            }
            });
        },
    },
};
</script>

<style scoped>
.dashboard {
    display: flex;
    flex-direction: column; /* Ensure add button is below main content */
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

.progress-container {
    width: 100%;
    display: flex;
    justify-content: center;
}

.progressbar {
    background-color: #dbc49d;
    padding: 20px;
    border-radius: 10px;
    width: 80%;
    display: flex;
    flex-direction: column;
    gap: 10px;  /* Adds spacing between individual categories */
}

.bar {
    margin-top: 20px;
}

.button {
    text-align: center;
}

.change-goals {
    background-color: #FFF3DC;
    border: none;
    padding: 7px 7px;
    border-radius: 5px;
    font-weight: bold;
    cursor: pointer;
    box-shadow: 2px 2px 5px rgba(0, 0, 0, 0.1);
    width: 100%; 
    max-width: 200px;
    text-align: center;
    font-size: medium;
}

.change-goals:hover {
    background-color: #f2e3c6;
}

.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  font-weight: bold;
  font-size: 1.2em;
  color: #3d5538;
}

.spinner {
  border: 5px solid #f3f3f3;
  border-top: 5px solid #3d5538;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin-bottom: 10px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@media (max-width: 1000px) {
    .content {
        flex-direction: column;
    }
}
</style>