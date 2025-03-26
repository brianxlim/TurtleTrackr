<template>
    <div class="date-selection">
        <div class="leftside">
            <button @click="previousYear"> << </button>
            <button @click="previousMonth"> < </button>
        </div>
        <span>{{ formattedDate }}</span>
        <div class="rightside">
            <button @click="nextMonth"> > </button>
            <button @click="nextYear"> >> </button>
        </div>
    </div>
</template>

<script>
export default {
    data() {
        const current = new Date();
        return {
            currentMonth: current.getMonth() + 1,
            currentYear: current.getFullYear()
        };
    },
    computed: {
        formattedDate() {
            return new Date(this.currentYear, this.currentMonth - 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        }
    },
    methods: {
        currentDate() {
            const current = new Date();
            return current;
        },
        previousMonth() {
            if (this.currentMonth === 1) {
                this.currentMonth = 12;
                this.currentYear--;
            } else {
                this.currentMonth--;
            }
            this.emitChange();
        },
        nextMonth() {
            if (this.currentMonth === 12) {
                this.currentMonth = 1;
                this.currentYear++;
            } else {
                this.currentMonth++;
            }
            this.emitChange();
        },
        previousYear() {
            this.currentYear--;
            this.emitChange();
        },
        nextYear() {
            this.currentYear++;
            this.emitChange();
        },
        emitChange() {
            this.$emit('month-changed', {
                year: this.currentYear,
                month: this.currentMonth,
            });
        }
    }
}
</script>

<style scoped>
.date-selection {
    display: flex;
    justify-content: space-between;
    text-align: center;
    align-items: center;
    gap: 20vw;
    padding: 10px;
    font-size: 1.6em;
    font-weight: bold;
}

.leftside {
    display: flex;
    gap: 20px;
}

.rightside {
    display: flex;
    gap: 20px;
}
</style>
