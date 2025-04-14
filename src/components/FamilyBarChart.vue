<template>
  <div class="chart-wrapper">
    <div class="left-panel">
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
      <div class="bar-chart-container">
        <canvas v-if="ready" ref="chartCanvas"></canvas>
      </div>
    </div>

    <div class="custom-legend">
      <h3>Members</h3>
      <ul>
        <li
          v-for="(member, i) in members"
          :key="i"
          class="member-legend-item"
          @click="goToMember(member.uid)"
        >
          <span
            class="color-box"
            :style="{ backgroundColor: colorPalette[i % colorPalette.length] }"
          ></span>
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
      required: true,
    },
  },
  data() {
    return {
      chart: null,
      selectedCategory: "Overall",
      ready: true,
      creating: false,
      colorPalette: ["#6F9BD1", "#B394C6", "#E08E99", "#96BE8C"],
    };
  },
  mounted() {
    this.createChart();
  },
  methods: {
    async createChart() {
      if (!this.ready) return;
      const canvas = this.$refs.chartCanvas;
      const ctx = canvas?.getContext?.("2d");
      if (!ctx) return;

      const existing = Chart.getChart(canvas);
      if (existing) existing.destroy();

      Chart.register(BarController, BarElement, CategoryScale, LinearScale, Tooltip, Legend);

      const labels = this.members.map((m) => m.name);
      const data = this.members.map((m) =>
        this.selectedCategory === "Overall"
          ? Object.values(m.categories || {}).reduce((a, b) => a + b, 0)
          : m.categories?.[this.selectedCategory] || 0
      );

      this.chart = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: `${this.selectedCategory} Spending`,
              data,
              backgroundColor: this.colorPalette,
            },
          ],
        },
        options: {
          responsive: true,
          plugins: {
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => `$${context.parsed.y.toFixed(2)}`,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              grace: "10%",
              ticks: {
                callback: (val) => `$${val}`,
              },
            },
          },
          animation: {
            onProgress: (animation) => {
              const chart = animation.chart;
              const ctx = chart.ctx;
              ctx.font = "bold 12px Poppins";
              ctx.fillStyle = "#444";
              ctx.textAlign = "center";
              ctx.textBaseline = "bottom";

              chart.data.datasets[0].data.forEach((value, i) => {
                const meta = chart.getDatasetMeta(0).data[i];
                if (meta) {
                  const x = meta.x;
                  const y = meta.y;
                  ctx.fillText(`$${value.toFixed(2)}`, x, y - 6);
                }
              });
            },
          },
        },
      });
    },

    async selectCategory(cat) {
      if (this.creating) return;
      const scrollY = window.scrollY;
      this.selectedCategory = cat;
      this.creating = true;

      if (this.chart) {
        const existingChart = Chart.getChart(this.$refs.chartCanvas);
        if (existingChart) existingChart.destroy();
      }

      await this.createChart();
      window.scrollTo({ top: scrollY, behavior: "instant" });
      this.creating = false;
    },

    goToMember(uid) {
      this.$emit("member-click", uid); 
      console.log("📦 Emitting member-click for uid:", uid);
    },

    beforeUnmount() {
      if (this.chart) this.chart.destroy();
    },
  },
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
.custom-legend ul {
  list-style: none;
  padding: 0;
}
.custom-legend li {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
  font-size: 12px;
  color: #444;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 5px;
  background-color: #e8bb82;
  transition: background-color 0.2s;
}

.custom-legend li:hover {
  background-color: #dce4dc;
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
  border: 1px solid black;
}
.category-selector button.active {
  background-color: #3d5538;
  color: white;
  border-color: #3d5538;
}
</style>
