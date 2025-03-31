<template>
    <div class="pie-chart-container">
      <div class="pie-chart">
        <canvas ref="chartCanvas"></canvas>
        <div class="center-text">
          <h2 v-if="totalSpent < totalSet" class="within-budget">${{ totalSpent.toFixed(2) }} / ${{ totalSet.toFixed(2) }}</h2>
          <h2 v-else class="exceed-budget">${{ totalSpent.toFixed(2) }} / ${{ totalSet.toFixed(2) }}</h2>
        </div>
      </div>
    </div>
</template>
  
<script>
import { Chart, ArcElement, Tooltip, Legend, DoughnutController } from "chart.js";
  
export default {
    props: ["totalSet", "totalSpent", "categories"],
    mounted() {
      this.createChart();
    },
    watch: {
      totalSet() {
        this.updateChart();
      },
      totalSpent() {
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
                data: this.getChartData(),
                options: {
                    responsive: true,
                    cutout: "70%", /* Makes space for center text */
                    plugins: {
                        legend: { display: false },
                    },
                },
            });
        },
        updateChart() {
            if (this.chart) {
                this.chart.data = this.getChartData();
                this.chart.update();
            }
        },
        getChartData() {
            let remainingAmount = Math.max(0, this.totalSet - this.totalSpent);
            
            return {
                labels: [...this.categories.map(c => c.name), "Remaining Budget"],
                datasets: [
                    {
                        data: [...this.categories.map(c => c.amount), remainingAmount],
                        backgroundColor: [...this.categories.map(c => c.color), "#D3D3D3"], // Grey for remaining
                        borderWidth: 2,
                    },
                ],
            };
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
  
/* Text inside the chart */
.center-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    text-align: center;
    color: #3d5538;
}
.within-budget {
    color:#3d5538
}

.exceed-budget {
    color: red;
}

</style>
  