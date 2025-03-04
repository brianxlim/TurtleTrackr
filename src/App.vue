<template>
  <div class="dashboard">
    <NavBar />
<br>
    <div class="content">
      
      <PieChart :totalAmount="totalAmount" :categories="categories" />
      <br>
      <Breakdown :categories="categories" />
      
    </div>

    <button class="add-button">+</button>
  </div>
</template>

<script>
import PieChart from "@/components/PieChart.vue";
import Breakdown from "@/components/Breakdown.vue";
import NavBar from "@/components/NavBar.vue";

export default {
  components: {
    PieChart,
    Breakdown,
    NavBar,
  },
  data() {
    return {
      totalAmount: 1374.8,
      categories: [
        { name: "Food", amount: 438.8, color: "#6F9BD1" },
        { name: "Travel", amount: 130.5, color: "#B394C6" },
        { name: "Shopping", amount: 739.1, color: "#E08E99" },
        { name: "Others", amount: 66.4, color: "#96BE8C" },
      ],
    };
  },
};
</script>

<style scoped>

/* Ensure the entire viewport is used */
.dashboard {
  background-color: #f8e8d2;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: 20px;
  width: 100vw; /* Ensure it takes full width */
  box-sizing: border-box; /* Prevent unintended shrinking due to padding */
}

/* Make content expand fully */
.content {
  display: flex;
  justify-content: space-between;
  align-items: stretch; /* Make sure it takes up full height */
  flex-grow: 1;
  width: 100%; /* Ensures full width */
}

/* Ensure child components (PieChart & Breakdown) expand properly */
.pie-chart,
.breakdown {
  flex: 1; /* Make both components take equal space */

}

.pie-chart {
  display: flex;
  justify-content: center;
  align-items: center;
}

.breakdown {
  display: flex;
  flex-direction: column;
  justify-content: center;
}

</style>