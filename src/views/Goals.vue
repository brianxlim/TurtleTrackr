<template>
    <div class = "bar">
        <DateSelection />
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
                        <button class="change-goals" @click="showGoalSetter = true">Change Goals</button>
                    </div>
                </div>
            </div>
            <GoalSetter
            v-if="showGoalSetter"
            :categories="categories"
            :totalSet="totalSet"
            @close="showGoalSetter = false"
            @updateGoals="setGoals"
            />
        </div>
    </div>
</template>

<script>
import { db, auth } from "@/firebase";
import { doc, collection, addDoc, getDocs, query, where, Timestamp, setDoc } from "firebase/firestore";

import GoalPieChart from "@/components/GoalPieChart.vue";
import NavBar from "@/components/NavBar/NavBar.vue";
import DateSelection from "@/components/DateSelection.vue";
import GoalSetter from "@/components/GoalSetter.vue";
import IndividualGoals from "@/components/IndividualGoals.vue";

export default {
    components: {
        GoalPieChart,
        NavBar,
        DateSelection,
        GoalSetter,
        IndividualGoals,
    },
    data() {
        return {
            showGoalSetter: false,
            isLoading: true,
            totalSet: 0,
            totalSpent: 0,
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

            const userGoalsRef = collection(db, "Users", user.uid, "Goals");

            const q = query(userGoalsRef, where("month", "==", currentMonth));
            const querySnapshot = await getDocs(q);

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
            if (!querySnapshot.empty) {
                // Document exists — update it
                const docRef = doc(db, "Users", user.uid, "Goals", querySnapshot.docs[0].id);
                await setDoc(docRef, goalData);
                console.log("✅ Existing goals updated in Firestore.");
            } else {
                // Document does not exist — create new
                await addDoc(userGoalsRef, {
                    ...goalData,
                    createdAt: new Date()
                });
                console.log("✅ New goals snapshot added to Firestore.");
            }

                alert("🎯 Your goals have been successfully saved.");
            } catch (error) {
                console.error("❌ Error saving goals to Firestore:", error);
            }
        },
        async loadGoalsFromFirestore() {
            const user = auth.currentUser;
            if (!user) {
                console.warn("⚠️ No user is logged in.");
                return;
            }

            const now = new Date();
            const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

            try {
                const userGoalsRef = collection(db, "Users", user.uid, "Goals");
                const q = query(userGoalsRef, where("month", "==", currentMonth));
                const querySnapshot = await getDocs(q);

                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs[0].data();
                    this.totalSet = data.totalSet;
                    this.totalSpent = data.totalSpent;
                    this.categories = data.categories.map(c => ({
                        name: c.name,
                        amount: c.spent,
                        setAmount: c.setAmount,
                        color: this.getColorForCategory(c.name) // retain consistent colors
                    }));
                    console.log("✅ Goals loaded from Firestore.");
                } else {
                    console.log("📭 No goals found for this month. Using default.");
                }
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