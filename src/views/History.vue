<template>
  <div>
    <h1 class="historyHeading">Spending History</h1>
    <ExpenseList :uid="uidToFetch" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import { useRoute } from "vue-router";
import ExpenseList from "@/components/ExpenseList.vue";
import { auth } from "@/firebase";

const route = useRoute();
const uidToFetch = computed(() => route.params.uid || auth.currentUser?.uid);
</script>

<style>
.historyHeading {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  margin-left: 10px;
}
</style>
