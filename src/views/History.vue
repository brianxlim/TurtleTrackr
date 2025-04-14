<template>
  <div>
    <h1 class="historyHeading">Spending History</h1>
    <ExpenseList :uid="uidToFetch" />
  </div>
</template>

<script setup>
import { computed } from "vue";
import ExpenseList from "@/components/ExpenseList.vue";
import { auth } from "@/firebase";


const props = defineProps({
  uid: {
    type: String,
    default: null
  }
});

const uidToFetch = computed(() => props.uid || auth.currentUser?.uid);
</script>

<style>
.historyHeading {
  font-size: 2rem;
  font-weight: bold;
  margin-bottom: 1rem;
  margin-left: 10px;
}
</style>
