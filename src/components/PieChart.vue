<template>
  <div class="pie-chart-container">
    <div class="pie-chart">
      <canvas ref="chartCanvas"></canvas>
      <div class="center-text">
        <img src="@/assets/turtles/pigTurtle.png" alt="Turtle" />
        <p>${{ totalAmount.toFixed(2) }}</p>
      </div>
    </div>
    <h4 id="cashflowMonth">February's Cash Flow</h4>
  </div>
</template>

<script>
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";

export default {
  props: ["totalAmount", "categories"],
  mounted() {
    this.createChart();
  },
  watch: {
    totalAmount() {
      this.updateChart();
    },
    categories() {
      this.updateChart();
    },
  },
  methods: {
    createChart() {
      Chart.register(ArcElement, Tooltip, Legend, DoughnutController);
      this.chart = new Chart(this.$refs.chartCanvas, {
        type: "doughnut",
        data: {
          labels: this.categories.map(c => c.name),
          datasets: [
            {
              data: this.categories.map(c => c.amount),
              backgroundColor: this.categories.map(c => c.color),
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          cutout: "70%", /* Makes space for turtle */
          plugins: {
            legend: { display: false },
          },
        },
      });
    },
    updateChart() {
      if (this.chart) {
        this.chart.data.labels = this.categories.map(c => c.name);
        this.chart.data.datasets[0].data = this.categories.map(c => c.amount);
        this.chart.data.datasets[0].backgroundColor = this.categories.map(c => c.color);
        this.chart.update();
      }
    },
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.destroy();
    }
  },
};
</script>

<style scoped>
/* Wrapper to center everything */
.pie-chart-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

/* Pie chart should be centered */
.pie-chart {
  position: relative;
  width: 300px;
  height: 300px;
  margin: 20px 50px 1px 50px;
}

/* Turtle & text inside the chart */
.center-text {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  color: #3d5538;
}

/* Turtle is properly sized */
.center-text img {
  width: 120px;
  height: 120px;
  object-fit: contain;
}

/* Amount text styling */
.center-text p {
  font-size: 18px;
  font-weight: bold;
  margin: 5px 0;
  color: #3d5538;
}

/* "February's Cash Flow" below the chart */
#cashflowMonth {
  margin-top: 15px;
  text-align: center;
  color: #3d5538;
  font-weight: bold;
  font-size: 18px;
}
</style>
