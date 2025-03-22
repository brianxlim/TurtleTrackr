<template>
    <div class = "bar">
        <DateSelection />
    </div>
    <div class="dashboard">
      <div class="content">
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
            totalSet: 2490,
            totalSpent: 1374.8,
            categories: [
                { name: "Food", amount: 438.8, setAmount:750, color: "#6F9BD1" },
                { name: "Travel", amount: 130.5, setAmount:100, color: "#B394C6" },
                { name: "Shopping", amount: 739.1, setAmount:1500, color: "#E08E99" },
                { name: "Others", amount: 66.4, setAmount:140, color: "#96BE8C" },
            ],
        };
    },
    methods: {
        setGoals({ categories, goalAmount }) {
            this.categories = categories;
            this.totalSet = goalAmount;
            this.showGoalSetter = false;
        }
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

@media (max-width: 1000px) {
    .content {
        flex-direction: column;
    }
}
</style>