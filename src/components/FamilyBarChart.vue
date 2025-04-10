@ -0,0 +1,288 @@
<template>
  <div class="chart-wrapper">
  <div class="left-panel">
    <!-- Category buttons -->
    <div class="category-selector">
      <button
        v-for="cat in ['Overall', 'Food', 'Travel', 'Shopping', 'Others']"
        :key="cat"
        :class="{ active: selectedCategory === cat }"
        @click="selectCategory(cat)"
      >
        {{ cat }}
      </button>
    </div>

    <!-- chart -->
    <div class="bar-chart-container">
      <canvas v-if="ready" ref="chartCanvas"></canvas>
    </div>
  </div>

  <!-- legend -->
  <div class="custom-legend">
    <h3>Members</h3>
    <ul>
      <li v-for="(member, i) in members" :key="i">
        <span class="color-box" :style="{ backgroundColor: colorPalette[i % colorPalette.length] }"></span>
        {{ member.name }}
      </li>
    </ul>
  </div>
</div>
</template>


<script>
import {
  Chart,
  BarController,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
} from "chart.js";

export default {
  props: {
    members: {
      type: Array,
      required: true
    }
  },
  data() {
    return {
      chart: null,
      selectedCategory: "Overall",
      ready: true,
      creating: false,
      colorPalette: ["#6F9BD1", "#B394C6", "#E08E99", "#96BE8C"]
    };
  },
  mounted() {
    console.log("Mounted: creating initial chart");
    this.createChart();
  },
  methods: {
    async createChart() {
      if (!this.ready) {
        console.warn("❌tried to create chart while not ready");
        this.creating = false;
        return;
      }

      const canvas = this.$refs.chartCanvas;
      const ctx = canvas?.getContext?.("2d");
//jic ctx not ready
      if (!ctx) {
        console.warn("🚫canvas context not available");
        return;
      }

      // destroy old chart to replace with new one
      const existing = Chart.getChart(canvas);
      if (existing) {
        console.log("🧨 Existing chart still active — destroying first");
        existing.destroy();
      }

      Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

      const labels = this.members.map(m => m.name);
      const data = this.members.map(m =>
        this.selectedCategory === "Overall"
          ? Object.values(m.categories || {}).reduce((a, b) => a + b, 0)
          : m.categories?.[this.selectedCategory] || 0
      );


      console.log("📊 Rendering chart for:", this.selectedCategory, data);

      this.chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [{
            label: `${this.selectedCategory} Spending`,
            data,
            backgroundColor: this.colorPalette
          }]
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: context => `$${context.parsed.y.toFixed(2)}`
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              grace: '10%',
              ticks: {
                callback: val => `$${val}`
              }
            }
          },
          animation: {
            onProgress: (animation) => {
              const chart = animation.chart;
              const ctx = chart.ctx;

              ctx.font = 'bold 12px Poppins';
              ctx.fillStyle = '#444';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'bottom';

              chart.data.datasets[0].data.forEach((value, i) => {
                const meta = chart.getDatasetMeta(0).data[i];
                if (meta) {
                  const x = meta.x;
                  const y = meta.y;
                  ctx.fillText(`$${value.toFixed(2)}`, x, y - 6);
                }
              });
            }
          }

        }
      });
      console.log("chart rendering with members:", this.members);
      this.creating = false;
    },

    async selectCategory(cat) {
  console.log("👉switching to category:", cat);

  if (this.creating) {
    console.warn("⚠️already creating chart, skipping...");
    return;
  }

// this is to prevent page being scrolled up everytime new chart is created
  const scrollY = window.scrollY;

  this.selectedCategory = cat;
  this.creating = true;

  // 🧨 destroy old charts
  if (this.chart) {
    const existingChart = Chart.getChart(this.$refs.chartCanvas);
    if (existingChart) {
      existingChart.destroy();
      console.log("✅ Chart destroyed");
    }
  }

  await this.createChart();

  //restore the scroll position
  window.scrollTo({ top: scrollY, behavior: 'instant' }); 
}
,


    beforeUnmount() {
      if (this.chart) {
        console.log("Destroying chart on unmount");
        this.chart.destroy();
      }
    }
  }
};
</script>

<style scoped>
.chart-wrapper {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 40px;
  margin: 20px;
  flex-wrap: wrap;
}


.left-panel {
  flex: 2;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.bar-chart-container {
  flex: 1;
  min-width: 300px;
  max-width: 100%;
}

.custom-legend {
  flex: 1;
  max-width: 220px;
  padding-top: 20px;
}

.custom-legend h3 {
  font-size: px;
  margin-bottom: 15px;
  color: #333;
}

.custom-legend ul {
  list-style: none;
  padding: 0;
}

.custom-legend li {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 9px;
  color: #444;
}

.color-box {
  width: 16px;
  height: 16px;
  margin-right: 10px;
  border-radius: 3px;
}

.category-selector {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 0px;
  margin-bottom: 20px;
}

.category-selector button {
  padding: 6px 12px;
  border: 1px solid #ccc;
  background: #eee;
  cursor: pointer;
  border-radius: 4px;
  font-size: 11px;
  transition: background 0.2s;
  border: 1px solid black
}

.category-selector button.active {
  background-color: #3d5538;
  color: white;
  border-color: #3d5538;
}
</style>