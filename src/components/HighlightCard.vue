<template>
    <div class="highlight-card">
        <h3>{{ userName }} spent ${{ amount.toFixed(2) }}</h3>
        <p><strong>{{ title }}</strong> on {{ formattedDate }}</p>
    </div>
</template>
  
<script>
export default {
    props: {
        title: String,
        amount: Number,
        userName: String,
        date: String
    },
    computed: {
        formattedDate() {
            return new Date(this.date).toLocaleDateString();
        }
    }
}
</script>
  
<style scoped>
.highlight-card {
    background: #e8bb82;
    border-radius: 12px;
    padding: 12px 20px;
    width: 100%;
    margin: 10px 0;
    /* Full width within container */
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
    text-align: left;
    
}

h3,p {
    margin: 0;
    padding: 0;
}

p {
    font-size: 0.9rem;
    color: #555;
}
</style>